import { NextRequest, NextResponse } from "next/server";
import { executeComparison } from "@/lib/searchEngine";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const query = body.query || "";
    const cases = body.cases || [];

    if (!cases || cases.length === 0) {
      return NextResponse.json(
        { error: "At least one case is required for comparison" },
        { status: 400 }
      );
    }

    const comparison = await executeComparison(query, cases);

    return NextResponse.json({
      comparison,
    });
  } catch (error: any) {
    console.error("API /api/compare error:", error);
    return NextResponse.json(
      { error: "Comparison failed", detail: error?.message || "Internal error" },
      { status: 500 }
    );
  }
}
