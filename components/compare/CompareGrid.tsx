"use client";

import { StatusPill } from "@/components/ui/StatusPill";
import type { PolicyDocument } from "@/lib/types";
import type { PersonaConfig } from "@/lib/persona";

interface CompareGridProps {
  payers:       string[];
  drug:         string;
  policies:     PolicyDocument[];
  config:       PersonaConfig;
  diffsOnly:    boolean;
}

type CellState = "conflict" | "changed" | "match";

function getCellState(values: unknown[]): CellState {
  const unique = new Set(values.map((v) => JSON.stringify(v)));
  if (unique.size > 1) return "conflict";
  return "match";
}

const CELL_BG: Record<CellState, string> = {
  conflict: "#FFF4E0",
  changed:  "#FFFBEB",
  match:    "#FFFFFF",
};

export function CompareGrid({ payers, drug, policies, config, diffsOnly }: CompareGridProps) {
  const drugPolicies = policies.filter((p) => p.drug_name === drug && payers.includes(p.payer_id));

  // Build rows from config.columns (excluding "payer_id" which is the header)
  const dataColumns = config.columns.filter((c) => c.key !== "payer_id");

  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{
        background:  "#FFFFFF",
        borderWidth: "0.5px",
        borderStyle: "solid",
        borderColor: "#E8EBF2",
        overflowX:   "auto",
      }}
    >
      <table className="border-collapse" style={{ minWidth: "100%", tableLayout: "fixed" }}>
        <colgroup>
          <col style={{ width: "200px" }} />
          {payers.map((p) => (
            <col key={p} style={{ width: "180px" }} />
          ))}
        </colgroup>

        {/* Header */}
        <thead>
          <tr style={{ borderBottom: "0.5px solid #E8EBF2" }}>
            <th
              style={{
                padding:       "10px 16px",
                background:    "#F7F8FC",
                textAlign:     "left",
                fontFamily:    "var(--font-dm-mono), Lato, sans-serif",
                fontSize:      "9px",
                fontWeight:    500,
                letterSpacing: "0.08em",
                color:         "#A0AABB",
              }}
            >
              FIELD
            </th>
            {payers.map((payer) => {
              const policy = drugPolicies.find((p) => p.payer_id === payer);
              return (
                <th
                  key={payer}
                  style={{
                    padding:       "10px 16px",
                    background:    "#F7F8FC",
                    textAlign:     "left",
                    borderLeft:    "0.5px solid #E8EBF2",
                  }}
                >
                  <div
                    style={{
                      fontFamily:    "var(--font-syne), Lato, sans-serif",
                      fontSize:      "12px",
                      fontWeight:    700,
                      color:         "#0D1C3A",
                      marginBottom:  "2px",
                    }}
                  >
                    {payer.toUpperCase()}
                  </div>
                  {policy && (
                    <div
                      style={{
                        fontFamily:    "var(--font-dm-mono), Lato, sans-serif",
                        fontSize:      "9px",
                        color:         "#A0AABB",
                        letterSpacing: "0.04em",
                      }}
                    >
                      {policy.policy_version} · {policy.effective_date}
                    </div>
                  )}
                </th>
              );
            })}
          </tr>
        </thead>

        {/* Body */}
        <tbody>
          {dataColumns.map((col) => {
            const values = payers.map((payer) => {
              const policy = drugPolicies.find((p) => p.payer_id === payer);
              return policy ? policy[col.key as keyof PolicyDocument] : null;
            });

            const cellState = getCellState(values);

            // In diffsOnly mode, hide matching rows
            if (diffsOnly && cellState === "match") return null;

            return (
              <tr key={col.key} style={{ borderBottom: "0.5px solid #E8EBF2" }}>
                <td
                  style={{
                    padding:    "10px 16px",
                    fontFamily: "var(--font-dm-mono), Lato, sans-serif",
                    fontSize:   "10px",
                    fontWeight: 500,
                    color:      "#6A7590",
                    letterSpacing: "0.05em",
                    background: "#FAFBFD",
                    verticalAlign: "top",
                  }}
                >
                  {col.label.toUpperCase()}
                </td>
                {payers.map((payer, pi) => {
                  const policy = drugPolicies.find((p) => p.payer_id === payer);
                  const value  = values[pi];
                  const isChanged = policy?.changed_fields.includes(col.key) ?? false;
                  const bg = isChanged ? CELL_BG.changed : CELL_BG[cellState];

                  return (
                    <td
                      key={payer}
                      style={{
                        padding:       "10px 16px",
                        background:    bg,
                        borderLeft:    "0.5px solid #E8EBF2",
                        verticalAlign: "top",
                      }}
                    >
                      <CellValue fieldKey={col.key} value={value} policy={policy} />
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function CellValue({
  fieldKey,
  value,
  policy,
}: {
  fieldKey: string;
  value:    unknown;
  policy:   PolicyDocument | undefined;
}) {
  if (!policy || value === null || value === undefined) {
    return <span style={{ color: "#D0D6E8", fontSize: "13px" }}>—</span>;
  }

  if (fieldKey === "coverage_status") {
    return <StatusPill status={policy.coverage_status} />;
  }

  if (fieldKey === "prior_auth_required" || fieldKey === "step_therapy") {
    return (
      <span
        style={{
          fontFamily:    "var(--font-dm-mono), Lato, sans-serif",
          fontSize:      "10px",
          color:         value ? "#D4880A" : "#0F7A40",
          letterSpacing: "0.05em",
        }}
      >
        {value ? "YES" : "NO"}
      </span>
    );
  }

  if (Array.isArray(value)) {
    if (value.length === 0) return <span style={{ color: "#D0D6E8", fontSize: "12px" }}>None</span>;
    return (
      <div className="flex flex-wrap gap-1">
        {(value as string[]).map((v) => (
          <span
            key={v}
            style={{
              fontFamily:    "var(--font-dm-mono), Lato, sans-serif",
              fontSize:      "9px",
              color:         "#6A7590",
              background:    "#F7F8FC",
              borderWidth:   "0.5px",
              borderStyle:   "solid",
              borderColor:   "#E8EBF2",
              borderRadius:  "3px",
              padding:       "1px 5px",
              letterSpacing: "0.04em",
            }}
          >
            {v}
          </span>
        ))}
      </div>
    );
  }

  if (typeof value === "string") {
    return (
      <span
        style={{
          fontFamily: "var(--font-dm-sans), Lato, sans-serif",
          fontSize:   "12px",
          color:      "#0D1C3A",
          display:    "block",
          maxWidth:   "160px",
          overflow:   "hidden",
          textOverflow: "ellipsis",
          whiteSpace:   value.length > 60 ? "normal" : "nowrap",
        }}
      >
        {value}
      </span>
    );
  }

  return (
    <span
      style={{
        fontFamily: "var(--font-dm-mono), Lato, sans-serif",
        fontSize:   "11px",
        color:      "#0D1C3A",
      }}
    >
      {String(value)}
    </span>
  );
}
