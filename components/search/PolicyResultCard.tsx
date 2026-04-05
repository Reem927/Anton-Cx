"use client";

import { motion } from "framer-motion";
import { StatusPill } from "@/components/ui/StatusPill";
import type { PolicyDocument } from "@/lib/types";

interface PolicyResultCardProps {
  policy: PolicyDocument;
  index:  number;
}

export function PolicyResultCard({ policy, index }: PolicyResultCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay:     Math.min(index * 0.04, 0.2),
        type:      "spring",
        stiffness: 300,
        damping:   30,
      }}
      className="rounded-lg p-4 hover:bg-[#F3F5FA] transition-colors cursor-pointer"
      style={{
        background:  "#FFFFFF",
        borderWidth: "0.5px",
        borderStyle: "solid",
        borderColor: "#E8EBF2",
      }}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.97 }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Drug + J-code */}
          <div className="flex items-center gap-2 mb-1">
            <span
              style={{
                fontFamily: "var(--font-syne), Lato, sans-serif",
                fontSize:   "15px",
                fontWeight: 700,
                color:      "#0D1C3A",
              }}
            >
              {policy.drug_name}
            </span>
            <span
              style={{
                fontFamily:    "var(--font-dm-mono), Lato, sans-serif",
                fontSize:      "10px",
                color:         "#A0AABB",
                letterSpacing: "0.05em",
              }}
            >
              {policy.j_code}
            </span>
            {policy.changed_fields.length > 0 && (
              <span
                style={{
                  fontFamily:    "var(--font-dm-mono), Lato, sans-serif",
                  fontSize:      "8px",
                  color:         "#D4880A",
                  background:    "#FFF4E0",
                  borderWidth:   "0.5px",
                  borderStyle:   "solid",
                  borderColor:   "#F5D898",
                  borderRadius:  "3px",
                  padding:       "1px 5px",
                  letterSpacing: "0.05em",
                }}
              >
                CHANGED
              </span>
            )}
          </div>

          {/* Generic name + payer */}
          <div className="flex items-center gap-2 mb-3">
            <span
              style={{
                fontFamily: "var(--font-dm-sans), Lato, sans-serif",
                fontSize:   "12px",
                color:      "#6A7590",
              }}
            >
              {policy.drug_generic}
            </span>
            <span style={{ color: "#D0D6E8" }}>·</span>
            <span
              style={{
                fontFamily:    "var(--font-dm-mono), Lato, sans-serif",
                fontSize:      "10px",
                color:         "#6A7590",
                letterSpacing: "0.05em",
                textTransform: "uppercase",
              }}
            >
              {policy.payer_id}
            </span>
          </div>

          {/* Indications */}
          {policy.indications.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {policy.indications.slice(0, 5).map((ind) => (
                <span
                  key={ind}
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
                  {ind}
                </span>
              ))}
              {policy.indications.length > 5 && (
                <span
                  style={{
                    fontFamily: "var(--font-dm-sans), Lato, sans-serif",
                    fontSize:   "11px",
                    color:      "#A0AABB",
                  }}
                >
                  +{policy.indications.length - 5}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Right: status + meta */}
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          <StatusPill status={policy.coverage_status} />
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
          {policy.prior_auth_required && (
            <div
              style={{
                fontFamily:    "var(--font-dm-mono), Lato, sans-serif",
                fontSize:      "9px",
                color:         "#D4880A",
                letterSpacing: "0.04em",
              }}
            >
              PA REQUIRED
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
