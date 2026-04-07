"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { FieldDiff, ChangeTrackingResult, PolicyDocument } from "@/lib/types";
import { getChangeSeverityColor } from "@/lib/changeTracker";
import { cacheGet, cacheSet } from "@/lib/cache";

type OverallSeverity = "major" | "moderate" | "cosmetic";

interface PolicyChange {
  id:              string;
  drug_name:       string;
  drug_generic:    string;
  j_code:          string;
  payer_id:        string;
  payer_name:      string;
  drug_category:   string;
  plan_type:       string;
  detected_at:     string;
  effective_date:  string;
  policy_version:  string;
  prev_version:    string;
  source_pdf_url:  string | null;
  prev_pdf_url:    string | null;
  change_tracking: ChangeTrackingResult;
}

/** Convert raw policy_documents rows (with changed_fields) into PolicyChange objects */
function buildChangesFromPolicies(rows: PolicyDocument[]): PolicyChange[] {
  return rows
    .filter(r => r.changed_fields && r.changed_fields.length > 0)
    .map(r => {
      const fieldDiffs: FieldDiff[] = r.changed_fields.map(fieldName => ({
        field_name:         fieldName.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()),
        field_path:         fieldName,
        old_value:          "—",
        new_value:          (r as unknown as Record<string, unknown>)[fieldName] ?? "Updated",
        severity:           (fieldName === "coverage_status" || fieldName === "prior_auth_required") ? "major" as const
                          : fieldName === "indications" ? "moderate" as const
                          : "cosmetic" as const,
        clinical_impact:    ["coverage_status", "prior_auth_required", "prior_auth_criteria", "step_therapy", "indications"].includes(fieldName),
        impact_explanation: `${fieldName.replace(/_/g, " ")} was updated.`,
        change_type:        "modified" as const,
      }));

      const majorCount    = fieldDiffs.filter(d => d.severity === "major").length;
      const moderateCount = fieldDiffs.filter(d => d.severity === "moderate").length;
      const cosmeticCount = fieldDiffs.filter(d => d.severity === "cosmetic").length;
      const overall: OverallSeverity = majorCount > 0 ? "major" : moderateCount > 0 ? "moderate" : "cosmetic";

      return {
        id:              r.id,
        drug_name:       r.drug_name,
        drug_generic:    r.drug_generic,
        j_code:          r.j_code,
        payer_id:        r.payer_id,
        payer_name:      r.payer_id.toUpperCase().replace(/-/g, " "),
        drug_category:   "Medical Benefit",
        plan_type:       "commercial",
        detected_at:     r.extracted_at,
        effective_date:  r.effective_date,
        policy_version:  r.policy_version,
        prev_version:    "prev",
        source_pdf_url:  r.source_pdf_url,
        prev_pdf_url:    null,
        change_tracking: {
          change_severity_overall: overall,
          change_summary:          `${r.changed_fields.length} field${r.changed_fields.length > 1 ? "s" : ""} changed: ${r.changed_fields.join(", ")}.`,
          total_changes:           fieldDiffs.length,
          major_changes:           majorCount,
          moderate_changes:        moderateCount,
          cosmetic_changes:        cosmeticCount,
          changed_fields:          fieldDiffs,
        },
      };
    });
}

function useChanges() {
  const [changes, setChanges] = useState<PolicyChange[]>(() => {
    const cached = cacheGet<PolicyChange[]>("changes:list");
    return cached ?? [];
  });
  const [loading, setLoading] = useState(!cacheGet<PolicyChange[]>("changes:list"));

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/changes");
        if (!res.ok) throw new Error("fetch failed");
        const rows: PolicyDocument[] = await res.json();
        if (cancelled) return;
        const built = buildChangesFromPolicies(rows);
        setChanges(built);
        cacheSet("changes:list", built);
      } catch {
        // Keep cached/empty state
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return { changes, loading };
}

const SPRING = { type: "spring" as const, stiffness: 300, damping: 30 };
const stagger = (i: number) => Math.min(i * 0.04, 0.2);

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  return `${days}d ago`;
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function fmtVal(v: unknown): string {
  if (v === null || v === undefined || v === "") return "—";
  if (Array.isArray(v)) return v.join(", ");
  if (typeof v === "boolean") return v ? "Yes" : "No";
  return String(v);
}

function shortLabel(diff: FieldDiff): string {
  const old = fmtVal(diff.old_value);
  const nxt = fmtVal(diff.new_value);
  const trimOld = old.length > 22 ? old.slice(0, 20) + "…" : old;
  const trimNew = nxt.length > 22 ? nxt.slice(0, 20) + "…" : nxt;
  return `${trimOld} → ${trimNew}`;
}

