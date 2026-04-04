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
  pa_required: {
    label:  "PA REQ",
    bg:     "#FFF4E0",
    text:   "#D4880A",
    border: "#F5D898",
  },
  denied: {
    label:  "DENIED",
    bg:     "#FEE8E8",
    text:   "#B02020",
    border: "#F5C0C0",
  },
  not_covered: {
    label:  "NOT COVERED",
    bg:     "#FEE8E8",
    text:   "#B02020",
    border: "#F5C0C0",
  },
};

export function StatusPill({ status, size = "sm" }: StatusPillProps) {
  const { label, bg, text, border } = CONFIG[status];
  const fontSize = size === "md" ? "11px" : "9px";
  const padding  = size === "md" ? "3px 8px" : "2px 6px";

  return (
    <span
      style={{
        display:      "inline-flex",
        alignItems:   "center",
        background:   bg,
        color:        text,
        borderWidth:  "0.5px",
        borderStyle:  "solid",
        borderColor:  border,
        borderRadius: "4px",
        fontFamily:   "var(--font-dm-mono), 'DM Mono', monospace",
        fontSize,
        fontWeight:   500,
        letterSpacing: "0.06em",
        padding,
        whiteSpace:   "nowrap",
      }}
    >
      {label}
    </span>
  );
}
