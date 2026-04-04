# Anton Cx — Custom Claude Code Skills

> This file defines the three custom skills to create inside `.claude/skills/` before starting development.
> Skills are loaded by Claude Code on-demand when relevant tasks are detected.
> Create each as a directory: `.claude/skills/<skill-name>/SKILL.md`

---

## How to install community skills first

Run these before creating custom skills:

```bash
# frontend-design — select from interactive menu (already bundled in Claude Code)
# OR curl directly:
mkdir -p ~/.claude/skills/frontend-design
curl -o ~/.claude/skills/frontend-design/SKILL.md \
  https://raw.githubusercontent.com/anthropics/claude-code/main/plugins/frontend-design/skills/frontend-design/SKILL.md

# simplify — already bundled in Claude Code, invoke with /simplify, no install needed

# api-design-principles, lint-and-validate, create-pr — Antigravity community bundle
npx antigravity-awesome-skills --claude

# awwwards-animations — LobeHub community skill
npx skills add neversight-skills_feed awwwards-animations

# remotion-best-practices — auto-loads when Claude touches animation code
npx skills add remotion-dev/skills remotion-best-practices

# browser verification (pick one):
# Option A — Official Anthropic Chrome plugin
# Run inside Claude Code: /plugin install chrome@claude-plugins-official
# Option B — dev-browser (community)
# Run inside Claude Code: /plugin marketplace add sawyerhood/dev-browser

# claude-md-management — maintains CLAUDE.md quality over sessions
# Run inside Claude Code: /plugin install claude-md-management@claude-plugins-official
```

---

## Skill 1: `anton-cx-design-system`

**File:** `.claude/skills/anton-cx-design-system/SKILL.md`
**Trigger:** Auto-loads whenever Claude touches any UI component, page, or style file.

```markdown
---
name: anton-cx-design-system
description: >
  Anton Cx Clinical Precision design system. Auto-load when creating or editing
  any component, page, layout, or style. Enforces palette, typography, component
  patterns, and spacing rules specific to this codebase.
---

# Anton Cx design system

## Palette (Tailwind arbitrary values or CSS variables)

Use these exact values. Never substitute.

| Token          | Hex       | Usage |
|---|---|---|
| navy           | #1B3A6B   | Sidebar active, persona badge, brand panel, avatar bg |
| blue-accent    | #2E6BE6   | CTAs, links, focus rings, active states |
| blue-light     | #EBF0FC   | Active sidebar bg, badge bg, input focus bg |
| blue-mid       | #C4D4F8   | Borders on blue elements |
| page-bg        | #F7F8FC   | Page background — NEVER #FFFFFF |
| card-bg        | #FFFFFF   | Panels, sidebar, top bar, form inputs |
| border         | #E8EBF2   | All borders, always 0.5px weight |
| border-mid     | #D0D6E8   | Hover borders |
| text-primary   | #0D1C3A   | Headings, drug names, values |
| text-secondary | #6A7590   | Body text, descriptions |
| text-muted     | #A0AABB   | Labels, timestamps, secondary metadata |

Status pill colors:
| State    | bg       | text    | border  |
|---|---|---|---|
| COVERED  | #EDFAF3  | #0F7A40 | #B8EDD0 |
| PA REQ   | #FFF4E0  | #D4880A | #F5D898 |
| DENIED   | #FEE8E8  | #B02020 | #F5C0C0 |

Cell highlight colors (comparison grid):
| State    | bg       |
|---|---|
| CONFLICT | #FFF4E0  |
| CHANGED  | #FFFBEB  |
| MATCH    | #FFFFFF  |

## Typography

```tsx
// CORRECT
<h1 className="font-['Syne'] font-bold text-[#0D1C3A]">Anton Cx</h1>
<p className="font-['DM_Sans'] text-sm text-[#6A7590]">Body text</p>
<span className="font-['DM_Mono'] text-[9px] tracking-wider text-[#A0AABB]">LABEL</span>

// WRONG — never use these
<h1 className="font-sans">         ← no generic font-sans
<p className="font-inter">         ← no Inter
<span style="font-family: Arial">  ← no Arial
```

Font assignments:
- `font-['Syne']` → headings, logo, page titles, drug names, sidebar nav labels
- `font-['DM_Sans']` → all body text, descriptions, form fields, button labels
- `font-['DM_Mono']` → status pills, J-codes, metric labels, timestamps, policy IDs, section labels, keyboard shortcuts

## Borders

```tsx
// CORRECT
className="border border-[#E8EBF2]"          // always 0.5px equivalent via border
className="border-[1.5px] border-[#C4D4F8]"  // featured card only

