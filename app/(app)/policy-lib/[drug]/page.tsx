"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { StatusPill, TierPill } from "@/components/ui/StatusPill";
import { PAYER_DISPLAY } from "@/components/library/utils";
import type { PolicyDocument } from "@/lib/types";

export default function PolicyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const drug = decodeURIComponent(params.drug as string);
  const payerFilter = searchParams.get("payer");

  const [policies, setPolicies] = useState<PolicyDocument[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/policies");
        if (!res.ok) throw new Error("fetch failed");
        const all: PolicyDocument[] = await res.json();
        let filtered = all.filter(
          (p) => p.drug_generic.toLowerCase() === drug.toLowerCase()
        );
        // If opened from a specific drug+payer card, show only that payer
        if (payerFilter) {
          filtered = filtered.filter(
            (p) => p.payer_id.toLowerCase() === payerFilter.toLowerCase()
          );
        }
        if (!cancelled) setPolicies(filtered);
      } catch {
        // empty
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [drug, payerFilter]);

  const drugName = policies[0]?.drug_name ?? drug;
  const drugGeneric = policies[0]?.drug_generic ?? drug;
  const jCode = policies[0]?.j_code ?? "";

  if (loading) {
    return (
      <div style={{ padding: "28px 32px", maxWidth: "1100px", margin: "0 auto" }}>
        <div style={{ fontFamily: "var(--font-dm-sans), Lato, sans-serif", fontSize: "13px", color: "#9AA3BB" }}>
          Loading policy…
        </div>
      </div>
    );
  }

  if (policies.length === 0) {
    return (
      <div style={{ padding: "28px 32px", maxWidth: "1100px", margin: "0 auto" }}>
        <button onClick={() => router.back()} style={backBtnStyle}>← Back to Library</button>
        <div style={{ fontFamily: "var(--font-dm-sans), Lato, sans-serif", fontSize: "13px", color: "#9AA3BB", marginTop: 20 }}>
          No policies found for this drug.
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "28px 32px", maxWidth: "1100px", margin: "0 auto" }}>
      {/* Back button */}
      <button onClick={() => router.push("/policy-lib")} style={backBtnStyle}>← Back to Library</button>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        style={{ marginTop: 16, marginBottom: 24 }}
      >
        <h1 style={{
          fontFamily: "var(--font-syne), Lato, sans-serif",
          fontSize: "26px", fontWeight: 900, color: "#1B3A6B", margin: "0 0 4px",
        }}>
          {drugName}
        </h1>
        <div style={{
          fontFamily: "var(--font-dm-mono), Lato, sans-serif",
          fontSize: "12px", color: "#9AA3BB",
          display: "flex", alignItems: "center", gap: 10,
        }}>
          <span>{drugGeneric}</span>
          {jCode && (
            <span style={{
              background: "#F0F2FA", borderRadius: 4, padding: "2px 6px",
              color: "#6B7BA4",
            }}>
              {jCode}
            </span>
          )}
          <span>{policies.length} {policies.length === 1 ? "payer" : "payers"}</span>
        </div>
      </motion.div>

      {/* Per-payer policy cards */}
      {policies.map((policy, i) => (
        <PayerPolicyCard key={policy.id} policy={policy} index={i} />
      ))}
    </div>
  );
}

