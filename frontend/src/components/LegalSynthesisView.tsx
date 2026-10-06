"use client";

import React, { useState } from "react";

interface LegalSynthesisViewProps {
  markdownText: string;
}

// Helper to format inline bold, italic, and code markdown
function renderFormattedInline(text: string): React.ReactNode[] {
  if (!text) return [];

  // Match bold (**text**), code (`text`), and italic (*text*)
  const tokens = text.split(/(\*\*.*?\*\*|`.*?`|\*.*?\*)/g);

  return tokens.map((token, idx) => {
    if (token.startsWith("**") && token.endsWith("**") && token.length >= 4) {
      return (
        <strong key={idx} className="font-bold text-white tracking-wide">
          {token.slice(2, -2)}
        </strong>
      );
    }
    if (token.startsWith("`") && token.endsWith("`") && token.length >= 2) {
      return (
        <span
          key={idx}
          className="inline-block mx-0.5 px-1.5 py-0.5 rounded bg-indigo-950/80 text-indigo-300 font-mono text-[11px] border border-indigo-800/60"
        >
          {token.slice(1, -1)}
        </span>
      );
    }
    if (token.startsWith("*") && token.endsWith("*") && token.length >= 2) {
      return (
        <em key={idx} className="italic text-slate-300">
          {token.slice(1, -1)}
        </em>
      );
    }
    return <span key={idx}>{token}</span>;
  });
}

export default function LegalSynthesisView({ markdownText }: LegalSynthesisViewProps) {
  const [activeTab, setActiveTab] = useState<"formatted" | "raw">("formatted");

  if (!markdownText) return null;

  // Split content into lines for block-level parsing
  const rawLines = markdownText.split("\n");

  const blocks: React.ReactNode[] = [];
  let i = 0;

  while (i < rawLines.length) {
    const line = rawLines[i].trim();

    // 1. Skip empty lines
    if (!line) {
      i++;
      continue;
    }

    // 2. Markdown Table Detection
    if (line.startsWith("|") && line.endsWith("|")) {
      const tableLines: string[] = [];
      while (i < rawLines.length && rawLines[i].trim().startsWith("|") && rawLines[i].trim().endsWith("|")) {
        tableLines.push(rawLines[i].trim());
        i++;
      }

      if (tableLines.length >= 2) {
        // Parse header
        const parseRow = (r: string) =>
          r
            .slice(1, -1)
            .split("|")
            .map((c) => c.trim());

        const headerCells = parseRow(tableLines[0]);
        // Row 1 is usually the separator line (|:---|:---|), skip if it contains dashes
        const dataRows = tableLines.slice(1).filter((r) => !r.match(/^\|[\s\-:]+\|$/));

        blocks.push(
          <div key={`table-${i}`} className="my-5 overflow-hidden rounded-xl border border-slate-700/80 bg-slate-950 shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-gradient-to-r from-slate-900 via-indigo-950/70 to-slate-900 text-slate-200 border-b border-slate-700">
                    {headerCells.map((h, hIdx) => (
                      <th key={hIdx} className="py-3 px-4 font-bold text-slate-100 tracking-wider uppercase text-[11px] whitespace-nowrap">
                        {renderFormattedInline(h)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 text-slate-300">
                  {dataRows.map((rowStr, rIdx) => {
                    const cells = parseRow(rowStr);
                    return (
                      <tr
                        key={rIdx}
                        className={`transition-colors hover:bg-slate-900/60 ${
                          rIdx % 2 === 0 ? "bg-slate-950" : "bg-[#0c121e]/80"
                        }`}
                      >
                        {cells.map((cell, cIdx) => (
                          <td key={cIdx} className="py-3.5 px-4 leading-relaxed align-top">
                            {cIdx === 0 ? (
                              <div className="font-semibold text-white">
                                {renderFormattedInline(cell)}
                              </div>
                            ) : (
                              <div>{renderFormattedInline(cell)}</div>
                            )}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
        continue;
      }
    }

    // 3. Main Title (H1)
    if (line.startsWith("# ")) {
      const title = line.replace(/^#\s+/, "");
      blocks.push(
        <div key={`h1-${i}`} className="pb-3 mb-4 border-b border-indigo-900/50 flex items-center gap-2">
          <h2 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
            {renderFormattedInline(title)}
          </h2>
        </div>
      );
      i++;
      continue;
    }

    // 4. Section Headers (H2 / H3)
    if (line.startsWith("## ") || line.startsWith("### ")) {
      const headingText = line.replace(/^(##|###)\s+/, "");
      blocks.push(
        <div key={`h2-${i}`} className="mt-6 mb-3 flex items-center gap-2.5">
          <div className="h-5 w-1 bg-indigo-500 rounded-full"></div>
          <h3 className="text-sm sm:text-base font-bold text-indigo-200 tracking-wide">
            {renderFormattedInline(headingText)}
          </h3>
        </div>
      );
      i++;
      continue;
    }

    // 5. Blockquote / Client Query
    if (line.startsWith(">")) {
      const quoteContent = line.replace(/^>\s*/, "");
      blocks.push(
        <div
          key={`quote-${i}`}
          className="my-3 p-3.5 rounded-lg bg-indigo-950/30 border-l-4 border-indigo-500 text-indigo-100 text-xs sm:text-sm italic leading-relaxed"
        >
          {renderFormattedInline(quoteContent)}
        </div>
      );
      i++;
      continue;
    }

    // 6. Horizontal Divider
    if (line === "---" || line === "***") {
      blocks.push(<hr key={`hr-${i}`} className="my-5 border-slate-800" />);
      i++;
      continue;
    }

    // 7. Bullet Points & Numbered Lists
    if (line.startsWith("- ") || line.startsWith("* ") || /^\d+\.\s/.test(line)) {
      const itemContent = line.replace(/^[-*]\s+|\d+\.\s+/, "");
      blocks.push(
        <div key={`li-${i}`} className="flex items-start gap-2.5 my-2 pl-2 text-xs sm:text-sm text-slate-300 leading-relaxed">
          <span className="text-indigo-400 mt-1 text-xs">◆</span>
          <div className="flex-1">{renderFormattedInline(itemContent)}</div>
        </div>
      );
      i++;
      continue;
    }

    // 8. Standard Paragraph
    blocks.push(
      <p key={`p-${i}`} className="my-2 text-xs sm:text-sm text-slate-300 leading-relaxed">
        {renderFormattedInline(line)}
      </p>
    );
    i++;
  }

  return (
    <div className="space-y-4">
      {/* View Mode Toggle Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs">
        <div className="text-slate-400 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></span>
          <span>Judicial Doctrine Synthesis Brief</span>
        </div>

        <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab("formatted")}
            className={`px-3 py-1 rounded-md font-medium transition-all ${
              activeTab === "formatted"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            📖 Formatted Brief
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("raw")}
            className={`px-3 py-1 rounded-md font-medium transition-all ${
              activeTab === "raw"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            📝 Markdown Source
          </button>
        </div>
      </div>

      {/* Render Active View */}
      {activeTab === "formatted" ? (
        <div className="bg-[#090d16] p-5 sm:p-6 rounded-xl border border-slate-800/90 shadow-2xl space-y-2">
          {blocks}
        </div>
      ) : (
        <pre className="font-mono text-xs bg-slate-950 p-5 rounded-xl border border-slate-800 text-slate-300 whitespace-pre-wrap leading-relaxed shadow-inner overflow-x-auto">
          {markdownText}
        </pre>
      )}
    </div>
  );
}