// WRONG
className="border-2"   ← too heavy except featured card
className="border"     ← only acceptable, Tailwind defaults to 1px, prefer inline style for precision
```

## StatusPill component

Always import from `/components/ui/StatusPill.tsx`. Never write a pill inline.

```tsx
import { StatusPill } from '@/components/ui/StatusPill'
<StatusPill status="covered" />    // renders COVERED pill
<StatusPill status="pa_required" /> // PA REQ
<StatusPill status="denied" />      // DENIED
```

## Spacing

- Component internal padding: `p-4` (16px) or `p-3` (12px)
- Gap between cards: `gap-3` (12px)
- Section margin bottom: `mb-6` (24px)
- Sidebar item padding: `py-[7px] px-[14px]`
- Top bar height: `h-12` (48px)
- Sidebar expanded width: `w-[200px]`
- Sidebar collapsed width: `w-[44px]`

## Gotchas

- Page background is ALWAYS `bg-[#F7F8FC]` — catch any `bg-white` on page-level elements
- Borders are ALWAYS 0.5px — use `style={{ borderWidth: '0.5px' }}` for precision where Tailwind rounds
- DM Mono is required for ALL: status pills, J-codes, metric card labels, policy version numbers
- The comparison grid must never animate while the user is reading — no transitions on cell content
- Sidebar toggle state must persist in localStorage key `'anton-cx-sidebar'`
```

---

## Skill 2: `policy-extraction-schema`

**File:** `.claude/skills/policy-extraction-schema/SKILL.md`
**Trigger:** Auto-loads when working on `/api/extract`, extraction prompts, Prisma schema, or any file that references `PolicyDocument`.

```markdown
---
name: policy-extraction-schema
description: >
  Anton Cx policy extraction schema and Anthropic API prompt spec.
  Auto-load when working on the extract API route, Prisma schema,
  seed data, or any file that imports or defines PolicyDocument.
---

# Policy extraction schema

## The 9 normalized fields

Every ingested clinical policy PDF must produce exactly this structure.
Do not add fields. Do not remove fields. Do not rename fields.

```typescript
interface PolicyDocument {
  id:                   string       // uuid, generated server-side
  payer_id:             string       // lowercase slug: "aetna" | "uhc" | "cigna" | "bcbs-tx" | "humana" | "elevance" | "centene" | "kaiser"
  drug_name:            string       // brand name e.g. "Humira"
  drug_generic:         string       // INN e.g. "adalimumab"
  j_code:               string       // HCPCS J-code e.g. "J0135" — empty string if not found
  coverage_status:      'covered' | 'pa_required' | 'denied' | 'not_covered'
  prior_auth_required:  boolean
  prior_auth_criteria:  string       // verbatim extracted text, max 500 chars
  step_therapy:         boolean
  step_therapy_drugs:   string[]     // e.g. ["methotrexate", "sulfasalazine"]
  site_of_care:         string | null // e.g. "office or outpatient infusion only" | null
  indications:          string[]     // covered diagnoses as abbreviations e.g. ["RA", "PsA", "CD"]
  quantity_limit:       string | null // e.g. "40mg Q2W or 80mg Q4W"
  clinical_criteria:    string | null // score thresholds e.g. "CDAI >220 or DAS28 >3.2"
  renewal_period:       string | null // e.g. "12 months"
  policy_version:       string       // e.g. "v4.2" — extract from PDF header/footer
  effective_date:       string       // ISO date YYYY-MM-DD
  source_pdf_url:       string | null
  extracted_at:         string       // ISO datetime, set server-side
  changed_fields:       string[]     // populated by diff logic, not extraction
}
```

## Anthropic extraction prompt

Use this exact system prompt for the `/api/extract` route:

```typescript
const EXTRACTION_SYSTEM_PROMPT = `
You are a clinical policy document parser for Anton Cx, a medical benefit drug intelligence platform.

Extract the following 9 fields from the provided clinical policy document (CPB) and return ONLY valid JSON.
Do not include markdown code fences or any text outside the JSON object.

Fields to extract:
1. drug_name: Brand name of the drug (string)
2. drug_generic: Generic/INN name (string)
3. j_code: HCPCS J-code, format "J####" (string, empty string if not found)
4. coverage_status: One of: "covered", "pa_required", "denied", "not_covered"
5. prior_auth_required: true/false
6. prior_auth_criteria: Verbatim clinical criteria text for PA approval, max 500 characters
7. step_therapy: true/false (true if patient must try other drugs first)
8. step_therapy_drugs: Array of drug names required before this drug (string[], empty array if none)
9. site_of_care: Where the drug must be administered, or null if no restriction (string | null)
10. indications: Array of covered diagnosis abbreviations e.g. ["RA", "PsA"] (string[])
11. quantity_limit: Dose and frequency limit, or null if not specified (string | null)
12. clinical_criteria: Specific score thresholds required e.g. "DAS28 >3.2", or null (string | null)
13. renewal_period: How often PA must be renewed e.g. "12 months", or null (string | null)
14. policy_version: Version number from document header/footer e.g. "v4.2" (string)
15. effective_date: Policy effective date in YYYY-MM-DD format (string)

If a field cannot be determined from the document, use null for nullable fields,
false for booleans, empty string for j_code, and empty array for arrays.
`
```

## Validation

After extraction, validate the response before saving:

```typescript
function validatePolicyDocument(raw: unknown): PolicyDocument {
  // Required fields that must be non-empty
  const required = ['drug_name', 'drug_generic', 'coverage_status', 'policy_version', 'effective_date']
  // coverage_status must be one of the four valid values
  const validStatuses = ['covered', 'pa_required', 'denied', 'not_covered']
  // Throw ExtractinValidationError if any required field is missing or status is invalid
}
```

## Diff algorithm

When a new version of a policy is extracted, compute `changed_fields`:

```typescript
function diffPolicies(prev: PolicyDocument, next: PolicyDocument): string[] {
  const DIFFABLE_FIELDS = [
    'coverage_status', 'prior_auth_required', 'prior_auth_criteria',
    'step_therapy', 'step_therapy_drugs', 'site_of_care',
    'indications', 'quantity_limit', 'clinical_criteria', 'renewal_period'
  ]
  // Return array of field names where values differ between prev and next
  // For arrays: compare sorted JSON.stringify
  // For strings: trim and lowercase before comparison
}
```

## Gotchas

- `payer_id` is a slug, always lowercase, always hyphenated — never "BCBS TX" or "BCBSTx"
- `j_code` must match format `J####` exactly — if the document shows "J0135" extract it as-is
- `prior_auth_criteria` is free text — preserve clinical language exactly, do not paraphrase
- `step_therapy_drugs` should use generic names, not brand names — "methotrexate" not "Rheumatrex"
- `effective_date` must be ISO format — if document shows "January 1, 2026" convert to "2026-01-01"
- `changed_fields` is NEVER populated by extraction — only by the diff route after comparing to previous version
```

---

## Skill 3: `persona-routing`

**File:** `.claude/skills/persona-routing/SKILL.md`
**Trigger:** Auto-loads when working on components that render persona-specific content, the persona switcher, or any file that reads `session.user.default_persona`.

```markdown
---
name: persona-routing
description: >
  Anton Cx multi-tenant persona routing rules. Auto-load when building
  any component that shows different data or actions per user role,
  the persona switcher UI, or anything that reads session.user.default_persona.
---

# Persona routing

## The three personas

| Persona    | Value in DB    | Who uses it | Core question they're answering |
|---|---|---|---|
| Analyst    | `"analyst"`    | Internal Anton Rx team | What changed across payers and where are clients exposed? |
| Manufacturer | `"mfr"`      | Pharma/biotech clients | Which plans cover my drug, under what criteria, vs. competitors? |
| Health Plan | `"plan"`      | Payer/insurer clients | How does our policy compare to peer payers? |

## Data shown per persona

All three personas see the same 9 normalized fields. What changes is:
- Which fields are surfaced in the UI
- Column headers and labels
- Available filter chips
- Action buttons
- The summary banner text

### Comparison Engine columns

| Field shown | ANALYST | MFR | PLAN |
|---|---|---|---|
| Coverage status | ✓ | ✓ | ✓ |
| PA criteria summary | ✓ | — | — |
| Step therapy | ✓ | — | — |
| Changed this quarter | ✓ | — | — |
| Covered indications | — | ✓ | — |
| Net price tier | — | ✓ | — |
| Access classification | — | ✓ | — |
| Your policy (own payer) | — | — | ✓ |
| Peer benchmark rank | — | — | ✓ |
| Variance flag | — | — | ✓ |

### Filter chips per persona

```typescript
const FILTERS: Record<Persona, string[]> = {
  analyst: ['All payers', 'PA required', 'Changed this qtr', 'Denied'],
  mfr:     ['All payers', 'By indication', 'Biosimilar exposure', 'Open access', 'Restricted'],
  plan:    ['All drugs', 'My policy only', 'Outliers', 'More restrictive', 'More permissive', 'Changed'],
}
```

### Action buttons per persona

```typescript
const ACTIONS: Record<Persona, string[]> = {
  analyst: ['Open in Compare', 'Export CSV', 'Upload policy'],
  mfr:     ['Export access report', 'View competitive positioning'],
  plan:    ['Export benchmark report', 'Flag for review'],
}
```

## Implementation pattern

All persona routing goes through `/lib/persona.ts`. Never branch on persona inline.

```typescript
// /lib/persona.ts
export type Persona = 'analyst' | 'mfr' | 'plan'

export function getPersonaConfig(persona: Persona) {
  return {
    columns:     COLUMNS[persona],
    filters:     FILTERS[persona],
    actions:     ACTIONS[persona],
    bannerText:  BANNER_TEXT[persona],
    searchLabel: SEARCH_LABELS[persona],
  }
}

// In a component — CORRECT
const config = getPersonaConfig(session.user.default_persona)
return <CompareGrid columns={config.columns} />

// WRONG — never branch inline
if (persona === 'analyst') { ... }
else if (persona === 'mfr') { ... }
```

## Persona switcher animation

The persona switcher is the highest-impact animation in the demo.
When persona changes, the content area must cross-fade:

```tsx
// Content area wrapper
<AnimatePresence mode="wait">
  <motion.div
    key={currentPersona}
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.15 }}   // exit: 80ms out, then 150ms in
  >
    {children}
  </motion.div>
</AnimatePresence>

// Active persona badge spring pop
<motion.div
  animate={{ scale: [0.9, 1.05, 1] }}
  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
>
  {persona.toUpperCase()}
</motion.div>
```

Total transition time: ~230ms. Never cut this animation.

## Sign-up → default persona

When a user completes sign-up and selects a role pill, that value maps directly:

```typescript
const ROLE_TO_PERSONA: Record<string, Persona> = {
  'ANALYST':      'analyst',
  'MANUFACTURER': 'mfr',
  'HEALTH PLAN':  'plan',
}
// Store on user record as default_persona on account creation
```

## Gotchas

- Never call persona routing logic in Server Components — session data requires `'use client'`
- The persona switcher in the top bar changes the active persona for the session, not the user's default
- `default_persona` (from sign-up) is the starting value; `activePersona` (from switcher) can differ per session
- MFR persona must never see raw PA criteria text — this is competitive intelligence they shouldn't have
- PLAN persona should only see their own plan's data as "your policy" — never another plan's internal view
```

---

## Skill directory structure

After creating all three, your `.claude/skills/` directory should look like:

```
.claude/
└── skills/
    ├── anton-cx-design-system/
    │   └── SKILL.md
    ├── policy-extraction-schema/
    │   └── SKILL.md
    │   └── references/
    │       └── sample-extracted-output.json   ← add a sample after first real extraction
    └── persona-routing/
        └── SKILL.md
```

---

## Skill authoring notes

Per the Agent Skills open standard:

- **Description field is a trigger, not a summary** — write it for the model, not for a human reader
- **Gotchas section is the highest-signal content** — add Claude's actual failure points as you observe them over sessions
- **Don't railroad Claude** — give goals and constraints, not prescriptive step-by-step instructions
- **Progressive disclosure** — SKILL.md stays concise, detailed reference goes in `references/` subdirectory
- **Update skills when models fail** — if Claude generates a status pill inline instead of importing it, add that to the design system skill's Gotchas section immediately