"use client";

import { StatusPill } from "@/components/ui/StatusPill";
import type { PolicyDocument } from "@/lib/types";
import type { PersonaConfig } from "@/lib/persona";

interface CompareGridProps {
  payers: string[];
  drug: string;
  policies: PolicyDocument[];
  config: PersonaConfig;
  diffsOnly: boolean;
}

type CellState = "conflict" | "changed" | "match";

function getCellState(values: unknown[]): CellState {
  const normalized = values.map((value) => JSON.stringify(value));
  const unique = new Set(normalized);
  return unique.size > 1 ? "conflict" : "match";
}

const CELL_BG: Record<CellState, string> = {
  conflict: "#FFF4E0",
  changed: "#FFFBEB",
  match: "#FFFFFF",
};

export function CompareGrid({
  payers,
  drug,
  policies,
  config,
  diffsOnly,
}: CompareGridProps) {
  const drugPolicies = policies.filter(
    (p) => p.drug_name === drug && payers.includes(p.payer_id)
  );

  const dataColumns = config.columns.filter((c) => c.key !== "payer_id");

  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{
        background: "#FFFFFF",
        borderWidth: "0.5px",
        borderStyle: "solid",
        borderColor: "#E8EBF2",
        overflowX: "auto",
      }}
    >
      <table className="border-collapse" style={{ minWidth: "100%", tableLayout: "fixed" }}>
        <colgroup>
          <col style={{ width: "220px" }} />
          {payers.map((payer) => (
            <col key={payer} style={{ width: "220px" }} />
          ))}
        </colgroup>

        <thead>
          <tr style={{ borderBottom: "0.5px solid #E8EBF2" }}>
            <th
              style={{
                padding: "12px 16px",
                background: "#F7F8FC",
                textAlign: "left",
                fontFamily: "var(--font-dm-mono), 'DM Mono', monospace",
                fontSize: "9px",
                fontWeight: 500,
                letterSpacing: "0.08em",
                color: "#A0AABB",
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
                    padding: "12px 16px",
                    background: "#F7F8FC",
                    textAlign: "left",
                    borderLeft: "0.5px solid #E8EBF2",
                  }}
                >
                  <div
                    style={{
                      fontFamily: "var(--font-syne), Syne, sans-serif",
                      fontSize: "12px",
                      fontWeight: 700,
                      color: "#0D1C3A",
                      marginBottom: "2px",
                    }}
                  >
                    {payer.toUpperCase()}
                  </div>

                  {policy ? (
                    <div
                      style={{
                        fontFamily: "var(--font-dm-mono), 'DM Mono', monospace",
                        fontSize: "9px",
                        color: "#A0AABB",
                        letterSpacing: "0.04em",
                      }}
                    >
                      {policy.policy_version} · {policy.effective_date}
                    </div>
                  ) : null}
                </th>
              );
            })}
          </tr>
        </thead>

        <tbody>
          {dataColumns.map((col) => {
            const values = payers.map((payer) => {
              const policy = drugPolicies.find((p) => p.payer_id === payer);
              return policy ? policy[col.key as keyof PolicyDocument] : null;
            });

            const cellState = getCellState(values);

            if (diffsOnly && cellState === "match") return null;

            return (
              <tr key={col.key} style={{ borderBottom: "0.5px solid #E8EBF2" }}>
                <td
                  style={{
                    padding: "12px 16px",
                    fontFamily: "var(--font-dm-mono), 'DM Mono', monospace",
                    fontSize: "10px",
                    fontWeight: 500,
                    color: "#6A7590",
                    letterSpacing: "0.05em",
                    background: "#FAFBFD",
                    verticalAlign: "top",
                  }}
                >
                  {col.label.toUpperCase()}
                </td>

                {payers.map((payer, index) => {
                  const policy = drugPolicies.find((p) => p.payer_id === payer);
                  const value = values[index];
                  const isChanged = policy?.changed_fields.includes(col.key) ?? false;
                  const bg = isChanged ? CELL_BG.changed : CELL_BG[cellState];

                  return (
                    <td
                      key={`${col.key}-${payer}`}
                      style={{
                        padding: "12px 16px",
                        background: bg,
                        borderLeft: "0.5px solid #E8EBF2",
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
  value: unknown;
  policy: PolicyDocument | undefined;
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
          fontFamily: "var(--font-dm-mono), 'DM Mono', monospace",
          fontSize: "10px",
          color: value ? "#D4880A" : "#0F7A40",
          letterSpacing: "0.05em",
        }}
      >
        {value ? "YES" : "NO"}
      </span>
    );
  }

  if (fieldKey === "changed_fields") {
    const changedFields = value as string[];

    if (!changedFields || changedFields.length === 0) {
      return (
        <span
          style={{
            fontFamily: "var(--font-dm-mono), 'DM Mono', monospace",
            fontSize: "10px",
            color: "#A0AABB",
            letterSpacing: "0.05em",
          }}
        >
          NO CHANGES
        </span>
      );
    }

    return (
      <div className="flex flex-wrap gap-1">
        {changedFields.map((item) => (
          <span
            key={item}
            style={{
              fontFamily: "var(--font-dm-mono), 'DM Mono', monospace",
              fontSize: "9px",
              color: "#D4880A",
              background: "#FFF7E8",
              borderWidth: "0.5px",
              borderStyle: "solid",
              borderColor: "#F1D8A8",
              borderRadius: "3px",
              padding: "1px 5px",
              letterSpacing: "0.04em",
            }}
          >
            {item}
          </span>
        ))}
      </div>
    );
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return <span style={{ color: "#D0D6E8", fontSize: "12px" }}>None</span>;
    }

    return (
      <div className="flex flex-wrap gap-1">
        {(value as string[]).map((item) => (
          <span
            key={item}
            style={{
              fontFamily: "var(--font-dm-mono), 'DM Mono', monospace",
              fontSize: "9px",
              color: "#6A7590",
              background: "#F7F8FC",
              borderWidth: "0.5px",
              borderStyle: "solid",
              borderColor: "#E8EBF2",
              borderRadius: "3px",
              padding: "1px 5px",
              letterSpacing: "0.04em",
            }}
          >
            {item}
          </span>
        ))}
      </div>
    );
  }

  if (typeof value === "string") {
    return (
      <span
        style={{
          fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
          fontSize: "12px",
          color: "#0D1C3A",
          display: "block",
          maxWidth: "190px",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: value.length > 70 ? "normal" : "nowrap",
          lineHeight: 1.55,
        }}
      >
        {value || "—"}
      </span>
    );
  }

  return (
    <span
      style={{
        fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
        fontSize: "12px",
        color: "#0D1C3A",
      }}
    >
      {String(value)}
    </span>
  );
}