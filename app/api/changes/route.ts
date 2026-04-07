// ── Policy changes endpoint — queries policies with non-empty changed_fields ──

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function GET() {
  try {
    const supabase = await createClient();

    // Query both tables for policies with changes
    const [pdResult, mbpResult] = await Promise.all([
      supabase
        .from("policy_documents")
        .select("*")
        .not("changed_fields", "eq", "{}")
        .order("effective_date", { ascending: false })
        .limit(50),
      supabase
        .from("medical_benefit_policies")
        .select("*")
        .not("changed_fields", "eq", "{}")
        .order("effective_date", { ascending: false })
        .limit(50),
    ]);

    const pdRows  = pdResult.error  ? [] : (pdResult.data  ?? []);
    const mbpRows = mbpResult.error ? [] : (mbpResult.data ?? []);

    // Combine and sort by effective_date descending
    const combined = [...pdRows, ...mbpRows].sort(
      (a, b) => new Date(b.effective_date).getTime() - new Date(a.effective_date).getTime(),
    ).slice(0, 50);

    return NextResponse.json(combined, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Query failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
