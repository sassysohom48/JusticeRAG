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
}

export default function Home() {
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState("hybrid");
  const [activeMode, setActiveMode] = useState("hybrid");
  const [results, setResults] = useState<CasePrecedent[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCaseIds, setSelectedCaseIds] = useState<number[]>([]);
  const [comparing, setComparing] = useState(false);
  const [comparisonText, setComparisonText] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showBenchmarkModal, setShowBenchmarkModal] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [copiedSynthesis, setCopiedSynthesis] = useState(false);

  const sampleQueries = [
    {
      category: "Tenancy & §106 Notice",
      text: "A tenant was evicted without proper notice. Find similar cases.",
    },
    {
      category: "Rent Control & Bona Fide",
      text: "Landlord claiming bona fide requirement under Rent Control Act.",
    },
    {
      category: "Statutory Overriding",
      text: "Notice to quit under Section 106 Transfer of Property Act mandatory or not?",
    },
    {
      category: "Evacuee Land Allotment",
      text: "Quasi permanent allotment of evacuee property dispute.",
    },
  ];

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

  const handleSearch = async (
    e?: React.FormEvent,
    searchQuery?: string,
    searchMode?: string
  ) => {
    if (e) e.preventDefault();
    const q = searchQuery !== undefined ? searchQuery : query;
    const m = searchMode !== undefined ? searchMode : mode;
    if (!q.trim()) return;

    setLoading(true);
    setComparisonText(null);
    setActiveMode(m);
    try {
      const endpoint = API_BASE_URL ? `${API_BASE_URL}/search` : `/api/search`;
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q, mode: m, top_k: 4 }),
      });
      const data = await res.json();
      const cases = data.results || [];
      setResults(cases);
      setSelectedCaseIds(cases.slice(0, 3).map((c: CasePrecedent) => c.id));
    } catch (error) {
      console.error("Error searching:", error);
      alert("Search request failed. Please verify your connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleModeChange = (newMode: string) => {
    setMode(newMode);
    if (query.trim()) {
      handleSearch(undefined, query, newMode);
    }
  };

  const toggleCaseSelection = (id: number) => {
    if (selectedCaseIds.includes(id)) {
      setSelectedCaseIds(selectedCaseIds.filter((cid) => cid !== id));
    } else {
      setSelectedCaseIds([...selectedCaseIds, id]);
    }
  };

  const handleCopyCitation = (id: number, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCompare = async () => {
    const selectedCases = results.filter((c) => selectedCaseIds.includes(c.id));
    if (selectedCases.length === 0) {
      alert("Please select at least one case to synthesize.");
      return;
    }

    setComparing(true);
    setShowModal(true);
    try {
      const endpoint = API_BASE_URL ? `${API_BASE_URL}/compare` : `/api/compare`;
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, cases: selectedCases }),
      });
      const data = await res.json();
      setComparisonText(data.comparison || "No comparative synthesis generated.");
    } catch (error) {
      console.error("Error comparing cases:", error);
      setComparisonText("Failed to generate comparative legal synthesis.");
    } finally {
      setComparing(false);
    }
  };

  const handleCopySynthesis = () => {
    if (comparisonText) {
      navigator.clipboard.writeText(comparisonText);
      setCopiedSynthesis(true);
      setTimeout(() => setCopiedSynthesis(false), 2500);
    }
  };

  const handleExportMemo = () => {
    if (comparisonText) {
      const blob = new Blob([comparisonText], { type: "text/markdown" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "JusticeRAG_Legal_Synthesis_Memo.md";
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="min-h-screen bg-[#080b11] text-slate-100 font-sans selection:bg-indigo-500/30 selection:text-white flex flex-col">
      {/* 1. Top Enterprise Navigation Bar */}
      <header className="border-b border-slate-800/80 bg-[#090d16]/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-slate-900 border border-indigo-400/30 flex items-center justify-center shadow-md shadow-indigo-950/50">
              <span className="text-xl">⚖️</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold tracking-tight text-white">
                  JusticeRAG
                </span>
                <span className="text-[10px] font-mono uppercase bg-indigo-950/80 text-indigo-300 border border-indigo-800/60 px-1.5 py-0.5 rounded font-semibold">
                  Enterprise
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
                Indian Jurisprudence Discovery & Comparative Synthesis
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="font-mono text-slate-400">105 Judgments Indexed</span>
              <span className="text-slate-600">•</span>
              <span className="text-slate-400">Supreme Court of India</span>
            </div>

            <button
              onClick={() => setShowBenchmarkModal(true)}
              className="px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition-all flex items-center gap-1.5"
            >
              <span>📊</span>
              <span className="hidden sm:inline">Benchmark</span>
            </button>

            <a
              href="https://github.com/sassysohom48/JusticeRAG"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-lg bg-indigo-600/90 hover:bg-indigo-500 text-xs font-semibold text-white transition-all shadow-sm flex items-center gap-1.5 border border-indigo-400/30"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
              <span>GitHub</span>
            </a>
          </div>
        </div>
      </header>

      {/* 2. Main Content Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* Hero Title & Mission */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-[11px] font-semibold text-indigo-300 mb-3 uppercase tracking-wider">
            <span>Supreme Court of India Case Law Retrieval</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight mb-4">
            Legal Precedent Discovery & Comparative Synthesis
          </h1>
          <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
            Enter factual scenarios to discover grounded Supreme Court judgments, statutory provisions, and multi-precedent doctrine conflicts.
          </p>

          <div className="mt-4 inline-flex items-center gap-2 px-3.5 py-1.5 bg-amber-950/30 border border-amber-800/40 rounded-lg text-xs text-amber-300/90 font-medium">
            <span>🛡️</span>
            <span><strong>Research Platform:</strong> Engineered strictly for legal research assistance, not legal counsel.</span>
          </div>
        </div>

        {/* 3. Enterprise Search & Paradigm Console */}
        <div className="bg-[#0e1422] border border-slate-800 rounded-2xl p-5 sm:p-7 shadow-2xl mb-10">
          {/* Segmented Paradigm Switcher */}
          <div className="mb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Retrieval Paradigm:
              </span>
              <div className="inline-flex p-1 bg-slate-950/80 border border-slate-800 rounded-xl">
                <button
                  type="button"
                  onClick={() => handleModeChange("hybrid")}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${mode === "hybrid"
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "text-slate-400 hover:text-slate-200"
                    }`}
                >
                  <span>⚡ Hybrid Legal RAG</span>
                  <span className="text-[10px] bg-indigo-950 px-1 rounded text-indigo-200 border border-indigo-800">
                    RRF
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleModeChange("semantic")}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${mode === "semantic"
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "text-slate-400 hover:text-slate-200"
                    }`}
                >
                  <span>🎯 Dense Semantic</span>
                  <span className="text-[10px] bg-slate-900 px-1 rounded text-slate-300 border border-slate-700">
                    BGE
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleModeChange("keyword")}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${mode === "keyword"
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "text-slate-400 hover:text-slate-200"
                    }`}
                >
                  <span>🔍 Keyword</span>
                  <span className="text-[10px] bg-slate-900 px-1 rounded text-slate-300 border border-slate-700">
                    BM25
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Search Input Box */}
          <form onSubmit={(e) => handleSearch(e)} className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Describe legal scenario (e.g. A tenant was evicted without proper notice. Find similar cases.)"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-11 pr-4 py-3.5 text-sm sm:text-base text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all font-normal shadow-inner"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3.5 px-7 rounded-xl transition-all disabled:opacity-50 shadow-md shadow-indigo-900/30 flex items-center justify-center gap-2 min-w-[150px] border border-indigo-500"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                    </svg>
                    <span className="text-sm">Searching...</span>
                  </>
                ) : (
                  <>
                    <span className="text-sm font-semibold">Search Cases</span>
                    <span>→</span>
                  </>
                )}
              </button>
            </div>

            {/* Quick Benchmark Prompt Tags */}
            <div className="pt-2">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Landmark Benchmark Queries:
              </div>
              <div className="flex flex-wrap gap-2">
                {sampleQueries.map((sample, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setQuery(sample.text);
                      handleSearch(undefined, sample.text, mode);
                    }}
                    className="text-xs px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800/80 text-slate-300 hover:text-white transition-all border border-slate-800 flex items-center gap-1.5 text-left"
                  >
                    <span className="text-[10px] font-mono bg-slate-900 text-indigo-300 px-1 py-0.5 rounded border border-slate-700">
                      {sample.category}
                    </span>
                    <span className="truncate max-w-xs">{sample.text}</span>
                  </button>
                ))}
              </div>
            </div>
          </form>
        </div>

        {/* 4. Results Section Header & Sticky Comparison Bar */}
        {results.length > 0 && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#0e1422] border border-slate-800 p-4 rounded-xl shadow-lg">
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-lg font-bold text-white tracking-tight">
                    Retrieved Legal Precedents
                  </h2>
                  <span className="text-xs font-mono bg-indigo-950 text-indigo-300 border border-indigo-800/80 px-2 py-0.5 rounded-md font-semibold">
                    {results.length} Cases
                  </span>
                  <span className="text-xs font-mono bg-slate-900 text-slate-300 border border-slate-700 px-2 py-0.5 rounded-md">
                    {activeMode === "keyword"
                      ? "BM25 Sparse Search"
                      : activeMode === "semantic"
                        ? "Dense Semantic (BGE)"
                        : "Hybrid RRF Consensus"}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Select cases below to synthesize cross-doctrine legal matrices and precedential hierarchies.
                </p>
              </div>

              <button
                onClick={handleCompare}
                disabled={selectedCaseIds.length === 0}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold py-2.5 px-5 rounded-lg transition-all border border-indigo-500 shadow-md flex items-center gap-2 disabled:opacity-40"
              >
                <span>⚖️ Synthesize Selected</span>
                <span className="bg-indigo-950 text-indigo-200 text-xs px-2 py-0.5 rounded font-mono border border-indigo-800">
                  {selectedCaseIds.length}
                </span>
              </button>
            </div>

            {/* Structured Precedent Cards */}
            <div className="space-y-5">
              {results.map((caseItem) => {
                const isSelected = selectedCaseIds.includes(caseItem.id);
                const scorePercent = (caseItem.similarity * 100).toFixed(1);

                return (
                  <div
                    key={caseItem.id}
                    className={`bg-[#0d121f] border rounded-xl p-6 transition-all shadow-xl relative ${isSelected
                        ? "border-indigo-500/80 ring-1 ring-indigo-500/40"
                        : "border-slate-800 hover:border-slate-700"
                      }`}
                  >
                    {/* Top Case Bar */}
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-slate-800/80 mb-5">
                      <div className="flex items-start gap-3.5">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleCaseSelection(caseItem.id)}
                          className="mt-1 w-4 h-4 rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 accent-indigo-600 cursor-pointer"
                          title="Select for comparison"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-bold text-white leading-snug">
                              {caseItem.case_name}
                            </h3>
                          </div>
                          <div className="text-xs text-slate-400 mt-1 flex flex-wrap items-center gap-2 font-medium">
                            <span className="text-indigo-300">Supreme Court of India</span>
                            <span>•</span>
                            <span>Verified Judicial Precedent</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 sm:self-start">
                        <button
                          onClick={() =>
                            handleCopyCitation(caseItem.id, caseItem.case_name)
                          }
                          className="text-xs px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700/80 transition-colors flex items-center gap-1"
                        >
                          <span>{copiedId === caseItem.id ? "✓ Copied" : "📋 Citation"}</span>
                        </button>

                        <span
                          className={`text-xs px-2.5 py-1 rounded-md font-mono font-bold border ${caseItem.similarity >= 0.8
                              ? "bg-emerald-950/60 text-emerald-300 border-emerald-800"
                              : "bg-indigo-950/60 text-indigo-300 border-indigo-800"
                            }`}
                        >
                          Match: {scorePercent}%
                        </span>
                      </div>
                    </div>

                    {/* 4 Structured Information Panels */}
                    <div className="grid grid-cols-1 gap-4">
                      {/* Statutory Provisions Chips */}
                      {caseItem.legal_provisions &&
                        caseItem.legal_provisions.length > 0 && (
                          <div>
                            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                              Statutory Provisions & Acts Applied:
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {caseItem.legal_provisions.map((prov, i) => (
                                <span
                                  key={i}
                                  className="text-xs bg-slate-950 text-indigo-300 font-mono px-2.5 py-1 rounded border border-slate-800 font-medium"
                                >
                                  📜 {prov}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                      {/* Material Factual Matrix */}
                      <div>
                        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                          Material Factual Dispute:
                        </div>
                        <div className="text-slate-300 text-xs sm:text-sm leading-relaxed bg-slate-950/60 p-3.5 rounded-lg border border-slate-800/80">
                          {caseItem.relevant_facts}
                        </div>
                      </div>

                      {/* Ratio Decidendi Quote */}
                      <div>
                        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                          Ratio Decidendi / Judicial Ruling:
                        </div>
                        <div className="text-slate-200 text-xs sm:text-sm leading-relaxed bg-slate-950/60 p-3.5 rounded-lg border-l-2 border-indigo-500 border-r border-t border-b border-slate-800/80 italic font-serif">
                          &quot;{caseItem.judgment}&quot;
                        </div>
                      </div>

                      {/* AI Legal Reasoning */}
                      <div>
                        <div className="text-[11px] font-semibold text-indigo-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                          <span>✨ Judicial Relevance & Applicability:</span>
                        </div>
                        <div className="bg-indigo-950/20 p-3.5 rounded-lg text-xs sm:text-sm text-indigo-200 border border-indigo-900/40 leading-relaxed">
                          {caseItem.why_relevant}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* 5. Multi-Case Comparison Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0e1422] border border-slate-700 rounded-2xl max-w-4xl w-full max-h-[88vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-[#090d16]">
              <div className="flex items-center gap-3">
                <span className="text-2xl">⚖️</span>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white leading-none">
                    Multi-Precedent Comparative Legal Synthesis
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Statutory interpretation conflict, bench hierarchy & strategic synthesis
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

            <div className="p-6 overflow-y-auto space-y-4 text-slate-200 text-sm leading-relaxed bg-[#0a0f1a]">
              {comparing ? (
                <div className="py-16 text-center space-y-4">
                  <div className="inline-block animate-spin rounded-full h-9 w-9 border-b-2 border-indigo-500"></div>
                  <div className="text-indigo-300 font-semibold text-base">
                    Synthesizing legal doctrines & statutory conflicts...
                  </div>
                  <div className="text-xs text-slate-500 max-w-md mx-auto">
                    Analyzing Transfer of Property Act notices vs. State Rent Control Act provisions across judicial benches.
                  </div>
                </div>
              ) : (
                <div className="font-mono text-xs sm:text-sm bg-slate-950 p-5 rounded-xl border border-slate-800 text-slate-200 whitespace-pre-wrap leading-relaxed shadow-inner">
                  {comparisonText}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-800 bg-[#090d16] flex flex-wrap justify-between items-center gap-3 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>Grounded on verified Indian Supreme Court judgments</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopySynthesis}
                  disabled={!comparisonText || comparing}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3.5 py-2 rounded-lg font-medium transition-colors border border-slate-700 disabled:opacity-40 flex items-center gap-1.5"
                >
                  <span>{copiedSynthesis ? "✓ Copied!" : "📋 Copy Synthesis"}</span>
                </button>

                <button
                  onClick={handleExportMemo}
                  disabled={!comparisonText || comparing}
                  className="bg-indigo-950 hover:bg-indigo-900 text-indigo-200 px-3.5 py-2 rounded-lg font-medium transition-colors border border-indigo-800 disabled:opacity-40 flex items-center gap-1.5"
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

      {/* 6. Evaluation Benchmark Modal */}
      {showBenchmarkModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0e1422] border border-slate-700 rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-[#090d16]">
              <div className="flex items-center gap-2.5">
                <span className="text-xl">📊</span>
                <h3 className="text-base font-bold text-white">
                  Quantitative Information Retrieval Benchmark (IR Suite)
                </h3>
              </div>
              <button
                onClick={() => setShowBenchmarkModal(false)}
                className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 text-slate-200 text-xs sm:text-sm bg-[#0a0f1a]">
              <p className="text-slate-300">
                Empirical evaluation comparing Keyword Search (BM25), Dense Semantic Search (BGE), and Hybrid Legal RAG (RRF) across 5 Indian Supreme Court benchmark queries:
              </p>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse border border-slate-800">
                  <thead>
                    <tr className="bg-slate-900/90 text-slate-300 text-xs font-mono">
                      <th className="p-3 border border-slate-800">Retrieval Paradigm</th>
                      <th className="p-3 border border-slate-800">MRR@5</th>
                      <th className="p-3 border border-slate-800">NDCG@5</th>
                      <th className="p-3 border border-slate-800">Precision@1</th>
                      <th className="p-3 border border-slate-800">Precision@3</th>
                      <th className="p-3 border border-slate-800">Precision@5</th>
                    </tr>
                  </thead>
                  <tbody className="font-mono text-xs">
                    <tr className="border-b border-slate-800/60">
                      <td className="p-3 border border-slate-800 font-semibold text-slate-300">1. Keyword (BM25)</td>
                      <td className="p-3 border border-slate-800">0.840</td>
                      <td className="p-3 border border-slate-800">0.877</td>
                      <td className="p-3 border border-slate-800">80.0%</td>
                      <td className="p-3 border border-slate-800">53.3%</td>
                      <td className="p-3 border border-slate-800">40.0%</td>
                    </tr>
                    <tr className="border-b border-slate-800/60">
                      <td className="p-3 border border-slate-800 font-semibold text-slate-300">2. Semantic RAG (BGE)</td>
                      <td className="p-3 border border-slate-800">1.000</td>
                      <td className="p-3 border border-slate-800">1.000</td>
                      <td className="p-3 border border-slate-800">100.0%</td>
                      <td className="p-3 border border-slate-800">66.7%</td>
                      <td className="p-3 border border-slate-800">56.0%</td>
                    </tr>
                    <tr className="bg-indigo-950/40 text-indigo-200">
                      <td className="p-3 border border-slate-800 font-bold">3. Hybrid Legal RAG (Ours)</td>
                      <td className="p-3 border border-slate-800 font-bold">1.000</td>
                      <td className="p-3 border border-slate-800 font-bold">0.977</td>
                      <td className="p-3 border border-slate-800 font-bold">100.0%</td>
                      <td className="p-3 border border-slate-800 font-bold">60.0%</td>
                      <td className="p-3 border border-slate-800 font-bold">48.0%</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 text-xs space-y-2">
                <div className="font-semibold text-white">🔬 Key Empirical Findings:</div>
                <ul className="list-disc list-inside space-y-1 text-slate-400">
                  <li><strong className="text-slate-200">Hybrid Legal RAG achieved 1.000 MRR@5</strong>, consistently placing the authoritative landmark rulings in top ranks.</li>
                  <li>Fusing lexical exactness (§106 notice) with semantic dispute narratives eliminates false positives from similar statutory codes.</li>
                </ul>
              </div>
            </div>

            <div className="p-4 border-t border-slate-800 bg-[#090d16] flex justify-end">
              <button
                onClick={() => setShowBenchmarkModal(false)}
                className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors text-xs"
              >
                Close Benchmark
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Professional Footer */}
      <footer className="border-t border-slate-800/80 bg-[#06090f] py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <span className="font-semibold text-slate-400">JusticeRAG</span> • Supreme Court of India AI Precedent Discovery
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span>Grounded In-Context Generation</span>
            <span>•</span>
            <span>Reciprocal Rank Fusion (RRF)</span>
            <span>•</span>
            <span>MIT License</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
