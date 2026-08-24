# ⚖️ JusticeRAG: Retrieval-Augmented Legal Precedent Discovery for Indian Case Law

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Frontend-Next.js%2015-black.svg?logo=next.js&logoColor=white)](https://nextjs.org)
[![Qdrant](https://img.shields.io/badge/Vector%20DB-Qdrant-red.svg?logo=qdrant&logoColor=white)](https://qdrant.tech)
[![Gemini](https://img.shields.io/badge/LLM-Google%20Gemini-blue.svg?logo=google&logoColor=white)](https://ai.google.dev)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> **Legal Disclaimer:** JusticeRAG is engineered strictly as a **Legal Research Assistance** platform for legal practitioners, researchers, and students. It is **not** legal advice and does not substitute professional legal counsel.

---

## 📌 Overview

**JusticeRAG** is an AI-powered Legal Research and Precedent Discovery engine designed specifically for the **Indian Legal System** (Supreme Court and High Courts).

When presented with natural language legal scenarios (e.g., *"A tenant was evicted without proper notice. Find similar cases."*), JusticeRAG retrieves relevant Indian judicial precedents and provides structured legal reasoning:
- **Case Name & Citation**
- **Relevant Facts**
- **Legal Provisions & Statutory Acts**
- **Judgment & Ratio Decidendi**
- **Similarity Metric**
- **Relevance Explanation ("Why this case is relevant")**
- **Multi-Case Comparative Synthesis ("Compare these cases")**

---

## 🔬 Research Angle: Retrieval Benchmark

JusticeRAG compares three distinct retrieval paradigms across Indian case law:
1. **Keyword Search (BM25)**: Exact statutory code matching (e.g., *Section 106 Transfer of Property Act*).
2. **Dense Semantic RAG**: Contextual similarity matching with `BAAI/bge-small-en-v1.5` dense embeddings in Qdrant.
3. **Hybrid Legal RAG**: Reciprocal Rank Fusion (RRF) combining lexical exactness with semantic intent.

---

## 🏗️ Architecture

```
+-------------------------------------------------------------------------------+
| User Natural Language Query ("Tenant evicted without notice...")              |
+-------------------------------------------------------------------------------+
                                       │
                                       ▼
+-------------------------------------------------------------------------------+
| Dense Vector Retrieval (BAAI/bge-small-en-v1.5 + Qdrant Vector Engine)        |
+-------------------------------------------------------------------------------+
                                       │
                                       ▼
+-------------------------------------------------------------------------------+
| LLM Legal Extraction & Comparative Reasoning (Google Gemini)                  |
| - Structured Case Cards                                                       |
| - Multi-Precedent Comparison & Conflict Matrix                                 |
+-------------------------------------------------------------------------------+
                                       │
                                       ▼
+-------------------------------------------------------------------------------+
| Next.js Interactive Dark-Themed Web UI                                        |
+-------------------------------------------------------------------------------+
```

---

## 🚀 Quick Start

### 1. Prerequisites
- Python 3.10+
- Node.js 18+ and npm

### 2. Backend Setup
```bash
cd backend
python -m venv venv

# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
# source venv/bin/activate

pip install -r requirements.txt

# Configure your Gemini API key in backend/.env:
# GEMINI_API_KEY=your_gemini_api_key_here

# Index the Indian Case Law dataset into Qdrant:
python index_data.py

# Start the FastAPI server (runs on http://localhost:8080):
uvicorn main:app --reload --port 8080
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
# Open http://localhost:3000 in your browser
```

---

## 📂 Project Structure

```
JusticeRAG/
├── backend/
│   ├── data/
│   │   ├── cases.csv               # 105 full-length Indian Supreme Court judgments
│   │   └── cases.json              # Formatted JSON dataset
│   ├── fetch_data.py               # Dataset ingestion and normalization pipeline
│   ├── generate_csv.py             # CSV / JSON converter utility
│   ├── index_data.py               # BGE embedding vector indexer
│   ├── main.py                     # FastAPI REST API (/search, /compare)
│   ├── requirements.txt            # Python ML and web dependencies
│   └── .env.example                # Environment configuration template
├── frontend/
│   ├── src/app/                    # Next.js App Router UI pages & components
│   └── package.json                # Frontend dependencies
├── Project_Tracker.md              # Detailed architecture, research & viva guide
└── README.md                       # Repository overview
```

---

## 📜 License
MIT License.
