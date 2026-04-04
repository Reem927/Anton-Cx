# Anton Cx — Agent Context

> This file is loaded by Claude Code at the start of every session.
> Do not remove or restructure sections — they are read by the agent in order.

---

## Project identity

**Product:** Anton Cx
**Owner:** Anton Rx LLC — independent pharmacy rebate management firm
**Purpose:** Ingest, parse, and normalize medical benefit drug clinical policy documents (CPBs) from health plan payers. Delivers a searchable, comparable, and diff-able intelligence platform across 48+ payers for three distinct user personas.
**Stack:** Next.js 14 · TypeScript · Tailwind CSS · Prisma (SQLite dev / Postgres prod) · Anthropic SDK · Vercel
**Animation:** framer-motion · gsap @gsap/react · lenis · react-countup

---

## Design system — NEVER deviate

```
Font display : Syne 700/800      → headings, logo, drug names, page titles
Font body    : DM Sans 400/500   → all UI text, labels, descriptions
Font mono    : DM Mono 400/500   → status pills, J-codes, timestamps, metric labels, policy IDs

Navy primary  : #1B3A6B   → sidebar active state, persona badge bg, avatar, brand panel bg
Blue accent   : #2E6BE6   → links, active states, focus rings, primary CTA buttons
Blue light    : #EBF0FC   → active sidebar item bg, badge bg, input focus bg
Blue mid      : #C4D4F8   → borders on blue elements, focus rings
Page bg       : #F7F8FC   → never use pure white as the page background
Card bg       : #FFFFFF   → panels, sidebar, top bar, form fields
Border        : #E8EBF2   → all borders at 0.5px stroke weight
Border mid    : #D0D6E8   → hover borders, secondary emphasis

Status — COVERED  : pill bg #EDFAF3 · text #0F7A40 · border #B8EDD0
Status — PA REQ   : pill bg #FFF4E0 · text #D4880A · border #F5D898
Status — DENIED   : pill bg #FEE8E8 · text #B02020 · border #F5C0C0
Conflict cell     : bg #FFF4E0  → payer policy disagreements in comparison grid
Changed cell      : bg #FFFBEB  → quarterly policy changes in comparison grid
```

---

## Navigation architecture

```
Shell layout:
  ├── Top bar (48px, always visible)
  │     Logo zone (200px expanded / 44px collapsed) | Breadcrumb | [spacer] | Persona switcher | Quarter chip | Avatar
  └── Body
        ├── Sidebar (200px expanded / 44px collapsed, HIDEABLE)
        │     CORE: Dashboard · Policy Search · Compare · Upload & Extract
        │     REPORTS: Quarterly Diff · Alerts
        │     SETTINGS: Payer Config · Workspace
        └── Main content area (flex: 1)

Sidebar state persisted in localStorage key: 'anton-cx-sidebar'
Sidebar toggle: hamburger button in top-left of top bar
Collapsed state: icon-only (44px), labels hidden, tooltips on hover
```

---

## Personas — data changes per role, shell stays identical

| Persona | Access | Default view | Key data shown |
|---|---|---|---|
| `ANALYST` | Full platform | Dashboard | PA criteria, step therapy, change flags, cross-payer diff |
| `MFR` | Drug access + market position | Policy Search | Coverage by indication, net price tier, biosimilar exposure |
| `PLAN` | Benchmark only | Compare | Peer rank, variance flag (more/less restrictive than peers) |

Persona routing lives in `/lib/persona.ts` — never hardcode persona-specific data in components.
User's default persona is set on sign-up and stored on the user record as `default_persona`.

---

## API routes — never rename

```
POST /api/extract
  Input:  { pdf: base64string, payer_id: string, drug_name?: string }
  Output: PolicyDocument (see extraction schema below)
  Notes:  Uses Anthropic SDK with vision. Server-side only. ~3–8s response time.

GET  /api/policies
  Params: payer_id?, drug_id?, drug_name?, date_from?, date_to?, persona?
  Output: PolicyDocument[]
  Notes:  Filters by persona automatically based on session user role.

POST /api/diff
  Input:  { policy_id_a: string, policy_id_b: string }
  Output: DiffResult[] — array of field-level diffs with change_type: 'added' | 'removed' | 'changed' | 'unchanged'
```

