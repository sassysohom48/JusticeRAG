"use client";

import { useState } from "react";

export default function Home() {
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState("semantic");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8080/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query, mode }),
      });
      const data = await res.json();
      setResults(data.results || []);
    } catch (error) {
      console.error("Error searching:", error);
      alert("Failed to connect to backend. Is it running?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        <header className="mb-12 text-center">
          <h1 className="text-5xl font-extrabold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
            JusticeRAG
          </h1>
          <p className="text-gray-400 text-lg">
            Retrieval-Augmented Legal Precedent Discovery for Indian Case Law
          </p>
          <div className="mt-4 p-3 bg-red-900/20 border border-red-900 rounded-lg inline-block text-sm text-red-400">
            <strong>Disclaimer:</strong> This tool provides legal research assistance, not legal advice.
          </div>
        </header>

        <form onSubmit={handleSearch} className="mb-12 relative">
          <div className="flex gap-4 mb-4">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g., A tenant was evicted without proper notice. Find similar cases."
              className="flex-1 bg-gray-900 border border-gray-700 rounded-xl px-6 py-4 text-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all shadow-[0_0_15px_rgba(168,85,247,0.1)]"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 px-8 rounded-xl transition-all disabled:opacity-50"
            >
              {loading ? "Searching..." : "Search"}
            </button>
          </div>
          
          <div className="flex items-center gap-6 text-sm text-gray-400 justify-center">
            <span className="font-semibold text-gray-300">Retrieval Mode:</span>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" value="keyword" checked={mode === "keyword"} onChange={(e) => setMode(e.target.value)} className="accent-purple-500" />
              Keyword (BM25)
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" value="semantic" checked={mode === "semantic"} onChange={(e) => setMode(e.target.value)} className="accent-purple-500" />
              Semantic RAG
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" value="hybrid" checked={mode === "hybrid"} onChange={(e) => setMode(e.target.value)} className="accent-purple-500" />
              Hybrid Legal RAG
            </label>
          </div>
        </form>

        <div className="space-y-6">
          {results.length > 0 && (
            <div className="flex justify-between items-center mb-6 border-b border-gray-800 pb-4">
              <h2 className="text-2xl font-bold">Relevant Precedents</h2>
              <button className="bg-gray-800 hover:bg-gray-700 text-sm py-2 px-4 rounded-lg transition-colors border border-gray-700">
                ⚖️ Compare these cases
              </button>
            </div>
          )}
          
          {results.map((result, idx) => (
            <div key={idx} className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-purple-500/50 transition-colors shadow-lg">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-blue-400">{result.case_name}</h3>
                <span className="bg-purple-900/30 text-purple-400 border border-purple-800 text-xs px-3 py-1 rounded-full font-mono">
                  Similarity: {(result.similarity * 100).toFixed(1)}%
                </span>
              </div>
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">Relevant Facts</h4>
                <p className="text-gray-300 leading-relaxed text-sm">{result.facts}</p>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">Why it is relevant</h4>
                <div className="bg-gray-950 p-4 rounded-lg text-sm text-gray-300 border border-gray-800">
                  {/* Placeholder for Gemini generated explanation */}
                  The facts of this case directly mirror the user's query regarding tenant eviction without statutory notice...
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
