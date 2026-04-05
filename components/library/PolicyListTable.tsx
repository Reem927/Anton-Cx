"use client";

import { StatusPill } from "@/components/ui/StatusPill";
import { PAYER_DISPLAY, formatDate } from "./utils";
import type { PolicyDocument } from "@/lib/types";

const GRID_COLS = "2fr 1.1fr 0.85fr 0.8fr 1fr 0.7fr 56px";
const HEADER_COLS = ["DRUG", "PAYER", "J-CODE", "STATUS", "INDICATIONS", "EFFECTIVE", ""];

interface Props {
  policies:    PolicyDocument[];
  selectedIds: Set<string>;
  onSelect:    (id: string) => void;
  onContextMenu: (id: string, x: number, y: number) => void;
}

export function PolicyListTable({ policies, selectedIds, onSelect, onContextMenu }: Props) {
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
              fontFamily:    "var(--font-dm-mono), 'DM Mono', monospace",
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


      {policies.map((policy, i) => (
        <ListRow
          key={policy.id}
          policy={policy}
          isLast={i === policies.length - 1}
          onContextMenu={onContextMenu}
        />
      ))}
    </div>
  );
}

function ListRow({
  policy, isLast, onContextMenu,
}: {
  policy: PolicyDocument;
  isLast: boolean;
  onContextMenu: (id: string, x: number, y: number) => void;
}) {
  const hasChanged   = policy.changed_fields.length > 0;
  const payerDisplay = PAYER_DISPLAY[policy.payer_id] ?? policy.payer_id;

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
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#F7F8FC"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
    >

      <div>
        <div
          style={{
            fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
            fontSize:   "13px",
            fontWeight: 600,
            color:      "#1B3A6B",
          }}
        >
          {policy.drug_name}
        </div>
        <div
          style={{
            fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
            fontSize:   "11px",
            color:      "#9AA3BB",
            marginTop:  "1px",
          }}
        >
          {policy.drug_generic}
        </div>
      </div>

      {/* Payer */}
      <div
        style={{
          fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
          fontSize:   "12px",
          fontWeight: 500,
          color:      "#2E6BE6",
        }}
      >
        {payerDisplay}
      </div>

      {/* J-Code */}
      <div>
        <span
          style={{
            fontFamily:   "var(--font-dm-mono), 'DM Mono', monospace",
            fontSize:     "11px",
            color:        "#6B7BA4",
            background:   "#F0F2FA",
            borderRadius: "4px",
            padding:      "2px 6px",
          }}
        >
          {policy.j_code}
        </span>
      </div>

      {/* Status */}
      <div>
        <StatusPill status={policy.coverage_status} />
      </div>

      {/* Indications */}
      <div
        style={{
          fontFamily:   "var(--font-dm-sans), 'DM Sans', sans-serif",
          fontSize:     "12px",
          color:        "#4A5578",
          overflow:     "hidden",
          textOverflow: "ellipsis",
          whiteSpace:   "nowrap",
        }}
      >
        {policy.indications.join(" · ") || "—"}
      </div>

      {/* Effective date */}
      <div
        style={{
          fontFamily: "var(--font-dm-mono), 'DM Mono', monospace",
          fontSize:   "11px",
          color:      "#9AA3BB",
        }}
      >
        {formatDate(policy.effective_date, true)}
      </div>

      {/* Actions */}
      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
        {hasChanged && (
          <div
            title="Changed this quarter"
            style={{
              width:        "5px",
              height:       "5px",
              borderRadius: "50%",
              background:   "#2E6BE6",
              flexShrink:   0,
            }}
          />
        )}
        <button
          onClick={e => { e.stopPropagation(); onContextMenu(policy.id, e.clientX, e.clientY); }}
          style={{
            fontFamily:   "var(--font-dm-sans), 'DM Sans', sans-serif",
            fontSize:     "11px",
            color:        "#2E6BE6",
            borderWidth:  "0.5px",
            borderStyle:  "solid",
            borderColor:  "#C4D4F8",
            background:   "#EBF0FC",
            borderRadius: "5px",
            padding:      "3px 8px",
            cursor:       "pointer",
          }}
        >
          View
        </button>
      </div>
    </div>
  );
}
