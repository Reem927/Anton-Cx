---
name: persona-routing
description: >
  Anton Cx multi-tenant persona routing rules. Auto-load when building
  any component that shows different data or actions per user role,
  the persona switcher UI, or anything that reads session.user.default_persona.
---

# Persona routing

## The three personas

| Persona    | Value in DB    | Core question |
|---|---|---|
| Analyst    | `"analyst"`    | What changed across payers and where are clients exposed? |
| Manufacturer | `"mfr"`      | Which plans cover my drug, under what criteria, vs. competitors? |
| Health Plan | `"plan"`      | How does our policy compare to peer payers? |

## Data shown per persona

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
// CORRECT
const config = getPersonaConfig(session.user.default_persona)
return <CompareGrid columns={config.columns} />

// WRONG — never inline
if (persona === 'analyst') { ... }
```

## Persona switcher animation

```tsx
<AnimatePresence mode="wait">
  <motion.div
    key={currentPersona}
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.15 }}
  >
    {children}
  </motion.div>
</AnimatePresence>
// Total: ~230ms. Never cut this animation.
```

## Gotchas

- Never call persona routing logic in Server Components — session data requires `'use client'`
- `default_persona` (from sign-up) is the starting value; `activePersona` (from switcher) can differ per session
- MFR persona must never see raw PA criteria text
- PLAN persona should only see their own plan's data as "your policy"