function SevBadge({ sev }: { sev: OverallSeverity }) {
  const c = getChangeSeverityColor(sev);
  return (
    <span style={{ fontFamily: "var(--font-dm-mono),'DM Mono',monospace", fontSize: "9px", fontWeight: 500, letterSpacing: "0.08em", padding: "2px 7px", borderRadius: "4px", background: c.bg, color: c.text, borderWidth: "0.5px", borderStyle: "solid", borderColor: c.border, whiteSpace: "nowrap" as const }}>
      {c.label}
    </span>
  );
}

function ChangeCountBubbles({ ct }: { ct: ChangeTrackingResult }) {
  return (
    <div style={{ display: "flex", gap: 6 }}>
      {ct.major_changes > 0    && <span style={{ fontFamily: "var(--font-dm-mono),'DM Mono',monospace", fontSize: "9px", color: "#B02020", background: "#FEE8E8", padding: "1px 6px", borderRadius: "3px", borderWidth: "0.5px", borderStyle: "solid", borderColor: "#F5C0C0" }}>{ct.major_changes} major</span>}
      {ct.moderate_changes > 0 && <span style={{ fontFamily: "var(--font-dm-mono),'DM Mono',monospace", fontSize: "9px", color: "#D4880A", background: "#FFF4E0", padding: "1px 6px", borderRadius: "3px", borderWidth: "0.5px", borderStyle: "solid", borderColor: "#F5D898" }}>{ct.moderate_changes} moderate</span>}
      {ct.cosmetic_changes > 0 && <span style={{ fontFamily: "var(--font-dm-mono),'DM Mono',monospace", fontSize: "9px", color: "#6A7590", background: "#F7F8FC", padding: "1px 6px", borderRadius: "3px", borderWidth: "0.5px", borderStyle: "solid", borderColor: "#E8EBF2" }}>{ct.cosmetic_changes} cosmetic</span>}
    </div>
  );
}

