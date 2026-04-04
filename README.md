# Anton Cx

> Medical benefit drug policy intelligence platform built for Anton Rx LLC.
> Ingests, parses, and normalizes clinical policy documents (CPBs) across 48+ payers into a searchable, comparable, diff-able system.

---

## What it does

Health plans govern drug coverage through individual clinical policy bulletins (CPBs) that vary by payer, update unpredictably, and are stored in incompatible PDF formats. There is no centralized source for this data.

Anton Cx solves this by:

1. **Ingesting** any payer's clinical policy PDF via drag-and-drop upload or URL fetch
2. **Extracting** 9 normalized fields per policy using Claude Vision via the Anthropic API
3. **Storing** policies in a structured database keyed by `(payer_id, drug_id, effective_date)`
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
| ORM | Prisma |
| Database | SQLite (dev) · Postgres (prod) |
| AI / extraction | Anthropic SDK (Claude Sonnet) |
| Auth | Clerk or NextAuth (teammate decision) |
| Animation | Framer Motion · GSAP · @gsap/react · Lenis · react-countup |
| Deployment | Vercel |

---

## Getting started

### Prerequisites

- Node.js 20+
- npm or pnpm
- Anthropic API key
- (Production) Postgres connection string

### Install

```bash
git clone <repo-url>
cd anton-cx
npm install
```

### Environment variables

Create `.env.local` at the project root:

```env
# Required
ANTHROPIC_API_KEY=sk-ant-...

# Auth (fill in after choosing provider)
NEXTAUTH_SECRET=
NEXTAUTH_URL=http://localhost:3000
# OR for Clerk:
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

# Database
DATABASE_URL="file:./dev.db"
# Production:
# DATABASE_URL="postgresql://user:password@host:5432/anton_cx"
```

### Database setup

```bash
npx prisma generate
npx prisma db push
npm run db:seed       # loads 20 synthetic policy records across 8 payers
```

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
│   │   ├── MetricCards.tsx
│   │   ├── CoverageTable.tsx
│   │   └── AlertFeed.tsx
│   ├── search/
│   │   ├── SearchHero.tsx
│   │   └── PolicyResultCard.tsx
│   └── compare/
│       ├── CompareToolbar.tsx
│       ├── DiffSummaryBar.tsx
│       └── CompareGrid.tsx
├── lib/
│   ├── persona.ts              ← all persona routing logic lives here
│   ├── extraction.ts           ← Anthropic API call + schema validation
│   └── diff.ts                 ← field-level diff algorithm
├── prisma/
│   ├── schema.prisma
│   └── seed.ts                 ← 20 synthetic records, 8 payers, 5 drug classes
├── .claude/
│   └── skills/                 ← custom Claude Code skills (see SKILLS.md)
├── CLAUDE.md                   ← agent context (read by Claude Code on every session)
├── README.md                   ← this file
└── SKILLS.md                   ← custom skill specs for Claude Code
```

---

## Claude Code scaffold prompt

Paste this into a Claude Code session to scaffold the entire project from scratch:

```
Read CLAUDE.md, README.md, and SKILLS.md before writing a single line of code.

Then scaffold the Anton Cx Next.js app in this exact order:

1. Initialize: Next.js 14, TypeScript, Tailwind CSS, App Router, ESLint
2. Install all dependencies:
   npm install prisma @prisma/client framer-motion gsap @gsap/react lenis react-countup @anthropic-ai/sdk
3. Configure Tailwind to include Syne, DM Sans, DM Mono font families
4. Create Prisma schema — PolicyDocument model with all fields from CLAUDE.md extraction schema
5. Create three API routes per CLAUDE.md contracts:
   POST /api/extract · GET /api/policies · POST /api/diff
