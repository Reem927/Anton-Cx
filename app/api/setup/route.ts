import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

export async function POST() {
  // Use service role if available, otherwise anon key
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  try {
    const sqlPath = path.join(process.cwd(), "supabase/migrations/001_profiles.sql");
    const sql = fs.readFileSync(sqlPath, "utf-8");

    const { error } = await supabase.rpc("exec_sql", { sql_text: sql }).single();

    if (error) {
      return NextResponse.json(
        { error: error.message, hint: "Run the SQL in supabase/migrations/001_profiles.sql directly in the Supabase SQL Editor" },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json(
      { error: message, hint: "Run the SQL in supabase/migrations/001_profiles.sql directly in the Supabase SQL Editor" },
      { status: 500 }
    );
  }
}
