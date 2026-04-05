// ── Reem: RAG-powered policy search endpoint ─────────────────────

import { NextRequest, NextResponse } from "next/server";
import { ragQuery, searchPolicies } from "@/lib/vector-search";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const q = searchParams.get("q");
    const payer_id = searchParams.get("payer_id") ?? undefined;
    const drug_name = searchParams.get("drug_name") ?? undefined;
    const mode = searchParams.get("mode") ?? "search"; // "search" | "rag"

    if (!q) {
      return NextResponse.json(
        { error: "Missing required query parameter: q" },
        { status: 400 }
      );
    }

    if (mode === "rag") {
      // Full RAG: retrieve chunks + Claude answer
      const result = await ragQuery(q, { payer_id, drug_name });
      return NextResponse.json(result, { status: 200 });
    }

    // Default: vector/text search only, no Claude completion
    const results = await searchPolicies(q, {
      matchCount: 20,
      filterPayerId: payer_id,
      filterDrugName: drug_name,
    });

    return NextResponse.json(results, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Search failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
