# Anton Cx

> Medical benefit drug policy intelligence platform built for Anton Rx LLC.
> Ingests, parses, and normalizes clinical policy documents (CPBs) across 48+ payers into a searchable, comparable, diff-able system.

---

## What it does

Health plans govern drug coverage through individual clinical policy bulletins (CPBs) that vary by payer, update unpredictably, and are stored in incompatible PDF formats. There is no centralized source for this data.

Anton Cx solves this by:

1. **Ingesting** any payer's clinical policy PDF via drag-and-drop upload or URL fetch
2. **Extracting** 9 normalized fields per policy using Claude Vision via the Anthropic API
3. **Storing** policies in a structured Supabase database keyed by `(payer_id, drug_id, effective_date)`
4. **Serving** three role-specific views — Analyst, Manufacturer, Health Plan — from the same data

Key questions it answers:
- Which plans cover Drug X?
- What prior auth criteria does Plan Y require for Drug Z?
- What changed across payer policies this quarter?
- How does our coverage policy compare to peer payers?

---

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Database / Auth | Supabase (hosted Postgres + Supabase Auth) |
| AI / extraction | Anthropic SDK (Claude Sonnet) |
| Embeddings | VoyageAI |
| Visualizations | D3.js |
| Animation | Framer Motion · GSAP · @gsap/react · Lenis · react-countup |
| Deployment | Vercel |

---

## Getting started

### Prerequisites

- Node.js 20+
- npm or pnpm
- Supabase project (get URL + keys from Supabase dashboard → Project Settings → API)
- Anthropic API key
- VoyageAI API key (for semantic search / embeddings)

### Install

```bash
git clone <repo-url>
cd anton-cx
npm install
```

### Environment variables

Create `.env.local` at the project root:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>

# Anthropic
ANTHROPIC_API_KEY=<your-key>

# VoyageAI (embeddings / semantic search)
VOYAGE_API_KEY=<your-key>
```

> **Never commit `.env.local` or any file containing real keys.** All secret files are covered by `.gitignore`.

### Database setup

Schema and migrations are managed through the Supabase dashboard or Supabase CLI. The `/supabase` directory is excluded from version control (see `.gitignore`).

### Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Project structure

```
anton-cx/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── signup/
│   │       └── page.tsx
│   ├── (app)/
│   │   ├── layout.tsx          ← Shell: top bar + sidebar (never unmounts)
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   ├── search/
│   │   │   └── page.tsx
│   │   ├── compare/
│   │   │   └── page.tsx
│   │   ├── upload/
│   │   │   └── page.tsx
│   │   ├── diff/
│   │   │   └── page.tsx
│   │   └── alerts/
│   │       └── page.tsx
│   └── api/
│       ├── extract/
│       │   └── route.ts        ← POST: PDF → PolicyDocument
│       ├── policies/
│       │   └── route.ts        ← GET: filtered policy list
│       └── diff/
│           └── route.ts        ← POST: field-level diff between two policies
├── components/
│   ├── ui/
│   │   ├── StatusPill.tsx      ← COVERED / PA REQ / DENIED — single source of truth
│   │   ├── Skeleton.tsx        ← shimmer loading states
│   │   └── AnimatedNumber.tsx  ← count-up with useSpring
│   ├── shell/
│   │   ├── TopBar.tsx
│   │   ├── Sidebar.tsx         ← hideable, state in localStorage
│   │   └── PersonaSwitcher.tsx
│   ├── dashboard/
│   ├── search/
│   ├── compare/
│   └── ingestion/
├── lib/
│   ├── persona.ts              ← all persona routing logic lives here
│   ├── extraction.ts           ← Anthropic API call + schema validation
│   ├── diff.ts                 ← field-level diff algorithm
│   ├── embeddings.ts           ← VoyageAI embedding generation
│   ├── vector-search.ts        ← semantic search over policy corpus
│   ├── supabase.ts             ← Supabase browser client
│   ├── supabase-server.ts      ← Supabase server client (SSR)
│   └── db/                     ← typed query helpers
├── .agents/
│   └── skills/                 ← custom Claude Code skills (see Skills.md)
├── CLAUDE.md                   ← agent context (read by Claude Code on every session)
├── README.md                   ← this file
└── Skills.md                   ← custom skill specs for Claude Code
```

---

## Demo data

The following drugs are used for the live extraction demo with real public CPBs:

| Drug | Class | J-Code | Source |
|---|---|---|---|
| Humira (adalimumab) | Immunology | J0135 | UHC — uhcprovider.com |
| Keytruda (pembrolizumab) | Oncology | J9271 | Aetna — aetna.com/cpb |
| Dupixent (dupilumab) | Dermatology | J0173 | Cigna — cigna.com |

These cover different drug classes and PA structures for maximum extraction variety.

---

## Deployment

```bash
# Vercel CLI
vercel --prod

# Or connect repo to Vercel dashboard and set env vars:
# NEXT_PUBLIC_SUPABASE_URL
# NEXT_PUBLIC_SUPABASE_ANON_KEY
# SUPABASE_SERVICE_ROLE_KEY
# ANTHROPIC_API_KEY
# VOYAGE_API_KEY
```

Vercel compatibility notes:
- Framer Motion: zero issues (`'use client'` directive required)
- GSAP: use `useGSAP` hook for SSR safety — never raw `useEffect`
- Lenis: dynamic import only — `const Lenis = (await import('lenis')).default`
- Anthropic SDK: server-side only — never import in client components
- Supabase: use `supabase-server.ts` for server components and API routes; `supabase.ts` (browser client) for client components only

---

## Team

| Role | Owner |
|---|---|
| Backend API, auth wiring, policy ingestion | Reem |
| Policy comparison, frontend | Ruthvik / Aryan |
| Design system, component polish | Brandon |

Design source of truth: Figma file (see `anton-cx-wireframes.svg` in project root)
Motion spec: `CLAUDE.md` → Motion spec section
Component handoff notes: `Skills.md` → Design system skill
Skill install sequence: `CLAUDE.md` → Skill install sequence section
