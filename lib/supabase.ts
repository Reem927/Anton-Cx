import { createClient } from "@supabase/supabase-js";

let _client: ReturnType<typeof createClient> | null = null;

export function getSupabaseClient() {
  if (!_client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) {
      throw new Error(
        "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY — add to .env.local"
      );
    }
    _client = createClient(url, key);
  }
  return _client;
}

// Proxy so existing `supabase.from(...)` call sites keep working unchanged
export const supabase = new Proxy({} as ReturnType<typeof createClient>, {
  get(_, prop: string) {
    return (getSupabaseClient() as unknown as Record<string, unknown>)[prop];
  },
});
