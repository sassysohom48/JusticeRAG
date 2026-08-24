"use client";

import { useState } from "react";

interface CasePrecedent {
  id: number;
  case_name: string;
  relevant_facts: string;
  legal_provisions: string[];
  judgment: string;
  similarity: number;
  why_relevant: string;
  raw_text?: string;
}

export default function Home() {
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState("semantic");
  const [results, setResults] = useState<CasePrecedent[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCaseIds, setSelectedCaseIds] = useState<number[]>([]);
  const [comparing, setComparing] = useState(false);
  const [comparisonText, setComparisonText] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  const sampleQueries = [
    "A tenant was evicted without proper notice. Find similar cases.",
    "Landlord claiming bona fide requirement under Rent Control Act.",
    "Quasi permanent allotment of evacuee property dispute.",
    "Notice to quit under Section 106 Transfer of Property Act mandatory or not?"
  ];

  const handleSearch = async (e?: React.FormEvent, searchQuery?: string) => {
    if (e) e.preventDefault();
    const q = searchQuery || query;
    if (!q.trim()) return;

    setLoading(true);
    setComparisonText(null);
    try {
      const res = await fetch("http://localhost:8080/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q, mode, top_k: 4 }),
      });
      const data = await res.json();
      const cases = data.results || [];
      setResults(cases);
      // Auto-select first 3 cases for comparison convenience
      setSelectedCaseIds(cases.slice(0, 3).map((c: CasePrecedent) => c.id));
    } catch (error) {
      console.error("Error searching:", error);
      alert("Failed to connect to JusticeRAG Backend on http://localhost:8080. Please ensure the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  const toggleCaseSelection = (id: number) => {
    if (selectedCaseIds.includes(id)) {
      setSelectedCaseIds(selectedCaseIds.filter((cid) => cid !== id));
    } else {
      setSelectedCaseIds([...selectedCaseIds, id]);
    }
  };

  const handleCompare = async () => {
    const selectedCases = results.filter((c) => selectedCaseIds.includes(c.id));
    if (selectedCases.length === 0) {
      alert("Please select at least one case to compare.");
      return;
    }

    setComparing(true);
    setShowModal(true);
    try {
      const res = await fetch("http://localhost:8080/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, cases: selectedCases }),
      });
      const data = await res.json();
      setComparisonText(data.comparison || "No comparison generated.");
    } catch (error) {
      console.error("Error comparing cases:", error);
      setComparisonText("Failed to generate comparative synthesis. Please check backend connection.");
    } finally {
      setComparing(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#07090e] text-slate-100 p-4 md:p-10 font-sans selection:bg-purple-500 selection:text-white">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <header className="mb-10 text-center relative">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-950/60 border border-purple-800/60 text-xs font-semibold text-purple-300 mb-4 tracking-wider uppercase shadow-inner">
            <span>⚖️ Indian Jurisprudence Discovery</span>
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse"></span>
            <span className="text-purple-400">RAG Engine</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-black mb-3 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-300 to-indigo-400">
            JusticeRAG
          </h1>
          <p className="text-slate-400 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
            Retrieval-Augmented Legal Precedent Discovery & Comparative Synthesis for Indian Case Law
          </p>

          <div className="mt-4 px-4 py-2 bg-amber-950/30 border border-amber-800/40 rounded-lg inline-flex items-center gap-2 text-xs text-amber-300">
            <span>🛡️</span>
            <span><strong>Research Disclaimer:</strong> Engineered strictly for legal research assistance, not legal counsel.</span>
          </div>
        </header>

        {/* Search Input Section */}
        <div className="bg-slate-900/80 border border-slate-800/90 rounded-2xl p-6 shadow-2xl backdrop-blur-md mb-8">
          <form onSubmit={(e) => handleSearch(e)} className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Describe legal scenario (e.g. A tenant was evicted without proper notice. Find similar cases.)"
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-11 pr-4 py-3.5 text-base text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all shadow-inner"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold py-3.5 px-8 rounded-xl transition-all disabled:opacity-50 shadow-lg shadow-purple-600/20 flex items-center justify-center gap-2 min-w-[140px]"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                    </svg>
                    <span>Retrieving...</span>
                  </>
                ) : (
                  <>
                    <span>Discover</span>
                    <span>→</span>
                  </>
                )}
              </button>
            </div>

            {/* Retrieval Mode Selection */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-800/80 text-xs text-slate-400">
              <div className="flex items-center gap-4">
                <span className="font-semibold text-slate-300">Retrieval Paradigm:</span>
                <label className="flex items-center gap-1.5 cursor-pointer hover:text-white transition-colors">
                  <input
                    type="radio"
                    name="mode"
                    value="semantic"
                    checked={mode === "semantic"}
                    onChange={(e) => setMode(e.target.value)}
                    className="accent-purple-500"
                  />
                  <span>Dense Semantic RAG</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer hover:text-white transition-colors">
                  <input
                    type="radio"
                    name="mode"
                    value="keyword"
                    checked={mode === "keyword"}
                    onChange={(e) => setMode(e.target.value)}
                    className="accent-purple-500"
                  />
                  <span>Keyword (BM25)</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer hover:text-white transition-colors">
                  <input
                    type="radio"
                    name="mode"
                    value="hybrid"
                    checked={mode === "hybrid"}
                    onChange={(e) => setMode(e.target.value)}
                    className="accent-purple-500"
                  />
                  <span>Hybrid RAG (RRF)</span>
                </label>
              </div>

              <div className="text-slate-400">
                Indexed: <span className="text-purple-300 font-semibold">105 Supreme Court Judgments</span>
              </div>
            </div>
          </form>

          {/* Quick Query Prompts */}
          <div className="mt-4 pt-3 border-t border-slate-800/60">
            <div className="text-xs text-slate-400 mb-2 font-medium">Quick Benchmarks:</div>
            <div className="flex flex-wrap gap-2">
              {sampleQueries.map((sample, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setQuery(sample);
                    handleSearch(undefined, sample);
                  }}
                  className="text-xs px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-all border border-slate-700/60 text-left"
                >
                  💡 {sample}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results Header & Action Bar */}
        {results.length > 0 && (
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6 bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span>📚 Retrieved Legal Precedents</span>
                <span className="text-xs font-mono bg-purple-950 text-purple-300 border border-purple-800 px-2 py-0.5 rounded-full">
                  {results.length} cases
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Select cases to generate multi-precedent comparative legal synthesis
              </p>
            </div>

            <button
              onClick={handleCompare}
              disabled={selectedCaseIds.length === 0}
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold py-2.5 px-5 rounded-lg transition-all border border-indigo-500 shadow-md flex items-center gap-2 disabled:opacity-40"
            >
              <span>⚖️ Compare Selected</span>
              <span className="bg-indigo-900 text-indigo-200 text-xs px-2 py-0.5 rounded-full font-mono">
                {selectedCaseIds.length}
              </span>
            </button>
          </div>
        )}

        {/* Structured 6-Field Precedent Cards */}
        <div className="space-y-6">
          {results.map((caseItem) => {
            const isSelected = selectedCaseIds.includes(caseItem.id);
            const scorePercent = (caseItem.similarity * 100).toFixed(1);

            return (
              <div
                key={caseItem.id}
                className={`bg-slate-900/90 border rounded-2xl p-6 transition-all shadow-xl relative overflow-hidden ${
                  isSelected
                    ? "border-purple-500/80 ring-1 ring-purple-500/50 shadow-purple-900/10"
                    : "border-slate-800 hover:border-slate-700"
                }`}
              >
                {/* Top Bar: Case Name & Similarity Badge */}
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleCaseSelection(caseItem.id)}
                      className="mt-1.5 w-4 h-4 rounded border-slate-700 text-purple-600 focus:ring-purple-500 accent-purple-500 cursor-pointer"
                      title="Select for comparison"
                    />
                    <div>
                      <h3 className="text-xl font-bold text-blue-300 leading-snug hover:text-blue-200 transition-colors">
                        {caseItem.case_name}
                      </h3>
                      <div className="text-xs text-slate-400 mt-0.5">
                        Indian Supreme Court / High Court Precedent
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end">
                    <span
                      className={`text-xs px-3 py-1 rounded-full font-mono font-bold border ${
                        caseItem.similarity >= 0.75
                          ? "bg-emerald-950/60 text-emerald-300 border-emerald-800/80"
                          : "bg-purple-950/60 text-purple-300 border-purple-800/80"
                      }`}
                    >
                      Match: {scorePercent}%
                    </span>
                  </div>
                </div>

                {/* 1. Legal Provisions Chips */}
                {caseItem.legal_provisions && caseItem.legal_provisions.length > 0 && (
                  <div className="mb-4">
                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                      Statutory Provisions & Acts
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {caseItem.legal_provisions.map((prov, pidx) => (
                        <span
                          key={pidx}
                          className="bg-indigo-950/70 border border-indigo-800/60 text-indigo-300 text-xs px-2.5 py-1 rounded-md font-medium"
                        >
                          📜 {prov}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* 2. Relevant Facts */}
                <div className="mb-4">
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Relevant Facts
                  </h4>
                  <p className="text-slate-300 text-sm leading-relaxed bg-slate-950/50 p-3.5 rounded-xl border border-slate-800/60">
                    {caseItem.relevant_facts}
                  </p>
                </div>

                {/* 3. Judgment & Ratio Decidendi */}
                <div className="mb-4">
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Judgment & Ratio Decidendi
                  </h4>
                  <p className="text-slate-200 text-sm leading-relaxed bg-slate-950/50 p-3.5 rounded-xl border border-slate-800/60 font-serif italic">
                    "{caseItem.judgment}"
                  </p>
                </div>

                {/* 4. Why This Case Is Relevant (GenAI Reasoning) */}
                <div>
                  <h4 className="text-xs font-semibold text-purple-300 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <span>✨ Why this case is relevant</span>
                    <span className="text-[10px] bg-purple-900/60 text-purple-300 px-1.5 py-0.2 rounded">AI Reasoning</span>
                  </h4>
                  <div className="bg-gradient-to-r from-purple-950/30 to-indigo-950/30 p-3.5 rounded-xl text-sm text-purple-200 border border-purple-800/40 leading-relaxed">
                    {caseItem.why_relevant}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Multi-Case Comparison Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-4xl w-full max-h-[88vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/60">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">⚖️</span>
                  <div>
                    <h3 className="text-lg font-bold text-white leading-none">
                      Multi-Precedent Comparative Legal Synthesis
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Cross-statutory doctrine conflict, factual distinction & precedence hierarchy
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-4 text-slate-200 text-sm leading-relaxed bg-slate-950/30">
                {comparing ? (
                  <div className="py-16 text-center space-y-4">
                    <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-purple-500"></div>
                    <div className="text-purple-300 font-semibold text-base">
                      Gemini LLM is synthesizing legal doctrines & statutory conflicts...
                    </div>
                    <div className="text-xs text-slate-500 max-w-md mx-auto">
                      Comparing Transfer of Property Act notices vs. State Rent Control Act statutory provisions across judicial benches.
                    </div>
                  </div>
                ) : (
                  <div className="font-mono text-xs md:text-sm bg-slate-950 p-5 rounded-xl border border-slate-800 text-slate-200 whitespace-pre-wrap leading-relaxed shadow-inner">
                    {comparisonText}
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex flex-wrap justify-between items-center gap-3 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span>Grounded on verified Indian Supreme Court judgments</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      if (comparisonText) {
                        navigator.clipboard.writeText(comparisonText);
                        alert("Comparative legal synthesis copied to clipboard!");
                      }
                    }}
                    disabled={!comparisonText || comparing}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3.5 py-2 rounded-lg font-medium transition-colors border border-slate-700 disabled:opacity-40 flex items-center gap-1.5"
                  >
                    📋 Copy Synthesis
                  </button>

                  <button
                    onClick={() => {
                      if (comparisonText) {
                        const blob = new Blob([comparisonText], { type: "text/markdown" });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = "JusticeRAG_Legal_Synthesis_Memo.md";
                        a.click();
                        URL.revokeObjectURL(url);
                      }
                    }}
                    disabled={!comparisonText || comparing}
                    className="bg-purple-900/60 hover:bg-purple-900 text-purple-200 px-3.5 py-2 rounded-lg font-medium transition-colors border border-purple-700/60 disabled:opacity-40 flex items-center gap-1.5"
                  >
                    📥 Export Memo (.md)
                  </button>

                  <button
                    onClick={() => setShowModal(false)}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