---

## Extraction schema — 9 fields, never add or remove

```typescript
interface PolicyDocument {
  id:                   string       // uuid
  payer_id:             string       // e.g. "aetna" | "uhc" | "cigna" | "bcbs-tx"
  drug_name:            string       // e.g. "Humira"
  drug_generic:         string       // e.g. "adalimumab"
  j_code:               string       // e.g. "J0135"
  coverage_status:      'covered' | 'pa_required' | 'denied' | 'not_covered'
  prior_auth_required:  boolean
  prior_auth_criteria:  string       // free text extracted from PDF
  step_therapy:         boolean
  step_therapy_drugs:   string[]     // e.g. ["methotrexate", "sulfasalazine"]
  site_of_care:         string | null
  indications:          string[]     // covered diagnoses e.g. ["RA", "PsA", "CD"]
  quantity_limit:       string | null
  clinical_criteria:    string | null // score thresholds e.g. "CDAI >220 or DAS28 >3.2"
  renewal_period:       string | null // e.g. "12 months"
  policy_version:       string       // e.g. "v4.2"
  effective_date:       string       // ISO date
  source_pdf_url:       string | null
  extracted_at:         string       // ISO datetime
  changed_fields:       string[]     // fields that differ from previous version
}
```

DB key: `(payer_id, drug_id, effective_date)` — unique constraint.

---

## Animation stack

```bash
# Install all before starting any UI work
npm install framer-motion gsap @gsap/react lenis react-countup
```

| Library | Role | SSR note |
|---|---|---|
| `framer-motion` | Primary — all spring transitions, layout animations, AnimatePresence | `'use client'` required |
| `gsap` + `@gsap/react` | Sidebar orchestration, stagger sequences | Use `useGSAP` hook, never raw `useEffect` |
| `lenis` | Smooth scroll on results lists | Dynamic import only: `const Lenis = (await import('lenis')).default` |
| `react-countup` | Dashboard metric count-up fallback | OR use `framer-motion useSpring` |

---

## Motion spec — calibrated for analyst daily use

```
Spring config (all UI transitions):  stiffness: 300, damping: 30 — no bounce, no sluggish
Max UI animation duration:           250ms (interactions) · 1200ms (count-up only)
Stagger per item:                    40ms max · 200ms total sequence cap
  Formula: delay: Math.min(index * 0.04, 0.2)

USE (Awwwards-grade, data-app calibrated):
  ✓ Staggered entrance reveals    — Dashboard cards, search result rows (once per mount)
                                    motion.ul + staggerChildren, y:12→0, opacity:0→1
  ✓ Shimmer skeleton loading      — any fetch >500ms, layout matches target exactly
                                    CSS @keyframes shimmer 1.8s linear infinite — stops on resolve
  ✓ Count-up numbers              — Dashboard metric cards on load
                                    useSpring(0→value, { stiffness:75, damping:15, mass:0.8 })
  ✓ Spring sidebar collapse       — Framer Motion layout prop — fires on every toggle
                                    Labels fade opacity 1→0 over 120ms simultaneously
  ✓ Persona switcher cross-fade   — AnimatePresence opacity only, 230ms total — NEVER CUT
                                    Exit 80ms → Enter 150ms · badge spring scale 0.9→1.05→1
  ✓ Diff cell fade (DIFFS ONLY)   — match cells opacity→0.15 (200ms) · conflict cells stay full
  ✓ Payer column slide            — add: x:20→0, opacity:0→1 (180ms spring)
                                    remove: x:0→-10, opacity:1→0 (120ms)
  ✓ Table row hover               — bg transparent→#F3F5FA at 80ms, CSS transition only
  ✓ Button interactions           — whileHover scale:1.01 · whileTap scale:0.97 · 100ms
  ✓ Status pill state change      — AnimatePresence opacity cross-fade 120ms on persona switch
  ✓ New alert arrival             — y:-8→0, opacity:0→1, 200ms spring
                                    Alert dot: single 600ms pulse keyframe, NOT infinite loop

DO NOT USE:
  ✗ Page route transitions        — sidebar never unmounts, navigation already feels instant
  ✗ Infinite loops on data        — only during active loading, stop immediately on resolve
  ✗ WebGL / Three.js              — wrong performance profile for enterprise laptop hardware
  ✗ Horizontal scroll pins        — breaks native comparison grid overflow scroll
  ✗ Magnetic cursor (MVP)         — post-MVP only, CTAs only, pull radius 80px max
  ✗ Scroll-driven narrative       — only apply scroll reveals to results list rows, nowhere else
  ✗ Width / height / padding animation — compositor thread only: transform + opacity
  ✗ Any animation on comparison grid cells while user is actively reading

Accessibility:
  <MotionConfig reducedMotion="user">{children}</MotionConfig>  ← wrap root layout, one line

GSAP SSR rules:
  - Always use useGSAP() hook — never raw useEffect for GSAP
  - ScrollTrigger: only inside useEffect, never at module level (window undefined on server)
  - Lenis: dynamic import only (see animation stack table above)
```

