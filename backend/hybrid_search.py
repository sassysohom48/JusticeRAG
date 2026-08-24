from typing import List, Dict, Any, Tuple
from qdrant_client import QdrantClient
from sentence_transformers import SentenceTransformer
from bm25_search import BM25SearchEngine, bm25_engine

class HybridLegalSearchEngine:
    """
    Hybrid Legal RAG Engine combining:
    1. Sparse Lexical BM25 (Statutes, Sections, Citations)
    2. Dense Vector BGE-small (Semantic & Factual Nuance)
    3. Reciprocal Rank Fusion (RRF) for robust multi-modal legal ranking.
    """
    def __init__(
        self,
        embedder: SentenceTransformer,
        qdrant: QdrantClient,
        collection_name: str = "indian_case_law",
        bm25: BM25SearchEngine = bm25_engine,
        rrf_k: int = 60
    ):
        self.embedder = embedder
        self.qdrant = qdrant
        self.collection_name = collection_name
        self.bm25 = bm25
        self.rrf_k = rrf_k  # Standard RRF smoothing constant

    def search(
        self,
        query: str,
        top_k: int = 4,
        candidate_pool_size: int = 15
    ) -> List[Tuple[Dict[str, Any], float]]:
        """
        Executes Hybrid Retrieval using Reciprocal Rank Fusion (RRF).
        Formula: Score(d) = sum_{m in {bm25, dense}} [ 1 / (k + rank_m(d)) ]
        """
        # 1. BM25 Sparse Candidates
        bm25_hits = self.bm25.search(query, top_k=candidate_pool_size)
        
        # 2. Dense Semantic Vector Candidates
        query_vector = self.embedder.encode(query).tolist()
        dense_hits = self.qdrant.query_points(
            collection_name=self.collection_name,
            query=query_vector,
            limit=candidate_pool_size
        ).points

        # Dictionary to store accumulated RRF scores & case payload
        # key: case_id or case_name
        case_store: Dict[int, Dict[str, Any]] = {}
        rrf_scores: Dict[int, float] = {}
        dense_score_map: Dict[int, float] = {}
        bm25_score_map: Dict[int, float] = {}

        # Process BM25 Ranks (1-indexed)
        for rank, (payload, score) in enumerate(bm25_hits, start=1):
            case_id = payload["id"]
            case_store[case_id] = payload
            bm25_score_map[case_id] = score
            rrf_scores[case_id] = rrf_scores.get(case_id, 0.0) + (1.0 / (self.rrf_k + rank))

        # Process Dense Vector Ranks (1-indexed)
        for rank, hit in enumerate(dense_hits, start=1):
            case_id = hit.id
            if case_id not in case_store:
                case_store[case_id] = {
                    "id": hit.id,
                    "case_name": hit.payload.get("case_name", f"Case {hit.id}"),
                    "text": hit.payload.get("text", ""),
                    "summary": hit.payload.get("summary", "")
                }
            dense_score_map[case_id] = hit.score
            rrf_scores[case_id] = rrf_scores.get(case_id, 0.0) + (1.0 / (self.rrf_k + rank))

        # Sort all candidates by RRF score descending
        sorted_ids = sorted(rrf_scores.keys(), key=lambda cid: rrf_scores[cid], reverse=True)[:top_k]

        max_rrf = max(rrf_scores.values()) if rrf_scores else 1.0

        results = []
        for cid in sorted_ids:
            payload = case_store[cid]
            raw_rrf = rrf_scores[cid]
            
            # Intuitively scale the hybrid score to 70% - 98% based on consensus between sparse & dense
            has_bm25 = cid in bm25_score_map
            has_dense = cid in dense_score_map
            
            if has_bm25 and has_dense:
                # Strong multi-modal consensus
                normalized_score = round(min(0.97, 0.78 + (raw_rrf / max_rrf) * 0.19), 4)
            else:
                normalized_score = round(min(0.85, 0.65 + (raw_rrf / max_rrf) * 0.18), 4)

            results.append((payload, normalized_score))

        return results
