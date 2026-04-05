"use client";

import { useState, useEffect, useRef } from "react";

const PAYERS = ["UnitedHealthcare", "Cigna", "BCBS NC", "UPMC", "Priority Health", "EmblemHealth", "Florida Blue"];

const EXAMPLE_QUESTIONS = [
  "Does Cigna cover Keytruda for lung cancer?",
  "What step therapy does UHC require for Humira?",
  "Which plans require biosimilar trial before Rituximab?",
  "What are the PA criteria for Opdivo at BCBS NC?",
  "How does UPMC handle bevacizumab site of care?",
];

const MOCK_RESULTS = {
  default: {
    answer: `Yes — Cigna covers Keytruda (pembrolizumab) under their commercial medical benefit for non-small cell lung cancer. Coverage requires PD-L1 expression ≥1% confirmed by pathology report, ECOG performance status 0–2, and prior authorization. No step therapy is required for first-line treatment. Site of care is restricted to physician office or ambulatory infusion center.`,
    source: "Cigna Drug Policy — Pembrolizumab (Jan 2025), p.3",
    sourceUrl: "#",
    coverageStates: [
      { payer: "UHC", status: "covered", tier: "Preferred Specialty", badge: "PA Required" },
      { payer: "Cigna", status: "covered", tier: "Non-Preferred", badge: "PA Required" },
      { payer: "BCBS NC", status: "not_covered", tier: null, badge: "See alternatives" },
      { payer: "UPMC", status: "pharmacy_only", tier: null, badge: "Pharmacy version exists" },
      { payer: "Priority Health", status: "covered", tier: "Preferred Specialty", badge: "PA Required" },
    ],
    followUps: [
      "What step therapy does UHC require for Keytruda?",
      "Compare Keytruda coverage across all payers",
      "What changed in Keytruda policies last quarter?",
    ],
    policies: [
      { payer: "Cigna", drug: "Pembrolizumab (Keytruda)", drug_generic: "pembrolizumab", date: "Jan 2025", type: "Medical Benefit", pages: 12, id: null },
      { payer: "UnitedHealthcare", drug: "Pembrolizumab (Keytruda)", drug_generic: "pembrolizumab", date: "Dec 2024", type: "Medical Benefit", pages: 9, id: null },
      { payer: "Priority Health", drug: "Oncology Drug List", drug_generic: "pembrolizumab", date: "2026", type: "Medical Benefit", pages: 47, id: null },
    ],
  },
};

const statusConfig = {
  covered: { bg: "#E8F5E9", border: "#43A047", text: "#2E7D32", label: "Covered" },
  not_covered: { bg: "#FFEBEE", border: "#E53935", text: "#B71C1C", label: "Not Covered" },
  pharmacy_only: { bg: "#FFF8E1", border: "#FB8C00", text: "#E65100", label: "Pharmacy Only" },
  no_policy: { bg: "#F5F5F5", border: "#9E9E9E", text: "#424242", label: "No Policy Found" },
};

function CoverageCard({ payer, status, tier, badge }: { payer: string; status: string; tier: string | null; badge: string | null }) {
  const cfg = statusConfig[status as keyof typeof statusConfig] || statusConfig.no_policy;
  return (
    <div style={{
      background: cfg.bg,
      border: `1px solid ${cfg.border}`,
      borderRadius: 10,
      padding: "12px 14px",
      minWidth: 140,
      flex: "1 1 140px",
    }}>
      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#6A7590", letterSpacing: "0.05em", marginBottom: 4 }}>
        {payer}
      </div>
      <div style={{ fontWeight: 600, fontSize: 13, color: cfg.text, marginBottom: 4 }}>{cfg.label}</div>
      {tier && <div style={{ fontSize: 11, color: cfg.text, opacity: 0.8, marginBottom: 4 }}>{tier}</div>}
      {badge && (
        <div style={{
          display: "inline-block",
          background: "rgba(0,0,0,0.08)",
          borderRadius: 4,
          padding: "2px 6px",
          fontSize: 10,
          color: cfg.text,
          fontFamily: "'DM Mono', monospace",
        }}>{badge}</div>
      )}
    </div>
  );
}