---

## Screens built (wireframe complete, ready for implementation)

| Screen | Route | Status |
|---|---|---|
| Login | `/login` | Wireframe done |
| Sign-up / Request access | `/signup` | Wireframe done |
| Dashboard | `/dashboard` | Wireframe done |
| Policy Search | `/search` | Wireframe done |
| Comparison Engine | `/compare` | Wireframe done |
| Upload & Extract | `/upload` | Spec only |
| Quarterly Diff | `/diff` | Spec only |
| Alerts | `/alerts` | Spec only |

---

## Auth & multi-tenant

- Auth provider: Clerk or NextAuth (teammate decision — wire before starting protected routes)
- Sign-up is **invite-only** — submit button hits an approval queue, not immediate account creation
- SSO is the primary auth path; email+password is fallback
- Role stored on user record as `default_persona: 'analyst' | 'mfr' | 'plan'`
- Work email enforced — block consumer domains (gmail, yahoo, hotmail, etc.)
- Trust badges required on auth screens: SOC 2 Type II · HIPAA Compliant · SSO Ready
- Sign-up role pill → persona mapping (store as `default_persona` on user record):
    'ANALYST'      → 'analyst'
    'MANUFACTURER' → 'mfr'
    'HEALTH PLAN'  → 'plan'

---

## Data strategy

**Seeded synthetic data (demo):** 20 normalized policy records across 8 payers and 5 drug classes
**Real public CPBs for live extraction demo:**
  - UHC Humira (immunology)
  - Aetna Keytruda (oncology)
  - Cigna Dupixent (dermatology)

These cover different drug classes and PA structures — maximum extraction variety for the demo.

---

## Rules

```
NEVER use Inter, Roboto, Arial, or system-ui as font family
NEVER use #FFFFFF as page background — use #F7F8FC
NEVER use 1px borders — always 0.5px (exception: featured card = 1.5px blue)
NEVER hardcode persona-specific data in components — all routing through /lib/persona.ts
NEVER write StatusPill more than once — import from /components/ui/StatusPill.tsx
NEVER animate width, height, padding, or margin — only transform and opacity
NEVER add animation to comparison grid cells while the user is actively reading
NEVER use infinite animation loops on data-bearing elements — loading states only
NEVER import GSAP ScrollTrigger at module level — SSR will break, use inside useEffect
NEVER import lenis at module level — dynamic import only with 'use client'

ALWAYS run /simplify after generating any new component
ALWAYS run /lint-and-validate after /simplify completes
ALWAYS use DM Mono for: status pills, J-codes, metric labels, policy IDs, timestamps
ALWAYS wrap animated lists in motion.ul with staggerChildren
ALWAYS respect prefers-reduced-motion via MotionConfig reducedMotion="user"
ALWAYS enforce sidebar state persistence in localStorage key: 'anton-cx-sidebar'
ALWAYS use useGSAP() hook for GSAP — handles cleanup, never raw useEffect
ALWAYS cap stagger: delay: Math.min(index * 0.04, 0.2)
```