function SplitDiffPanel({ chg }: { chg: PolicyChange }) {
  const ct = chg.change_tracking;
  const changed = ct.changed_fields;

  function clip(v: unknown): string {
    const s = fmtVal(v);
    return s.length > 32 ? s.slice(0, 30) + "…" : s;
  }

  const innerCard = (side: "before" | "after", version: string) => {
    const isBefore = side === "before";
    return (
      <div style={{ flex: 1, background: isBefore ? "#FAFBFC" : "#F6FCFA", borderRadius: "10px", borderWidth: "0.5px", borderStyle: "solid", borderColor: isBefore ? "#E0E4EE" : "#C4E8D8", overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderBottom: isBefore ? "0.5px solid #E8EBF2" : "0.5px solid #C4E8D8", background: isBefore ? "#F2F4F8" : "#EAF7F2" }}>
          <div style={{ width: 7, height: 7, borderRadius: "50%", background: isBefore ? "#A0AABB" : "#2DB07A" }} />
          <span style={{ fontFamily: "var(--font-dm-mono),'DM Mono',monospace", fontSize: "9px", fontWeight: 600, letterSpacing: "0.1em", color: isBefore ? "#6A7590" : "#1A7A52" }}>
            {isBefore ? `BEFORE · ${version}` : `AFTER · ${version}`}
          </span>
        </div>
        <div style={{ padding: "10px 14px", display: "flex", flexDirection: "column" as const }}>
          {changed.map((diff, i) => {
            const val     = isBefore ? diff.old_value : diff.new_value;
            const sevColor = getChangeSeverityColor(diff.severity);
            const isChanged = true;

            return (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "100px 1fr", gap: 10, padding: "7px 0", borderBottom: i < changed.length - 1 ? "0.5px solid #F0F2F6" : "none", alignItems: "start" }}>
                <span style={{ fontFamily: "var(--font-dm-mono),'DM Mono',monospace", fontSize: "9px", color: "#A0AABB", letterSpacing: "0.04em", paddingTop: 2 }}>
                  {diff.field_name}
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" as const }}>
                  <span style={{ fontFamily: "var(--font-dm-sans),'DM Sans',sans-serif", fontSize: "12px", fontWeight: !isBefore && isChanged ? 600 : 400, color: isBefore ? (isChanged ? "#A0AABB" : "#6A7590") : (isChanged ? "#0D1C3A" : "#6A7590"), textDecoration: isBefore && isChanged ? "line-through" : "none", textDecorationColor: "#C0C8D8", lineHeight: 1.4 }}>
                    {clip(val)}
                  </span>
                  {!isBefore && isChanged && (
                    <span style={{ fontFamily: "var(--font-dm-mono),'DM Mono',monospace", fontSize: "8px", fontWeight: 500, letterSpacing: "0.06em", padding: "1px 5px", borderRadius: "3px", background: sevColor.bg, color: sevColor.text, borderWidth: "0.5px", borderStyle: "solid", borderColor: sevColor.border, whiteSpace: "nowrap" as const, flexShrink: 0 }}>
                      {diff.severity}
                    </span>
                  )}
                  {!isBefore && diff.clinical_impact && isChanged && (
                    <span style={{ fontFamily: "var(--font-dm-mono),'DM Mono',monospace", fontSize: "8px", color: "#2E6BE6", fontWeight: 600, flexShrink: 0 }}>✦</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.22, ease: "easeInOut" }} style={{ overflow: "hidden" }}>
      <div style={{ marginTop: 16, paddingTop: 16, borderTop: "0.5px solid #ECEEF4" }}>
        <div style={{ display: "flex", gap: 12, marginBottom: 14 }}>
          {innerCard("before", chg.prev_version)}
          {innerCard("after",  chg.policy_version)}
        </div>
        <div style={{ background: "#F7F8FC", borderRadius: "8px", padding: "10px 14px", marginBottom: 14, borderWidth: "0.5px", borderStyle: "solid", borderColor: "#E8EBF2" }}>
          <span style={{ fontFamily: "var(--font-dm-mono),'DM Mono',monospace", fontSize: "8px", color: "#A0AABB", letterSpacing: "0.1em", marginRight: 10 }}>SUMMARY</span>
          <span style={{ fontFamily: "var(--font-dm-sans),'DM Sans',sans-serif", fontSize: "12px", color: "#6A7590", lineHeight: 1.6 }}>
            {ct.change_summary}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontFamily: "var(--font-dm-mono),'DM Mono',monospace", fontSize: "9px", color: "#A0AABB", letterSpacing: "0.04em" }}>
            Effective {fmtDate(chg.effective_date)}
          </span>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {chg.source_pdf_url && (
              <button style={{ fontFamily: "var(--font-dm-sans),'DM Sans',sans-serif", fontSize: "12px", fontWeight: 600, color: "#FFFFFF", background: "#2E6BE6", border: "none", borderRadius: "6px", padding: "6px 14px", cursor: "pointer" }}>↓ New PDF</button>
            )}
            {chg.prev_pdf_url && (
              <button style={{ fontFamily: "var(--font-dm-sans),'DM Sans',sans-serif", fontSize: "12px", fontWeight: 500, color: "#6A7590", background: "#FFFFFF", borderWidth: "0.5px", borderStyle: "solid", borderColor: "#E8EBF2", borderRadius: "6px", padding: "6px 14px", cursor: "pointer" }}>↓ Old PDF</button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function ChangeTrackerPage() {
  const { changes, loading: changesLoading } = useChanges();
  const [expanded, setExpanded]       = useState<string | null>(null);
  const [filterSev, setFilterSev]     = useState<OverallSeverity | "all">("all");
  const [filterPayer, setFilterPayer] = useState("all");
  const [search, setSearch]           = useState("");

  const payers = ["all", ...Array.from(new Set(changes.map(c => c.payer_id)))];

  const filtered = useMemo(() => changes.filter(c => {
    if (filterSev !== "all" && c.change_tracking.change_severity_overall !== filterSev) return false;
    if (filterPayer !== "all" && c.payer_id !== filterPayer) return false;
    if (search) {
      const q = search.toLowerCase();
      return c.drug_name.toLowerCase().includes(q) || c.payer_name.toLowerCase().includes(q) || c.drug_category.toLowerCase().includes(q);
    }
    return true;
  }), [changes, filterSev, filterPayer, search]);

  const counts = {
    major:    changes.filter(c => c.change_tracking.change_severity_overall === "major").length,
    moderate: changes.filter(c => c.change_tracking.change_severity_overall === "moderate").length,
    cosmetic: changes.filter(c => c.change_tracking.change_severity_overall === "cosmetic").length,
  };

  return (
    <div className="p-6">
      <div className="mb-6" style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-syne),Syne,sans-serif", fontSize: "22px", fontWeight: 800, color: "#0D1C3A", marginBottom: 4 }}>
            Change Tracker
          </h1>
          <p style={{ fontFamily: "var(--font-dm-sans),'DM Sans',sans-serif", fontSize: "13px", color: "#6A7590" }}>
            Monitoring policy updates across 48+ payers in real time.
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {(["major", "moderate", "cosmetic"] as const).map(sev => {
            const c = getChangeSeverityColor(sev);
            const active = filterSev === sev;
            return (
              <div key={sev} onClick={() => setFilterSev(active ? "all" : sev)}
                style={{ background: active ? c.bg : "#FFFFFF", borderWidth: "0.5px", borderStyle: "solid", borderColor: active ? c.border : "#E8EBF2", borderRadius: "8px", padding: "8px 16px", textAlign: "center" as const, cursor: "pointer", transition: "all 0.15s" }}>
                <div style={{ fontFamily: "var(--font-syne),Syne,sans-serif", fontSize: "20px", fontWeight: 800, color: c.dot, lineHeight: 1 }}>{counts[sev]}</div>
                <div style={{ fontFamily: "var(--font-dm-mono),'DM Mono',monospace", fontSize: "9px", color: active ? c.text : "#A0AABB", letterSpacing: "0.06em", marginTop: 4 }}>{sev.toUpperCase()}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mb-5" style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" as const }}>
        <div style={{ position: "relative" as const }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }}>
            <circle cx="6" cy="6" r="4" stroke="#A0AABB" strokeWidth="1.25" />
            <path d="M9.5 9.5L12 12" stroke="#A0AABB" strokeWidth="1.25" strokeLinecap="round" />
          </svg>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search drug, payer, category…"
            style={{ paddingLeft: 32, paddingRight: 12, paddingTop: 7, paddingBottom: 7, width: 240, fontFamily: "var(--font-dm-sans),'DM Sans',sans-serif", fontSize: "13px", color: "#0D1C3A", background: "#FFFFFF", borderWidth: "0.5px", borderStyle: "solid", borderColor: "#E8EBF2", borderRadius: "7px", outline: "none" }} />
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          {([["all", "All"], ["major", "Major"], ["moderate", "Moderate"], ["cosmetic", "Cosmetic"]] as const).map(([val, label]) => {
            const active = filterSev === val;
            const c = val !== "all" ? getChangeSeverityColor(val as OverallSeverity) : null;
            return (
              <button key={val} onClick={() => setFilterSev(val as OverallSeverity | "all")}
                style={{ fontFamily: "var(--font-dm-mono),'DM Mono',monospace", fontSize: "10px", fontWeight: 500, letterSpacing: "0.05em", padding: "5px 12px", borderRadius: "6px", border: "none", cursor: "pointer", background: active ? (c ? c.bg : "#EBF0FC") : "#FFFFFF", color: active ? (c ? c.text : "#1B3A6B") : "#6A7590", borderWidth: "0.5px", borderStyle: "solid", borderColor: active ? (c ? c.border : "#C4D4F8") : "#E8EBF2", transition: "all 0.15s" }}>
                {label}
              </button>
            );
          })}
        </div>
        <select value={filterPayer} onChange={e => setFilterPayer(e.target.value)}
          style={{ fontFamily: "var(--font-dm-sans),'DM Sans',sans-serif", fontSize: "13px", color: "#6A7590", background: "#FFFFFF", borderWidth: "0.5px", borderStyle: "solid", borderColor: "#E8EBF2", borderRadius: "7px", padding: "6px 12px", outline: "none" }}>
          {payers.map(p => <option key={p} value={p}>{p === "all" ? "All Payers" : p.toUpperCase()}</option>)}
        </select>
        <div style={{ flex: 1 }} />
        <span style={{ fontFamily: "var(--font-dm-mono),'DM Mono',monospace", fontSize: "10px", color: "#A0AABB", letterSpacing: "0.05em" }}>
          {filtered.length} {filtered.length === 1 ? "CHANGE" : "CHANGES"}
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column" as const, maxWidth: 860 }}>
        {changesLoading && filtered.length === 0 && (
          <div style={{ padding: "48px 0", textAlign: "center" as const, fontFamily: "var(--font-dm-sans),'DM Sans',sans-serif", fontSize: "14px", color: "#A0AABB" }}>
            Loading changes…
          </div>
        )}
        {!changesLoading && filtered.length === 0 && (
          <div style={{ padding: "48px 0", textAlign: "center" as const, fontFamily: "var(--font-dm-sans),'DM Sans',sans-serif", fontSize: "14px", color: "#A0AABB" }}>
            No changes match your filters.
          </div>
        )}

        {filtered.map((chg, i) => {
          const isOpen = expanded === chg.id;
          const ct = chg.change_tracking;
          const sevColor = getChangeSeverityColor(ct.change_severity_overall);

          return (
            <motion.div key={chg.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              transition={{ ...SPRING, delay: stagger(i) }}
              style={{ position: "relative" as const, paddingLeft: 28, marginBottom: 12 }}>
              {i < filtered.length - 1 && (
                <div style={{ position: "absolute", left: 6, top: 28, bottom: -12, width: "1.5px", background: `linear-gradient(${sevColor.dot}60, #E8EBF2)` }} />
              )}
              <div style={{ position: "absolute", left: 0, top: 20, width: 14, height: 14, borderRadius: "50%", background: sevColor.dot, border: "2px solid #F7F8FC", boxShadow: `0 0 0 3px ${sevColor.bg}` }} />

              <div style={{ background: "#FFFFFF", borderWidth: "0.5px", borderStyle: "solid", borderColor: isOpen ? sevColor.border : "#E8EBF2", borderRadius: "10px", padding: "16px 20px", transition: "border-color 0.15s", boxShadow: isOpen ? `0 2px 12px ${sevColor.bg}` : "none" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <SevBadge sev={ct.change_severity_overall} />
                  <span style={{ fontFamily: "var(--font-dm-mono),'DM Mono',monospace", fontSize: "9px", color: "#A0AABB" }}>{timeAgo(chg.detected_at)}</span>
                  <div style={{ flex: 1 }} />
                  <span style={{ fontFamily: "var(--font-dm-mono),'DM Mono',monospace", fontSize: "9px", color: "#2E6BE6", background: "#EBF0FC", padding: "2px 7px", borderRadius: "4px", borderWidth: "0.5px", borderStyle: "solid", borderColor: "#C4D4F8" }}>{chg.payer_name}</span>
                  <span style={{ fontFamily: "var(--font-dm-mono),'DM Mono',monospace", fontSize: "9px", color: "#A0AABB" }}>{chg.plan_type}</span>
                </div>

                <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 6 }}>
                  <span style={{ fontFamily: "var(--font-syne),Syne,sans-serif", fontSize: "16px", fontWeight: 700, color: "#0D1C3A" }}>{chg.drug_name}</span>
                  <span style={{ fontFamily: "var(--font-dm-mono),'DM Mono',monospace", fontSize: "9px", color: "#A0AABB", letterSpacing: "0.05em" }}>{chg.j_code}</span>
                  <span style={{ fontFamily: "var(--font-dm-mono),'DM Mono',monospace", fontSize: "9px", color: "#6A7590" }}>{chg.drug_category}</span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, flexWrap: "wrap" as const }}>
                  <span style={{ fontFamily: "var(--font-dm-mono),'DM Mono',monospace", fontSize: "9px", color: "#A0AABB" }}>{chg.prev_version} → {chg.policy_version}</span>
                  <span style={{ color: "#D0D6E8" }}>·</span>
                  <ChangeCountBubbles ct={ct} />
                </div>

                {!isOpen && (
                  <div style={{ display: "flex", flexDirection: "column" as const, gap: 4, marginBottom: 12 }}>
                    {ct.changed_fields.map((diff, j) => {
                      const dot = { major: "#B02020", moderate: "#D4880A", cosmetic: "#A0AABB" }[diff.severity];
                      return (
                        <div key={j} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ width: 5, height: 5, borderRadius: "50%", background: dot, flexShrink: 0 }} />
                          <span style={{ fontFamily: "var(--font-dm-sans),'DM Sans',sans-serif", fontSize: "12px", color: "#6A7590" }}>
                            <span style={{ color: "#A0AABB", fontFamily: "var(--font-dm-mono),'DM Mono',monospace", fontSize: "9px", marginRight: 6 }}>{diff.field_name}</span>
                            {shortLabel(diff)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div style={{ display: "flex", alignItems: "center", paddingTop: 10, borderTop: "0.5px solid #F3F5FA" }}>
                  {!isOpen && (
                    <span style={{ fontFamily: "var(--font-dm-mono),'DM Mono',monospace", fontSize: "9px", color: "#A0AABB" }}>
                      Effective {fmtDate(chg.effective_date)}
                    </span>
                  )}
                  <div style={{ flex: 1 }} />
                  <button onClick={() => setExpanded(isOpen ? null : chg.id)}
                    style={{ fontFamily: "var(--font-dm-mono),'DM Mono',monospace", fontSize: "9px", fontWeight: 600, color: "#2E6BE6", background: "none", border: "none", cursor: "pointer", letterSpacing: "0.04em", padding: 0 }}>
                    {isOpen ? "▲ Collapse" : "▼ View changes"}
                  </button>
                </div>

                <AnimatePresence>
                  {isOpen && <SplitDiffPanel key={chg.id} chg={chg} />}
                </AnimatePresence>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
