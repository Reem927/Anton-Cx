"use client";

import type { PolicyDocument } from "@/lib/types";

interface DiffSummaryBarProps {
  policies: PolicyDocument[];
  payers:   string[];
  drug:     string;
}

export function DiffSummaryBar({ policies, payers, drug }: DiffSummaryBarProps) {
  const drugPolicies = policies.filter(
    (p) => p.drug_name === drug && payers.includes(p.payer_id)
  );

  const changedCount = drugPolicies.filter((p) => p.changed_fields.length > 0).length;
  const paCount      = drugPolicies.filter((p) => p.prior_auth_required).length;
  const deniedCount  = drugPolicies.filter((p) => p.coverage_status === "not_covered").length;
  const coveredCount = drugPolicies.filter((p) => p.coverage_status === "covered").length;

  if (drugPolicies.length === 0) return null;

  return (
    <div
      className="flex items-center gap-6 rounded-lg px-4 py-3 mb-4"
      style={{
        background:  "#FFFFFF",
        borderWidth: "0.5px",
        borderStyle: "solid",
        borderColor: "#E8EBF2",
      }}
    >
      <Stat label="PAYERS" value={drugPolicies.length} />
      <Divider />
      <Stat label="PA REQUIRED" value={paCount} color="#D4880A" />
      <Divider />
      <Stat label="COVERED" value={coveredCount} color="#0F7A40" />
      <Divider />
      <Stat label="DENIED" value={deniedCount} color="#B02020" />
      {changedCount > 0 && (
        <>
          <Divider />
          <Stat label="CHANGED THIS QTR" value={changedCount} color="#D4880A" />
        </>
      )}
    </div>
  );
}

function Stat({ label, value, color = "#0D1C3A" }: { label: string; value: number; color?: string }) {
  return (
    <div className="flex flex-col gap-[2px]">
      <span
        style={{
          fontFamily:    "var(--font-dm-mono), Lato, sans-serif",
          fontSize:      "9px",
          color:         "#A0AABB",
          letterSpacing: "0.08em",
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: "var(--font-syne), Lato, sans-serif",
          fontSize:   "20px",
          fontWeight: 800,
          color,
          lineHeight: 1,
        }}
      >
        {value}
      </span>
    </div>
  );
}

function Divider() {
  return (
    <div style={{ width: "0.5px", height: "32px", background: "#E8EBF2", flexShrink: 0 }} />
  );
}
