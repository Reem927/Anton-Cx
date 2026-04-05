# Supabase Stack — Auth + pgvector

> Auto-load when working on authentication, Supabase client code, RLS policies,
> vector embeddings, or any file that imports `@supabase/supabase-js`.

---

## Supabase Client

- Single client instance lives at `lib/supabase.ts`
- Reads `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` from env
- Throws immediately with a clear message if either is missing
- For server-only operations (service role), use a separate server client:
  ```ts
  import { createClient } from "@supabase/supabase-js";
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  ```
- NEVER expose `SUPABASE_SERVICE_ROLE_KEY` to the client — no `NEXT_PUBLIC_` prefix

---

## Authentication

### Google OAuth
```ts
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: "google",
  options: {
    redirectTo: `${window.location.origin}/auth/callback`,
  },
});
```
- Configure Google OAuth in Supabase dashboard → Authentication → Providers → Google
- Callback route: `app/auth/callback/route.ts` handles the code exchange
- SSO is the primary auth path per CLAUDE.md

### Email + Password (fallback)
```ts
// Sign up
const { data, error } = await supabase.auth.signUp({
  email,
  password,
  options: { data: { name, default_persona } },
});

// Sign in
const { data, error } = await supabase.auth.signInWithPassword({
  email,
  password,
});
```
- Sign-up is invite-only — submit hits an approval queue, not immediate creation
- Block consumer domains: gmail.com, yahoo.com, hotmail.com, outlook.com
- Store `default_persona` in user metadata on sign-up

### Session Management
```ts
// Get current session
const { data: { session } } = await supabase.auth.getSession();

// Listen for auth changes
supabase.auth.onAuthStateChange((event, session) => { ... });

// Server-side (API routes / middleware)
import { createServerClient } from "@supabase/ssr";
```

### Auth Callback Route
```ts
// app/auth/callback/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
```

---

## Row Level Security (RLS)

### Rules
- ALWAYS enable RLS on every table
- Policies reference `auth.uid()` for the current user
- Use `auth.jwt() ->> 'user_metadata' ->> 'default_persona'` for persona-based filtering
- Service role key bypasses RLS — use only in trusted server contexts

### Common policy patterns
```sql
-- Users can read their own org's policies
CREATE POLICY "Users read own org policies"
  ON policy_documents FOR SELECT
  USING (org_id = (SELECT org_id FROM profiles WHERE id = auth.uid()));

-- Public read for shared policy data
CREATE POLICY "Public read policies"
  ON policy_documents FOR SELECT
  USING (true);

-- Only service role can insert/update (extraction pipeline)
CREATE POLICY "Service insert policies"
  ON policy_documents FOR INSERT
  WITH CHECK (auth.role() = 'service_role');
```

---

## pgvector — Embeddings Storage

### Enable the extension
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

### Table schema for policy embeddings
```sql
CREATE TABLE policy_embeddings (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_id     UUID REFERENCES policy_documents(id) ON DELETE CASCADE,
  chunk_index   INTEGER NOT NULL,
  chunk_text    TEXT NOT NULL,
  embedding     VECTOR(1024) NOT NULL,  -- dimension matches model output
  metadata      JSONB DEFAULT '{}',
  created_at    TIMESTAMPTZ DEFAULT now(),

  UNIQUE(policy_id, chunk_index)
);

-- HNSW index for fast similarity search
CREATE INDEX ON policy_embeddings
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);
```

### Inserting embeddings
```ts
const { error } = await supabaseAdmin
  .from("policy_embeddings")
  .upsert({
    policy_id: policyId,
    chunk_index: index,
    chunk_text: chunk,
    embedding: JSON.stringify(vector), // pgvector accepts JSON array
    metadata: { payer_id, drug_name, section },
  }, { onConflict: "policy_id,chunk_index" });
```

### Similarity search via RPC
```sql
-- Supabase function for vector similarity search
CREATE OR REPLACE FUNCTION match_policy_chunks(
  query_embedding VECTOR(1024),
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  policy_id UUID,
  chunk_text TEXT,
  metadata JSONB,
  similarity FLOAT
)
LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT
    pe.id,
    pe.policy_id,
    pe.chunk_text,
    pe.metadata,
    1 - (pe.embedding <=> query_embedding) AS similarity
  FROM policy_embeddings pe
  WHERE 1 - (pe.embedding <=> query_embedding) > match_threshold
  ORDER BY pe.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
```

### Calling from TypeScript
```ts
const { data: chunks, error } = await supabase
  .rpc("match_policy_chunks", {
    query_embedding: JSON.stringify(queryVector),
    match_threshold: 0.7,
    match_count: 10,
  });
```

---

## Environment Variables

```env
# Client-side (exposed to browser)
NEXT_PUBLIC_SUPABASE_URL=        # Project Settings > API > Project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=   # Project Settings > API > anon/public key

# Server-side only (NEVER prefix with NEXT_PUBLIC_)
SUPABASE_SERVICE_ROLE_KEY=       # Project Settings > API > service_role key
```

---

## Rules

```
NEVER expose SUPABASE_SERVICE_ROLE_KEY to client code
NEVER disable RLS on tables with user data
NEVER use raw SQL from client — always go through Supabase client or RPC functions
ALWAYS enable RLS on every new table
ALWAYS use supabaseAdmin (service role) for the extraction pipeline insert/upsert
ALWAYS validate embedding dimensions match the model output (1024 for voyage, 1536 for OpenAI, etc.)
ALWAYS use HNSW index for vector columns — IVFFlat requires reindexing after bulk inserts
ALWAYS store embedding vectors as JSON arrays when inserting via the JS client
```
