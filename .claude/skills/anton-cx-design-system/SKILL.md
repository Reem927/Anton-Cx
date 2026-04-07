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
style={{ borderWidth: '0.5px', borderColor: '#E8EBF2' }}  // standard border
style={{ borderWidth: '1.5px', borderColor: '#C4D4F8' }}  // featured card only

// WRONG
className="border-2"   ← too heavy
```

## StatusPill component

Always import from `/components/ui/StatusPill.tsx`. Never write a pill inline.

```tsx
import { StatusPill } from '@/components/ui/StatusPill'
<StatusPill status="covered" />
<StatusPill status="pa_required" />
<StatusPill status="denied" />
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
- Borders are ALWAYS 0.5px — use `style={{ borderWidth: '0.5px' }}` for precision
- DM Mono is required for ALL: status pills, J-codes, metric card labels, policy version numbers
- The comparison grid must never animate while the user is reading — no transitions on cell content
- Sidebar toggle state must persist in localStorage key `'anton-cx-sidebar'`
- Never write a StatusPill inline — always import from `/components/ui/StatusPill.tsx`
