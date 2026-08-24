import json
import csv
import os
import sys
from qdrant_client import QdrantClient
from qdrant_client.models import VectorParams, Distance, PointStruct
from sentence_transformers import SentenceTransformer

csv.field_size_limit(min(2147483647, sys.maxsize))

# Initialize BGE model
embedder = SentenceTransformer("BAAI/bge-small-en-v1.5")
COLLECTION_NAME = "indian_case_law"

def load_cases():
    data_paths = [
        "data/cases.json",
        "data/sample_cases.json",
        "data/cases.csv",
        "data/sample_cases.csv"
    ]
    
    for path in data_paths:
        if os.path.exists(path):
            print(f"Loading cases from {path}...")
            if path.endswith(".json"):
                with open(path, "r", encoding="utf-8") as f:
                    return json.load(f)
            elif path.endswith(".csv"):
                cases = []
                with open(path, "r", encoding="utf-8", errors="ignore") as f:
                    reader = csv.DictReader(f)
                    for i, row in enumerate(reader):
                        cases.append({
                            "id": int(row.get("id", i + 1)),
                            "case_name": row.get("case_name", f"Case {i+1}"),
                            "text": row.get("text", ""),
                            "summary": row.get("summary", "")
                        })
                return cases
    return []

def index_data():
    cases = load_cases()
    if not cases:
        print("No data found. Please run fetch_data.py first.")
        return

    print(f"Found {len(cases)} cases to index.")
    
    qdrant = QdrantClient(path="qdrant_db")
    
    # Recreate collection to ensure clean state
    if qdrant.collection_exists(collection_name=COLLECTION_NAME):
        print(f"Collection '{COLLECTION_NAME}' exists. Re-indexing...")
    else:
        qdrant.create_collection(
            collection_name=COLLECTION_NAME,
            vectors_config=VectorParams(size=384, distance=Distance.COSINE),
        )
        print(f"Collection '{COLLECTION_NAME}' created.")

    print(f"Generating BGE embeddings for {len(cases)} case precedents...")
    
    # Prepare texts for batch embedding
    texts_to_embed = [
        f"Case: {case['case_name']}\nSummary: {case.get('summary', '')}\nText: {case['text'][:2500]}"
        for case in cases
    ]
    
    # Batch encode with sentence-transformers
    embeddings = embedder.encode(texts_to_embed, batch_size=32, show_progress_bar=True).tolist()
    
    points = []
    for i, case in enumerate(cases):
        points.append(PointStruct(
            id=case["id"],
            vector=embeddings[i],
            payload={
                "case_name": case["case_name"],
                "text": case["text"],
                "summary": case.get("summary", "")
            }
        ))

    # Batch upsert to Qdrant
    batch_size = 50
    for i in range(0, len(points), batch_size):
        batch = points[i:i + batch_size]
        qdrant.upsert(
            collection_name=COLLECTION_NAME,
            points=batch
        )
        print(f"Indexed batch {i // batch_size + 1}/{(len(points) + batch_size - 1) // batch_size} ({len(batch)} cases)")

    print(f"\nIndexing complete! {len(points)} Indian court judgments indexed into Qdrant ('qdrant_db').")

if __name__ == "__main__":
    index_data()
