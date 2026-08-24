import json
import csv
import os
import re
import math
from typing import List, Dict, Any, Tuple
from rank_bm25 import BM25Okapi

STOPWORDS = {
    "a", "an", "the", "and", "or", "in", "on", "at", "to", "for", "with", "by", "from",
    "of", "as", "is", "was", "were", "be", "been", "being", "have", "has", "had",
    "this", "that", "these", "those", "it", "its", "they", "them", "their", "we", "us",
    "i", "my", "me", "you", "your", "he", "him", "his", "she", "her", "which", "who", "whom"
}

def legal_tokenize(text: str) -> List[str]:
    """Tokenizes text into normalized lowercase tokens suitable for legal search."""
    if not text:
        return []
    # Replace non-alphanumeric characters with space but preserve words and numbers
    cleaned = re.sub(r"[^\w\s]", " ", text.lower())
    tokens = [t for t in cleaned.split() if t not in STOPWORDS and len(t) > 1]
    return tokens

class BM25SearchEngine:
    def __init__(self, data_path: str = "data/cases.json"):
        self.data_path = data_path
        self.cases: List[Dict[str, Any]] = []
        self.corpus_tokens: List[List[str]] = []
        self.bm25: BM25Okapi = None
        self._load_and_index()

    def _load_and_index(self):
        # Find available cases file
        paths_to_try = [
            self.data_path,
            "data/cases.json",
            "data/sample_cases.json",
            "data/cases.csv",
            "data/sample_cases.csv"
        ]
        
        target_path = None
        for p in paths_to_try:
            if os.path.exists(p):
                target_path = p
                break
                
        if not target_path:
            print(f"Warning: No cases file found for BM25 indexing.")
            return

        print(f"Initializing BM25 Index from {target_path}...")
        if target_path.endswith(".json"):
            with open(target_path, "r", encoding="utf-8") as f:
                self.cases = json.load(f)
        elif target_path.endswith(".csv"):
            import sys
            csv.field_size_limit(min(2147483647, sys.maxsize))
            with open(target_path, "r", encoding="utf-8", errors="ignore") as f:
                reader = csv.DictReader(f)
                for i, row in enumerate(reader):
                    self.cases.append({
                        "id": int(row.get("id", i + 1)),
                        "case_name": row.get("case_name", f"Case {i+1}"),
                        "text": row.get("text", ""),
                        "summary": row.get("summary", "")
                    })

        self.corpus_tokens = []
        for case in self.cases:
            combined_text = f"{case.get('case_name', '')} {case.get('summary', '')} {case.get('text', '')}"
            tokens = legal_tokenize(combined_text)
            self.corpus_tokens.append(tokens)

        if self.corpus_tokens:
            self.bm25 = BM25Okapi(self.corpus_tokens)
            print(f"BM25 Index initialized with {len(self.cases)} legal case records.")

    def search(self, query: str, top_k: int = 4) -> List[Tuple[Dict[str, Any], float]]:
        """Performs sparse BM25 retrieval for a given query."""
        if not self.bm25 or not self.cases:
            return []

        query_tokens = legal_tokenize(query)
        if not query_tokens:
            query_tokens = query.lower().split()

        scores = self.bm25.get_scores(query_tokens)
        matching_indices = [i for i in range(len(scores)) if scores[i] > 0]
        if matching_indices:
            ranked_indices = sorted(matching_indices, key=lambda i: scores[i], reverse=True)[:top_k]
        else:
            ranked_indices = sorted(range(len(scores)), key=lambda i: scores[i], reverse=True)[:top_k]

        results = []
        for idx in ranked_indices:
            raw_score = float(scores[idx])
            # Normalize BM25 score to 0.0 - 1.0 range
            if raw_score > 0:
                normalized_score = round(min(0.98, 0.50 + (raw_score / (max_score * 1.5)) * 0.48), 4)
            else:
                normalized_score = 0.20

            case_payload = {
                "id": self.cases[idx]["id"],
                "case_name": self.cases[idx]["case_name"],
                "text": self.cases[idx]["text"],
                "summary": self.cases[idx].get("summary", "")
            }
            results.append((case_payload, normalized_score))

        return results

# Global singleton
bm25_engine = BM25SearchEngine()