---

## Active skills

### Official / bundled (Anthropic)
```
frontend-design          — enforces Clinical Precision aesthetic, distinctive typography,
                           bold design choices, purposeful animations
                           install: select from npx skills menu OR already bundled in Claude Code

simplify                 — parallel code review agents, extracts shared components,
                           fixes reuse/quality/efficiency before presenting diff
                           bundled in Claude Code — invoke with /simplify, no install needed
```

### Community — Antigravity Awesome Skills
```
api-design-principles    — consistent error shapes, typed responses, OpenAPI spec generation,
                           prevents ad-hoc route patterns across extract/policies/diff endpoints

lint-and-validate        — ESLint + TypeScript compiler + Prettier after every generation pass,
                           catches schema mismatches before they ship

create-pr                — structured PRs per feature branch with change summary + test checklist,
                           keeps git history clean across Dashboard/Search/Compare branches

install all three:
  npx antigravity-awesome-skills --claude
```

### Community — LobeHub
```
awwwards-animations      — Awwwards/FWA-grade motion using GSAP (useGSAP), Framer Motion,
                           Anime.js, and Lenis. Covers: smooth scroll, ScrollTrigger, magnetic
                           cursor, reveal/stagger animations, micro-interactions, custom cursors.
                           SSR-friendly hooks, 60fps performance patterns, requestAnimationFrame.
                           Critical for applying the motion spec above correctly.

  install: npx skills add neversight-skills_feed awwwards-animations
```

### Community — Remotion
```
remotion-best-practices  — spring physics, animation timing, stagger choreography.
                           Auto-loads when Claude touches any animation code.
                           Prevents linear CSS transitions where spring physics belongs.
                           Ensures sidebar collapse, persona cross-fade, and count-up
                           all use correct spring parameters.

  install: npx skills add remotion-dev/skills remotion-best-practices
```

### Community — Composio (post-MVP, skip for prototype sprint)
```
composio                 — 850+ SaaS integrations, OAuth lifecycle, standardized action schemas.
                           Use for: quarterly diff email alerts via SendGrid/Mailgun,
                           future payer portal URL watchers, Slack policy change notifications.

  install: npx skills add composio-dev/skills composio
```

### Custom (write before starting — full specs in SKILLS.md)
```
anton-cx-design-system   — full palette, typography, component library, spacing, Gotchas section
                           path: .claude/skills/anton-cx-design-system/SKILL.md

policy-extraction-schema — 9-field normalization schema + Anthropic extraction system prompt
                           + diff algorithm + validation rules
                           path: .claude/skills/policy-extraction-schema/SKILL.md

persona-routing          — all three persona column/filter/action configs + AnimatePresence
                           switcher spec + sign-up role mapping
                           path: .claude/skills/persona-routing/SKILL.md
```

---

## Skill install sequence (run in this order before first Claude Code session)

```bash
# 1. Community bundle — api-design-principles, lint-and-validate, create-pr
npx antigravity-awesome-skills --claude

# 2. Awwwards animation skill (LobeHub)
npx skills add neversight-skills_feed awwwards-animations

# 3. Remotion motion physics
npx skills add remotion-dev/skills remotion-best-practices

# 4. Composio — skip for prototype sprint, add post-MVP
# npx skills add composio-dev/skills composio

# 5. Animation libraries
npm install framer-motion gsap @gsap/react lenis react-countup

# 6. Custom skill directories
mkdir -p .claude/skills/anton-cx-design-system
mkdir -p .claude/skills/policy-extraction-schema
mkdir -p .claude/skills/persona-routing
# Copy SKILL.md content from SKILLS.md into each directory

# 7. Verify — type / inside Claude Code session, confirm these appear:
#    frontend-design · simplify · api-design-principles · lint-and-validate
#    create-pr · awwwards-animations · remotion-best-practices
#    anton-cx-design-system · policy-extraction-schema · persona-routing
```