"use client";

import type { CoverageStatus } from "@/lib/types";

interface StatusPillProps {
  status: CoverageStatus;
  size?: "sm" | "md";
}

const CONFIG: Record<
  CoverageStatus,
  { label: string; bg: string; text: string; border: string }
> = {
  covered: {
    label:  "COVERED",
    bg:     "#EDFAF3",
    text:   "#0F7A40",
    border: "#B8EDD0",
  },
  not_covered: {
    label:  "NOT COVERED",
    bg:     "#FEE8E8",
    text:   "#B02020",
    border: "#F5C0C0",
  },
  no_policy_found: {
    label:  "NO POLICY",
    bg:     "#F0F2FA",
    text:   "#6B7BA4",
    border: "#D0D6E8",
  },
  pharmacy_only: {
    label:  "PHARMACY ONLY",
    bg:     "#FFF4E0",
    text:   "#D4880A",
    border: "#F5D898",
  },
};

export function StatusPill({ status, size = "sm" }: StatusPillProps) {
  const cfg = CONFIG[status] ?? CONFIG.not_covered;
  const fontSize = size === "md" ? "11px" : "9px";
  const padding  = size === "md" ? "3px 8px" : "2px 6px";

  return (
    <span
      style={{
        display:      "inline-flex",
        alignItems:   "center",
        background:   cfg.bg,
        color:        cfg.text,
        borderWidth:  "0.5px",
        borderStyle:  "solid",
        borderColor:  cfg.border,
        borderRadius: "4px",
        fontFamily:   "var(--font-dm-mono), Lato, sans-serif",
        fontSize,
        fontWeight:   500,
        letterSpacing: "0.06em",
        padding,
        whiteSpace:   "nowrap",
      }}
    >
      {cfg.label}
    </span>
  );
}

// ── Formulary Tier Pill ──────────────────────────────────────────

import type { FormularyTier } from "@/lib/types";

interface TierPillProps {
  tier: FormularyTier;
  size?: "sm" | "md";
}

const TIER_CONFIG: Record<
  string,
  { label: string; bg: string; text: string; border: string }
> = {
  preferred_specialty: {
    label:  "PREFERRED",
    bg:     "#EDFAF3",
    text:   "#0F7A40",
    border: "#B8EDD0",
  },
  non_specialty: {
    label:  "NON-SPECIALTY",
    bg:     "#EBF0FC",
    text:   "#2E6BE6",
    border: "#C4D4F8",
  },
  non_preferred: {
    label:  "NON-PREFERRED",
    bg:     "#FFF4E0",
    text:   "#D4880A",
    border: "#F5D898",
  },
  not_covered: {
    label:  "NOT COVERED",
    bg:     "#FEE8E8",
    text:   "#B02020",
    border: "#F5C0C0",
  },
};

export function TierPill({ tier, size = "sm" }: TierPillProps) {
  if (!tier) {
    return (
      <span
        style={{
          fontFamily:   "var(--font-dm-mono), Lato, sans-serif",
          fontSize:     size === "md" ? "11px" : "9px",
          color:        "#9AA3BB",
          letterSpacing: "0.06em",
        }}
      >
        —
      </span>
    );
  }

  const cfg = TIER_CONFIG[tier] ?? TIER_CONFIG.not_covered;
  const fontSize = size === "md" ? "11px" : "9px";
  const padding  = size === "md" ? "3px 8px" : "2px 6px";

  return (
    <span
      style={{
        display:      "inline-flex",
        alignItems:   "center",
        background:   cfg.bg,
        color:        cfg.text,
        borderWidth:  "0.5px",
        borderStyle:  "solid",
        borderColor:  cfg.border,
        borderRadius: "4px",
        fontFamily:   "var(--font-dm-mono), Lato, sans-serif",
        fontSize,
        fontWeight:   500,
        letterSpacing: "0.06em",
        padding,
        whiteSpace:   "nowrap",
      }}
    >
      {cfg.label}
    </span>
  );
}
