// ── Policy changes endpoint — queries policies with non-empty changed_fields ──

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function GET() {
  try {
    const supabase = await createClient();

    // Fetch policies that have changed_fields populated (i.e., diffs detected)
    const { data: rows, error } = await supabase
      .from("policy_documents")
      .select("*")
      .not("changed_fields", "eq", "{}")
      .order("effective_date", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Changes query failed:", error.message);
      return NextResponse.json([], { status: 200 });
    }

    return NextResponse.json(rows ?? [], { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Query failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
