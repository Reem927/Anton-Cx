"use client";

import { motion } from "framer-motion";
import { StatusPill } from "@/components/ui/StatusPill";
import { Skeleton } from "@/components/ui/Skeleton";
import type { PolicyDocument } from "@/lib/types";

interface CoverageTableProps {
  policies: PolicyDocument[];
  loading?: boolean;
}

export function CoverageTable({ policies, loading = false }: CoverageTableProps) {
  // Derive payer columns from actual ingested data
  const DISPLAY_PAYERS = Array.from(new Set(policies.map((p) => p.payer_id))).slice(0, 7);
  const drugs = Array.from(new Set(policies.map((p) => p.drug_name))).slice(0, 8);
  const policyMap = new Map(
    policies.map((p) => [`${p.drug_name.toLowerCase()}:${p.payer_id}`, p])
  );

  if (loading) {
    return (
      <div className="rounded-lg overflow-hidden" style={{ background: "#FFFFFF", borderWidth: "0.5px", borderStyle: "solid", borderColor: "#E8EBF2" }}>
        <div className="p-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex gap-4 mb-3">
              <Skeleton style={{ height: "20px", width: "120px" }} />
              {[...Array(4)].map((_, j) => (
                <Skeleton key={j} style={{ height: "20px", width: "72px" }} />
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (policies.length === 0) {
    return (
      <div
        className="rounded-lg"
        style={{
          background:  "#FFFFFF",
          borderWidth: "0.5px",
          borderStyle: "solid",
          borderColor: "#E8EBF2",
          padding:     "40px 16px",
          textAlign:   "center",
          fontFamily:  "var(--font-dm-sans), Lato, sans-serif",
          fontSize:    "13px",
          color:       "#9AA3BB",
        }}
      >
        No policies ingested yet. Go to Upload &amp; Extract to add your first policy.
      </div>
    );
  }

  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{
        background:  "#FFFFFF",
        borderWidth: "0.5px",
        borderStyle: "solid",
        borderColor: "#E8EBF2",
      }}
    >
      <table className="w-full border-collapse">
        <thead>
          <tr style={{ borderBottom: "0.5px solid #E8EBF2" }}>
            <th
              className="text-left"
              style={{
                padding:       "10px 16px",
                fontFamily:    "var(--font-dm-mono), Lato, sans-serif",
                fontSize:      "9px",
                fontWeight:    500,
                letterSpacing: "0.08em",
                color:         "#A0AABB",
                background:    "#F7F8FC",
              }}
            >
              DRUG
            </th>
            {DISPLAY_PAYERS.map((payer) => (
              <th
                key={payer}
                className="text-left"
                style={{
                  padding:       "10px 16px",
                  fontFamily:    "var(--font-dm-mono), Lato, sans-serif",
                  fontSize:      "9px",
                  fontWeight:    500,
                  letterSpacing: "0.08em",
                  color:         "#A0AABB",
                  background:    "#F7F8FC",
                }}
              >
                {payer.toUpperCase()}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {drugs.map((drug, i) => {
            return (
              <motion.tr
                key={drug}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay:     Math.min(i * 0.04, 0.2),
                  type:      "spring",
                  stiffness: 300,
                  damping:   30,
                }}
                style={{
                  borderBottom: "0.5px solid #E8EBF2",
                  cursor:       "default",
                }}
                className="hover:bg-[#F3F5FA] transition-colors"
              >
                <td
                  style={{
                    padding:    "10px 16px",
                    fontFamily: "var(--font-syne), Lato, sans-serif",
                    fontSize:   "13px",
                    fontWeight: 700,
                    color:      "#0D1C3A",
                  }}
                >
                  {drug}
                  {policies.find((p) => p.drug_name === drug)?.j_code && (
                    <div
                      style={{
                        fontFamily:    "var(--font-dm-mono), Lato, sans-serif",
                        fontSize:      "9px",
                        color:         "#A0AABB",
                        letterSpacing: "0.05em",
                        marginTop:     "2px",
                      }}
                    >
                      {policies.find((p) => p.drug_name === drug)?.j_code}
                    </div>
                  )}
                </td>
                {DISPLAY_PAYERS.map((payer) => {
                  const p = policyMap.get(`${drug.toLowerCase()}:${payer}`);
                  return (
                    <td key={payer} style={{ padding: "10px 16px" }}>
                      {p ? (
                        <div className="flex flex-col gap-1">
                          <StatusPill status={p.coverage_status} />
                          {p.changed_fields.length > 0 && (
                            <span
                              style={{
                                fontFamily:    "var(--font-dm-mono), Lato, sans-serif",
                                fontSize:      "8px",
                                color:         "#D4880A",
                                letterSpacing: "0.05em",
                              }}
                            >
                              CHANGED
                            </span>
                          )}
                        </div>
                      ) : (
                        <span style={{ color: "#D0D6E8", fontSize: "12px" }}>—</span>
                      )}
                    </td>
                  );
                })}
              </motion.tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
