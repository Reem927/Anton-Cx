"use client";

import { StatusPill, TierPill } from "@/components/ui/StatusPill";
import { PAYER_DISPLAY, formatDate } from "./utils";
import type { DrugGroup } from "@/app/(app)/policy-lib/page";

const GRID_COLS = "2fr 1.5fr 0.8fr 1fr 1fr 0.8fr 56px";
const HEADER_COLS = ["DRUG", "PAYERS", "CODE", "COVERAGE", "FORMULARY TIER", "EFFECTIVE", ""];

interface Props {
  groups:       DrugGroup[];
  onContextMenu:(id: string, x: number, y: number) => void;
  onDownload?:  (group: DrugGroup) => void;
  onOpen?:      (group: DrugGroup) => void;
}

export function PolicyListTable({ groups, onContextMenu, onDownload, onOpen }: Props) {
  return (
    <div
      style={{
        background:   "#FFFFFF",
        borderWidth:  "0.5px",
        borderStyle:  "solid",
        borderColor:  "#E8EBF2",
        borderRadius: "10px",
        overflow:     "hidden",
      }}
    >

      <div
        style={{
          display:         "grid",
          gridTemplateColumns: GRID_COLS,
          padding:         "7px 16px",
          borderBottom:    "0.5px solid #E8EBF2",
          background:      "#FAFBFD",
        }}
      >
        {HEADER_COLS.map(col => (
          <span
            key={col}
            style={{
              fontFamily:    "var(--font-dm-mono), Lato, sans-serif",
              fontSize:      "10px",
              fontWeight:    600,
              color:         "#9AA3BB",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
          >
            {col}
          </span>
        ))}
      </div>


      {groups.map((group, i) => (
        <GroupRow
          key={group.drug_generic}
          group={group}
          isLast={i === groups.length - 1}
          onContextMenu={onContextMenu}
          onDownload={onDownload}
          onOpen={onOpen}
        />
      ))}
    </div>
  );
}

function GroupRow({
  group, isLast, onContextMenu, onDownload, onOpen,
}: {
  group: DrugGroup;
  isLast: boolean;
  onContextMenu: (id: string, x: number, y: number) => void;
  onDownload?: (group: DrugGroup) => void;
  onOpen?: (group: DrugGroup) => void;
}) {
  const hasChanged = group.hasChanges;
  const groupId = group.drug_generic.toLowerCase();

  const payerLabels = group.payer_ids.map(id =>
    PAYER_DISPLAY[id] ?? id.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase())
  );

  // Collect unique statuses and tiers
  const statuses = [...new Set(group.policies.map(p => p.coverage_status))];
  const tiers = [...new Set(group.policies.map(p => p.formulary_tier))];

  return (
    <div
      style={{
        display:             "grid",
        gridTemplateColumns: GRID_COLS,
        padding:             "10px 16px",
        borderBottom:        isLast ? "none" : "0.5px solid #E8EBF2",
        alignItems:          "center",
        cursor:              "pointer",
        transition:          "background 80ms",
      }}
      onClick={() => onOpen?.(group)}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#F7F8FC"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
    >
      {/* Drug */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span
            style={{
              fontFamily: "var(--font-dm-sans), Lato, sans-serif",
              fontSize:   "13px",
              fontWeight: 600,
              color:      "#1B3A6B",
            }}
          >
            {group.drug_name}
          </span>
          {hasChanged && (
            <div
              title="Changed this quarter"
              style={{
                width: 5, height: 5, borderRadius: "50%",
                background: "#2E6BE6", flexShrink: 0,
              }}
            />
          )}
        </div>
        <div
          style={{
            fontFamily: "var(--font-dm-sans), Lato, sans-serif",
            fontSize:   "11px",
            color:      "#9AA3BB",
            marginTop:  "1px",
          }}
        >
          {group.drug_generic}
        </div>
      </div>

      {/* Payers */}
      <div
        style={{
          fontFamily: "var(--font-dm-sans), Lato, sans-serif",
          fontSize:   "12px",
          fontWeight: 500,
          color:      "#1B3A6B",
          lineHeight: "1.4",
        }}
      >
        {payerLabels.join(" | ")}
      </div>

      {/* Code */}
      <div>
        <span
          style={{
            fontFamily:   "var(--font-dm-mono), Lato, sans-serif",
            fontSize:     "11px",
            color:        "#6B7BA4",
            background:   "#F0F2FA",
            borderRadius: "4px",
            padding:      "2px 6px",
          }}
        >
          {group.j_code || "—"}
        </span>
      </div>

      {/* Coverage — show all unique statuses */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "3px" }}>
        {statuses.map(s => (
          <StatusPill key={s} status={s} />
        ))}
      </div>

      {/* Formulary Tier — show all unique tiers */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "3px" }}>
        {tiers.map((t, i) => (
          <TierPill key={t ?? `null-${i}`} tier={t} />
        ))}
      </div>

      {/* Effective */}
      <div
        style={{
          fontFamily: "var(--font-dm-mono), Lato, sans-serif",
          fontSize:   "11px",
          color:      "#9AA3BB",
        }}
      >
        {formatDate(group.effective_date, true)}
      </div>

      {/* Actions */}
      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
        <button
          onClick={e => { e.stopPropagation(); onDownload?.(group); }}
          title="Download PDF"
          style={{
            width: 24, height: 24, borderRadius: "50%",
            border: "none", background: "transparent",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", color: "#9AA3BB",
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#2E6BE6"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "#9AA3BB"; }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M6 2v6M3.5 6l2.5 2 2.5-2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M1.5 10h9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
        </button>
        <button
          onClick={e => { e.stopPropagation(); onContextMenu(groupId, e.clientX, e.clientY); }}
          style={{
            width: 24, height: 24, borderRadius: "50%",
            border: "none", background: "transparent",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", color: "#9AA3BB",
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#1B3A6B"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "#9AA3BB"; }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="7" cy="3.5" r="1" fill="currentColor" />
            <circle cx="7" cy="7"   r="1" fill="currentColor" />
            <circle cx="7" cy="10.5" r="1" fill="currentColor" />
          </svg>
        </button>
      </div>
    </div>
  );
}
