from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import os
import json
from qdrant_client import QdrantClient
from qdrant_client.models import VectorParams, Distance, PointStruct
from sentence_transformers import SentenceTransformer
import google.generativeai as genai

from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="JusticeRAG API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize models and clients
embedder = SentenceTransformer("BAAI/bge-small-en-v1.5")
qdrant = QdrantClient(path="qdrant_db")  # Using persistent local storage
genai.configure(api_key=os.environ.get("GEMINI_API_KEY", "YOUR_GEMINI_API_KEY"))

COLLECTION_NAME = "indian_case_law"

def setup_qdrant():
    if not qdrant.collection_exists(collection_name=COLLECTION_NAME):
        qdrant.create_collection(
            collection_name=COLLECTION_NAME,
            vectors_config=VectorParams(size=384, distance=Distance.COSINE),
        )
        print(f"Collection {COLLECTION_NAME} created.")

setup_qdrant()

class SearchRequest(BaseModel):
    query: str
    mode: str = "semantic"  # "keyword", "semantic", "hybrid"

def format_case_response(case_payload, similarity):
    # This simulates passing the retrieved case to Gemini to extract specific fields.
    # For speed in this prototype, we'll return the raw data and use Gemini optionally or in the frontend.
    return {
        "case_name": case_payload.get("case_name", "Unknown Case"),
        "facts": case_payload.get("text", "")[:500] + "...", # Truncated for demo
        "similarity": round(similarity, 4),
        "raw_text": case_payload.get("text", "")
    }

@app.post("/search")
async def search(req: SearchRequest):
    if req.mode == "semantic":
        query_vector = embedder.encode(req.query).tolist()
        results = qdrant.query_points(
            collection_name=COLLECTION_NAME,
            query=query_vector,
            limit=5
        )
        
        response = []
        for hit in results.points:
            response.append(format_case_response(hit.payload, hit.score))
        return {"results": response, "mode": req.mode}
    else:
        raise HTTPException(status_code=400, detail="Only semantic search implemented in this skeleton")

class CompareRequest(BaseModel):
    query: str
    case_texts: list[str]

@app.post("/compare")
async def compare_cases(req: CompareRequest):
    try:
        model = genai.GenerativeModel('gemini-1.5-flash')
        prompt = f"A user is researching this legal query: '{req.query}'.\n\nThey found the following {len(req.case_texts)} cases. Please compare them, highlighting similarities, differences, and how they apply to the query:\n\n"
        for i, text in enumerate(req.case_texts):
            prompt += f"--- CASE {i+1} ---\n{text[:2000]}\n\n"
            
        response = model.generate_content(prompt)
        return {"comparison": response.text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/")
def read_root():
    return {"message": "JusticeRAG API is running"}