function TypingText({ text, onDone }: { text: string; onDone?: () => void }) {
  const [displayed, setDisplayed] = useState("");
  const stateRef = useRef({ idx: 0, done: false, interval: 0 });

  useEffect(() => {
    stateRef.current.idx = 0;
    stateRef.current.done = false;
    clearInterval(stateRef.current.interval);
    setDisplayed("");

    stateRef.current.interval = window.setInterval(() => {
      stateRef.current.idx++;
      const next = text.slice(0, stateRef.current.idx);
      setDisplayed(next);
      if (stateRef.current.idx >= text.length) {
        clearInterval(stateRef.current.interval);
        stateRef.current.done = true;
        onDone && onDone();
      }
    }, 8);

    return () => clearInterval(stateRef.current.interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  return <span>{displayed}</span>;
}

async function downloadPolicyPdf(drugGeneric: string, drugName: string, policyId: string | null) {
  const params = policyId
    ? `policy_id=${encodeURIComponent(policyId)}`
    : `drug=${encodeURIComponent(drugGeneric)}`;
  const res = await fetch(`/api/generate-pdf?${params}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Download failed" }));
    throw new Error(err.error ?? "Download failed");
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${drugName.replace(/\s+/g, "-")}-policy-report.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

interface PolicyData {
  payer: string;
  drug: string;
  drug_generic: string;
  date: string;
  type: string;
  pages: number;
  id: string | null;
}

function PolicySourceCard({ pol }: { pol: PolicyData }) {
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (state === "loading") return;
    setState("loading");
    try {
      await downloadPolicyPdf(pol.drug_generic, pol.drug, pol.id);
      setState("idle");
    } catch {
      setState("error");
      setTimeout(() => setState("idle"), 3000);
    }
  };

  return (
    <div
      style={{
        background: "#FFFFFF",
        border: `0.5px solid ${state === "error" ? "#E53935" : "#E8EBF2"}`,
        borderRadius: 10,
        padding: "14px 16px",
        marginBottom: 8,
        display: "flex",
        alignItems: "center",
        gap: 14,
        cursor: "pointer",
        transition: "border-color 0.15s",
      }}
      onMouseEnter={e => { if (state !== "error") e.currentTarget.style.borderColor = "#2E6BE6"; }}
      onMouseLeave={e => { if (state !== "error") e.currentTarget.style.borderColor = "#E8EBF2"; }}
    >
      <div style={{
        width: 36, height: 36, borderRadius: 8,
        background: "#EBF0FC",
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
      }}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <rect x="2" y="1" width="10" height="13" rx="2" stroke="#2E6BE6" strokeWidth="1"/>
          <path d="M5 5h5M5 8h5M5 11h3" stroke="#2E6BE6" strokeWidth="0.8" strokeLinecap="round"/>
        </svg>
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 500, color: "#0D1C3A", marginBottom: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {pol.drug}
        </div>
        <div style={{ fontSize: 12, color: "#6A7590", fontFamily: "'DM Mono', monospace" }}>
          {pol.payer} · {pol.type} · {pol.date} · {pol.pages}p
        </div>
      </div>

      <button
        onClick={handleDownload}
        disabled={state === "loading"}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 5,
          background: state === "error" ? "#FFEBEE" : state === "loading" ? "#EBF0FC" : "#F7F8FC",
          border: `0.5px solid ${state === "error" ? "#E53935" : state === "loading" ? "#2E6BE6" : "#E8EBF2"}`,
          borderRadius: 6,
          padding: "5px 12px",
          fontSize: 11,
          color: state === "error" ? "#B71C1C" : state === "loading" ? "#2E6BE6" : "#6A7590",
          fontFamily: "'DM Mono', monospace",
          cursor: state === "loading" ? "not-allowed" : "pointer",
          flexShrink: 0,
          transition: "all 0.15s",
          whiteSpace: "nowrap",
        }}
        onMouseEnter={e => { if (state === "idle") { e.currentTarget.style.background = "#EBF0FC"; e.currentTarget.style.color = "#2E6BE6"; e.currentTarget.style.borderColor = "#2E6BE6"; }}}
        onMouseLeave={e => { if (state === "idle") { e.currentTarget.style.background = "#F7F8FC"; e.currentTarget.style.color = "#6A7590"; e.currentTarget.style.borderColor = "#E8EBF2"; }}}
      >
        {state === "loading" ? (
          <>
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none" style={{ animation: "spin 1s linear infinite" }}>
              <circle cx="5.5" cy="5.5" r="4" stroke="#2E6BE6" strokeWidth="1.5" strokeDasharray="12 4"/>
            </svg>
            Generating…
          </>
        ) : state === "error" ? (
          <>
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
              <circle cx="5.5" cy="5.5" r="4.5" stroke="#E53935" strokeWidth="1"/>
              <path d="M5.5 3v3M5.5 8v.5" stroke="#E53935" strokeWidth="1" strokeLinecap="round"/>
            </svg>
            Failed
          </>
        ) : (
          <>
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
              <path d="M5.5 1v6M2.5 5l3 3 3-3" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M1 9h9" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
            </svg>
            PDF
          </>
        )}
      </button>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function AnswerBlock({ result, onFollowUp }: { result: typeof MOCK_RESULTS.default; onFollowUp: (q: string) => void }) {
  const [done, setDone] = useState(false);
  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <div style={{ background: "#EBF0FC", border: "0.5px solid #2E6BE6", borderRadius: 6, padding: "3px 10px", fontSize: 11, fontFamily: "'DM Mono', monospace", color: "#2E6BE6", fontWeight: 500 }}>AI Answer</div>
          <div style={{ background: "#F7F8FC", border: "0.5px solid #E8EBF2", borderRadius: 6, padding: "3px 10px", fontSize: 11, fontFamily: "'DM Mono', monospace", color: "#A0AABB" }}>Medical Benefit · Oncology</div>
        </div>
        <p style={{ fontSize: 15, lineHeight: 1.75, color: "#0D1C3A", margin: "0 0 14px" }}>
          <TypingText text={result.answer} onDone={() => setDone(true)} />
        </p>
        {done && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#6A7590", fontFamily: "'DM Mono', monospace" }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <rect x="1" y="1" width="12" height="12" rx="3" stroke="#A0AABB" strokeWidth="0.8"/>
              <path d="M4 7l2 2 4-4" stroke="#2E6BE6" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <a href={result.sourceUrl} style={{ color: "#2E6BE6", textDecoration: "none" }}>{result.source}</a>
          </div>
        )}
      </div>

      {done && (
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 12, fontFamily: "'DM Mono', monospace", color: "#A0AABB", marginBottom: 10, letterSpacing: "0.05em" }}>COVERAGE ACROSS PAYERS</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {result.coverageStates.map(c => <CoverageCard key={c.payer} {...c} />)}
          </div>
        </div>
      )}

      {done && (
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 12, fontFamily: "'DM Mono', monospace", color: "#A0AABB", marginBottom: 10, letterSpacing: "0.05em" }}>SUGGESTED FOLLOW-UPS</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {result.followUps.map(q => (
              <button key={q} onClick={() => onFollowUp(q)} style={{ background: "#F7F8FC", border: "0.5px solid #E8EBF2", borderRadius: 20, padding: "7px 14px", fontSize: 12, color: "#2E6BE6", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
                {q} →
              </button>
            ))}
          </div>
        </div>
      )}

      {done && <div style={{ borderTop: "0.5px solid #E8EBF2", margin: "8px 0 24px" }} />}

      {done && (
        <div>
          <div style={{ fontSize: 12, fontFamily: "'DM Mono', monospace", color: "#A0AABB", marginBottom: 14, letterSpacing: "0.05em" }}>
            SOURCE POLICIES — {result.policies.length} DOCUMENTS
          </div>
          {result.policies.map((pol, i) => (
            <PolicySourceCard key={i} pol={pol} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function PolicySearch() {
  const [query, setQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const result = MOCK_RESULTS.default;

  const toggleFilter = (payer: string) => {
    setActiveFilters(prev =>
      prev.includes(payer) ? prev.filter(p => p !== payer) : [...prev, payer]
    );
  };

  const handleSearch = (q?: string) => {
    const text = q || query;
    if (!text.trim()) return;
    setQuery(text);
    setSearched(false);
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSearched(true);
    }, 1200);
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  return (
    <div style={{
      fontFamily: "var(--font-dm-sans), Lato, sans-serif",
      background: "#F7F8FC",
      minHeight: "100%",
      padding: "0 0 60px",
    }}>

      <div style={{
        background: "#FFFFFF",
        borderBottom: "0.5px solid #E8EBF2",
        padding: searched ? "24px 32px 20px" : "72px 32px 64px",
        transition: "padding 0.4s ease",
      }}>
        {!searched && (
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <div style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: 13,
              letterSpacing: "0.12em",
              color: "#2E6BE6",
              textTransform: "uppercase",
              marginBottom: 12,
              fontWeight: 600,
            }}>Policy Intelligence</div>
            <h1 style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: 36,
              fontWeight: 700,
              color: "#0D1C3A",
              margin: "0 0 10px",
              letterSpacing: "-0.02em",
            }}>Ask anything about drug coverage</h1>
            <p style={{ color: "#6A7590", fontSize: 15, margin: 0 }}>
              Search across all ingested payer policies — medical benefit, oncology, biologics
            </p>
          </div>
        )}

        <div style={{
          maxWidth: 720,
          margin: "0 auto",
          position: "relative",
        }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            background: "#FFFFFF",
            border: "1.5px solid #2E6BE6",
            borderRadius: 16,
            padding: "0 16px",
            boxShadow: "0 2px 16px rgba(46,107,230,0.10)",
            gap: 10,
          }}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ flexShrink: 0 }}>
              <circle cx="7.5" cy="7.5" r="5.5" stroke="#2E6BE6" strokeWidth="1.5"/>
              <path d="M13 13L16 16" stroke="#2E6BE6" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={handleKey}
              placeholder='Ask anything… "Does Cigna cover Keytruda for lung cancer?"'
              style={{
                flex: 1,
                border: "none",
                outline: "none",
                fontSize: 15,
                color: "#0D1C3A",
                background: "transparent",
                padding: "16px 0",
                fontFamily: "'DM Sans', sans-serif",
              }}
            />
            <button
              onClick={() => handleSearch()}
              style={{
                background: "#2E6BE6",
                color: "#fff",
                border: "none",
                borderRadius: 10,
                padding: "8px 20px",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "'DM Sans', sans-serif",
                flexShrink: 0,
              }}
            >Search</button>
          </div>

          <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap", justifyContent: searched ? "flex-start" : "center" }}>
            {PAYERS.map(p => (
              <button
                key={p}
                onClick={() => toggleFilter(p)}
                style={{
                  background: activeFilters.includes(p) ? "#EBF0FC" : "transparent",
                  border: `0.5px solid ${activeFilters.includes(p) ? "#2E6BE6" : "#E8EBF2"}`,
                  borderRadius: 20,
                  padding: "4px 12px",
                  fontSize: 12,
                  color: activeFilters.includes(p) ? "#2E6BE6" : "#6A7590",
                  cursor: "pointer",
                  fontFamily: "'DM Mono', monospace",
                  transition: "all 0.15s",
                }}
              >{p}</button>
            ))}
          </div>
        </div>

        {!searched && !loading && (
          <div style={{ maxWidth: 720, margin: "28px auto 0", display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
            {EXAMPLE_QUESTIONS.map(q => (
              <button
                key={q}
                onClick={() => { setQuery(q); handleSearch(q); }}
                style={{
                  background: "#F7F8FC",
                  border: "0.5px solid #E8EBF2",
                  borderRadius: 20,
                  padding: "6px 14px",
                  fontSize: 12,
                  color: "#6A7590",
                  cursor: "pointer",
                  fontFamily: "'DM Sans', sans-serif",
                  transition: "border-color 0.15s, color 0.15s",
                }}
                onMouseEnter={e => { (e.target as HTMLButtonElement).style.color = "#2E6BE6"; (e.target as HTMLButtonElement).style.borderColor = "#2E6BE6"; }}
                onMouseLeave={e => { (e.target as HTMLButtonElement).style.color = "#6A7590"; (e.target as HTMLButtonElement).style.borderColor = "#E8EBF2"; }}
              >
                {q}
              </button>
            ))}
          </div>
        )}
      </div>

      {loading && (
        <div style={{ maxWidth: 720, margin: "48px auto", padding: "0 32px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ display: "flex", gap: 5 }}>
              {[0,1,2].map(i => (
                <div key={i} style={{
                  width: 8, height: 8, borderRadius: "50%", background: "#2E6BE6",
                  animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
                }} />
              ))}
            </div>
            <span style={{ color: "#6A7590", fontSize: 14 }}>Searching across policy library…</span>
          </div>
          <style>{`@keyframes pulse { 0%,80%,100%{opacity:.2} 40%{opacity:1} }`}</style>
        </div>
      )}

      {searched && !loading && (
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "32px 32px 0" }}>
          <AnswerBlock
            key={query}
            result={result}
            onFollowUp={(q) => { setQuery(q); handleSearch(q); }}
          />
        </div>
      )}
    </div>
  );
}