function PayerPolicyCard({ policy, index }: { policy: PolicyDocument; index: number }) {
  const payerLabel = PAYER_DISPLAY[policy.payer_id]
    ?? policy.payer_id.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30, delay: Math.min(index * 0.04, 0.2) }}
      style={{
        background: "#FFFFFF",
        borderWidth: "0.5px", borderStyle: "solid", borderColor: "#E8EBF2",
        borderRadius: 10, marginBottom: 16, overflow: "hidden",
      }}
    >
      {/* Payer header */}
      <div style={{
        padding: "14px 20px",
        borderBottom: "0.5px solid #E8EBF2",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div>
          <div style={{
            fontFamily: "var(--font-dm-sans), Lato, sans-serif",
            fontSize: "15px", fontWeight: 700, color: "#1B3A6B",
          }}>
            {payerLabel}
          </div>
          <div style={{
            fontFamily: "var(--font-dm-mono), Lato, sans-serif",
            fontSize: "11px", color: "#9AA3BB", marginTop: 2,
          }}>
            v{policy.policy_version || "—"} · Effective {policy.effective_date}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <StatusPill status={policy.coverage_status} size="md" />
          <TierPill tier={policy.formulary_tier} size="md" />
        </div>
      </div>

      {/* Detail sections — same template as PDF */}
      <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 18 }}>
        {/* Coverage Details */}
        <DetailSection title="Coverage Details">
          <DetailRow label="Coverage Status" value={<StatusPill status={policy.coverage_status} size="md" />} />
          <DetailRow label="Prior Auth Required" value={policy.prior_auth_required ? "Yes" : "No"} />
          <DetailRow label="Step Therapy" value={policy.step_therapy ? "Yes" : "No"} />
          <DetailRow label="Formulary Tier" value={policy.formulary_tier?.replace(/_/g, " ") ?? "—"} />
          {policy.site_of_care && <DetailRow label="Site of Care" value={policy.site_of_care} />}
          {policy.quantity_limit && <DetailRow label="Quantity Limit" value={policy.quantity_limit} />}
        </DetailSection>

        {/* Prior Authorization */}
        {policy.prior_auth_required && (
          <DetailSection title="Prior Authorization">
            {policy.prior_auth_criteria ? (
              <p style={{
                fontFamily: "var(--font-dm-sans), Lato, sans-serif",
                fontSize: "13px", color: "#1B3A6B", lineHeight: 1.7, margin: 0,
              }}>
                {policy.prior_auth_criteria}
              </p>
            ) : (
              <DetailRow label="Required" value="Yes — no criteria details available" />
            )}
            {policy.renewal_period && <DetailRow label="Renewal Period" value={policy.renewal_period} />}
          </DetailSection>
        )}

        {/* Step Therapy */}
        {policy.step_therapy && policy.step_therapy_drugs?.length > 0 && (
          <DetailSection title="Step Therapy">
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {policy.step_therapy_drugs.map((d, i) => (
                <div key={d} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{
                    fontFamily: "var(--font-dm-mono), Lato, sans-serif",
                    fontSize: "10px", color: "#9AA3BB", width: 44,
                  }}>
                    Step {i + 1}
                  </span>
                  <span style={{
                    fontFamily: "var(--font-dm-mono), Lato, sans-serif",
                    fontSize: "11px", color: "#6B7BA4", background: "#F0F2FA",
                    borderRadius: 4, padding: "3px 8px",
                  }}>
                    {d}
                  </span>
                </div>
              ))}
            </div>
          </DetailSection>
        )}

        {/* Covered Indications */}
        {policy.indications?.length > 0 && (
          <DetailSection title="Covered Indications">
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {policy.indications.map((ind) => (
                <span key={ind} style={{
                  fontFamily: "var(--font-dm-sans), Lato, sans-serif",
                  fontSize: "12px", color: "#1B3A6B", background: "#EBF0FC",
                  border: "0.5px solid #C4D4F8", borderRadius: 4, padding: "3px 10px",
                }}>
                  {ind}
                </span>
              ))}
            </div>
          </DetailSection>
        )}

        {/* Clinical Criteria */}
        {policy.clinical_criteria && (
          <DetailSection title="Clinical Criteria">
            <p style={{
              fontFamily: "var(--font-dm-sans), Lato, sans-serif",
              fontSize: "13px", color: "#1B3A6B", lineHeight: 1.7, margin: 0,
            }}>
              {policy.clinical_criteria}
            </p>
          </DetailSection>
        )}
      </div>
    </motion.div>
  );
}

function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{
        fontFamily: "var(--font-dm-mono), Lato, sans-serif",
        fontSize: "10px", fontWeight: 700, letterSpacing: "0.08em",
        color: "#9AA3BB", textTransform: "uppercase", marginBottom: 8,
      }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "6px 0", borderBottom: "0.5px solid #F0F2FA",
    }}>
      <span style={{
        fontFamily: "var(--font-dm-sans), Lato, sans-serif",
        fontSize: "12px", fontWeight: 500, color: "#6A7590",
      }}>
        {label}
      </span>
      <span style={{
        fontFamily: "var(--font-dm-sans), Lato, sans-serif",
        fontSize: "12px", fontWeight: 600, color: "#1B3A6B",
      }}>
        {value}
      </span>
    </div>
  );
}

const backBtnStyle: React.CSSProperties = {
  fontFamily: "var(--font-dm-sans), Lato, sans-serif",
  fontSize: "13px",
  fontWeight: 500,
  color: "#6A7590",
  background: "none",
  border: "none",
  cursor: "pointer",
  padding: 0,
};