6. Create /lib/persona.ts with full ANALYST / MFR / PLAN config objects (columns, filters, actions, bannerText)
7. Create /lib/extraction.ts with Anthropic SDK call + extraction system prompt from SKILLS.md
8. Create /lib/diff.ts with field-level diff algorithm from SKILLS.md
9. Seed database: 20 synthetic policy records — 8 payers, 5 drug classes per CLAUDE.md data strategy
10. Build shared UI primitives:
    - /components/ui/StatusPill.tsx (COVERED / PA REQ / DENIED — single source of truth)
    - /components/ui/Skeleton.tsx (shimmer loading, matches exact layout of target)
    - /components/ui/AnimatedNumber.tsx (useSpring count-up, stiffness 75 damping 15)
11. Build app shell (never unmounts between routes):
    - /components/shell/TopBar.tsx (48px, logo zone, breadcrumb, persona switcher, quarter chip, avatar)
    - /components/shell/Sidebar.tsx (hideable, 200px↔44px, localStorage key 'anton-cx-sidebar', tooltip on collapse)
    - /components/shell/PersonaSwitcher.tsx (AnimatePresence cross-fade 230ms — never cut)
12. Build Dashboard page:
    - MetricCards with count-up on mount (stagger: 60ms per card)
    - CoverageTable with status pills across 4 payers
    - AlertFeed with severity dots
13. Build Policy Search page with persona-aware columns, filters, and result cards
14. Build Comparison Engine with field-level diff grid (CONFLICT / CHANGED / MATCH cell states)
15. Apply full motion spec from CLAUDE.md to all components:
    - Spring config: stiffness 300, damping 30 everywhere
    - Stagger formula: delay: Math.min(index * 0.04, 0.2)
    - MotionConfig reducedMotion="user" in root layout
16. Run /simplify then /lint-and-validate

Design system: Clinical Precision palette + Syne/DM Sans/DM Mono (exact values in CLAUDE.md).
Auth pages: skip — handled separately.
Vercel target: no Node-only APIs, use useGSAP for SSR safety, dynamic import lenis with 'use client'.
```

---

## Demo data

The seed script populates the following drugs across payers:

| Drug | Class | J-Code | Payers seeded |
|---|---|---|---|
| Humira (adalimumab) | Immunology | J0135 | All 8 |
| Keytruda (pembrolizumab) | Oncology | J9271 | All 8 |
| Dupixent (dupilumab) | Dermatology | J0173 | 6 of 8 |
| Stelara (ustekinumab) | Immunology | J3357 | 6 of 8 |
| Enbrel (etanercept) | Rheumatology | J1438 | 5 of 8 |

For the live extraction demo, use these real public CPBs:
- UHC Humira: search "UnitedHealthcare Humira clinical policy" on uhcprovider.com
- Aetna Keytruda: search "Aetna Keytruda CPB" on aetna.com/cpb
- Cigna Dupixent: search "Cigna Dupixent coverage policy" on cigna.com

---

## Deployment

```bash
# Vercel CLI
vercel --prod

# Or connect repo to Vercel dashboard and set env vars:
# ANTHROPIC_API_KEY
# DATABASE_URL (Postgres)
# Auth provider keys
```

Vercel compatibility notes:
- Framer Motion: zero issues (client component, `'use client'` directive required)
- GSAP: zero issues (use `useGSAP` hook for SSR safety)
- Anthropic SDK: server-side only — never import in client components
- Prisma: use Prisma Accelerate or connection pooling for Postgres on Vercel serverless

---

## Team

| Role | Owner |
|---|---|
| Flight control software + autonomy, frontend | Brandon R. |
| Auth wiring, backend API | Teammate |
| Design system implementation, component polish | Teammate |

Design source of truth: Figma file (see `anton-cx-wireframes.svg` in project root)
Motion spec: `CLAUDE.md` → Motion spec section
Component handoff notes: `SKILLS.md` → Design system skill
Skill install sequence: `CLAUDE.md` → Skill install sequence section

Recommended plugins (install inside Claude Code before first session):
- `/plugin install claude-md-management@claude-plugins-official` — keeps CLAUDE.md current
- `/plugin install chrome@claude-plugins-official` — visual verification of rendered UI
- `/plugin install playwright@claude-plugins-official` — E2E testing