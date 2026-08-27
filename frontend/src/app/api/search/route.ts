import { NextRequest, NextResponse } from "next/server";
import { executeSearch } from "../../../lib/searchEngine";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const query = body.query || "";
    const mode = body.mode || "hybrid";
    const topK = body.top_k || 4;

    if (!query.trim()) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    const results = await executeSearch(query, mode, topK);

    return NextResponse.json({
      query,
      mode,
      count: results.length,
      results,
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("API /api/search error:", err);
    return NextResponse.json(
      { error: "Search failed", detail: err?.message || "Internal error" },
      { status: 500 }
    );
  }
}
