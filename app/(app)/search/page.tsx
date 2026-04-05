"use client";

import { useState, useRef, useEffect, useCallback } from "react";

const PAYERS = ["UnitedHealthcare", "Cigna", "BCBS NC", "UPMC", "Priority Health", "EmblemHealth", "Florida Blue"];

const EXAMPLE_QUESTIONS = [
  "Does Cigna cover Keytruda for lung cancer?",
  "What step therapy does UHC require for Humira?",
  "Which plans require biosimilar trial before Rituximab?",
  "What are the PA criteria for Opdivo at BCBS NC?",
  "How does UPMC handle bevacizumab site of care?",
];

const MOCK_RESPONSES = [
  {
    keywords: ["keytruda", "pembrolizumab"],
    result: {
      answer: `Yes — Keytruda (pembrolizumab) is covered under the medical benefit by most major commercial payers for non-small cell lung cancer. Cigna and UHC both require prior authorization with PD-L1 expression ≥1% confirmed by pathology report, ECOG performance status 0–2, and no prior checkpoint inhibitor therapy. BCBS NC does not cover Keytruda under the medical benefit — analysts recommend Opdivo as the preferred alternative. UPMC handles this as a pharmacy benefit only. Priority Health covers it as Preferred Specialty with PA required.`,
      source: "Cigna Drug Policy — Pembrolizumab (Jan 2025), p.3",
      sourceUrl: "#",
      coverageStates: [
        { payer: "UHC",             status: "covered",       tier: "Preferred Specialty", badge: "PA Required" },
        { payer: "Cigna",           status: "covered",       tier: "Non-Preferred",       badge: "PA Required" },
        { payer: "BCBS NC",         status: "not_covered",   tier: null,                  badge: "See alternatives" },
        { payer: "UPMC",            status: "pharmacy_only", tier: null,                  badge: "Pharmacy version exists" },
        { payer: "Priority Health", status: "covered",       tier: "Preferred Specialty", badge: "PA Required" },
      ],
      followUps: [
        "What step therapy does UHC require for Keytruda?",
        "Compare Keytruda coverage across all payers",
        "What changed in Keytruda policies last quarter?",
      ],
      policies: [
        { payer: "Cigna",            drug: "Pembrolizumab (Keytruda)", drug_generic: "pembrolizumab", date: "Jan 2025", type: "Medical Benefit", pages: 12, id: null },
        { payer: "UnitedHealthcare", drug: "Pembrolizumab (Keytruda)", drug_generic: "pembrolizumab", date: "Dec 2024", type: "Medical Benefit", pages: 9,  id: null },
        { payer: "Priority Health",  drug: "Oncology Drug List",       drug_generic: "pembrolizumab", date: "2026",     type: "Medical Benefit", pages: 47, id: null },
      ],
    },
  },
  {
    keywords: ["humira", "adalimumab", "step therapy", "step"],
    result: {
      answer: `UnitedHealthcare requires step therapy before approving Humira (adalimumab) under the medical benefit. Patients must first try and fail at least one biosimilar — specifically Hadlima (adalimumab-bwwd) or Hyrimoz (adalimumab-aqvh) — for a minimum of 90 days unless there is a documented contraindication. Failure must be confirmed via prescriber attestation and pharmacy claims history. If step therapy is bypassed due to contraindication, a clinical exception form is required at PA submission.`,
      source: "UHC Medical Drug Policy — Adalimumab (Feb 2025), p.7",
      sourceUrl: "#",
      coverageStates: [
        { payer: "UHC",             status: "covered",       tier: "Non-Preferred",      badge: "Step Therapy" },
        { payer: "Cigna",           status: "covered",       tier: "Non-Preferred",      badge: "Step Therapy" },
        { payer: "BCBS NC",         status: "covered",       tier: "Preferred Specialty", badge: "PA Required" },
        { payer: "UPMC",            status: "covered",       tier: "Non-Preferred",      badge: "Step Therapy" },
        { payer: "Priority Health", status: "covered",       tier: "Non-Preferred",      badge: "Step Therapy" },
      ],
      followUps: [
        "Which biosimilars does UHC accept for Humira step therapy?",
        "Does Cigna have the same step therapy for Humira?",
        "What changed in Humira policies since biosimilar launch?",
      ],
      policies: [
        { payer: "UnitedHealthcare", drug: "Adalimumab (Humira) & Biosimilars", drug_generic: "adalimumab", date: "Feb 2025", type: "Medical Benefit", pages: 18, id: null },
        { payer: "Cigna",            drug: "Adalimumab Products",                drug_generic: "adalimumab", date: "Jan 2025", type: "Medical Benefit", pages: 14, id: null },
      ],
    },
  },
  {
    keywords: ["rituximab", "rituxan", "biosimilar"],
    result: {
      answer: `Most major commercial payers require a biosimilar trial before approving the reference biologic Rituximab (Rituxan) for non-oncology indications. UHC, Cigna, and Priority Health all mandate that patients try Ruxience (rituximab-pvvr) or Truxima (rituximab-abbs) first for at least one treatment course. For oncology indications (NHL, CLL), biosimilar step therapy is waived by UHC and Cigna — Rituximab is covered directly with PA. BCBS NC applies biosimilar step therapy across all indications without exception.`,
      source: "Cigna Drug Policy — Rituximab Products (Nov 2024), p.5",
      sourceUrl: "#",
      coverageStates: [
        { payer: "UHC",             status: "covered",     tier: "Non-Preferred",      badge: "Biosimilar first" },
        { payer: "Cigna",           status: "covered",     tier: "Non-Preferred",      badge: "Biosimilar first" },
        { payer: "BCBS NC",         status: "covered",     tier: "Non-Preferred",      badge: "Biosimilar first" },
        { payer: "UPMC",            status: "covered",     tier: "Preferred Specialty", badge: "PA Required" },
        { payer: "Priority Health", status: "covered",     tier: "Non-Preferred",      badge: "Biosimilar first" },
      ],
      followUps: [
        "Which rituximab biosimilars are accepted at UHC?",
        "Is biosimilar step therapy waived for oncology at BCBS NC?",
        "Compare rituximab vs biosimilar coverage across payers",
      ],
      policies: [
        { payer: "Cigna",            drug: "Rituximab & Biosimilars", drug_generic: "rituximab", date: "Nov 2024", type: "Medical Benefit", pages: 16, id: null },
        { payer: "UnitedHealthcare", drug: "Rituximab Products",      drug_generic: "rituximab", date: "Oct 2024", type: "Medical Benefit", pages: 11, id: null },
        { payer: "BCBS NC",          drug: "Preferred Injectable Oncology Program", drug_generic: "rituximab", date: "Jan 2025", type: "Medical Benefit", pages: 34, id: null },
      ],
    },
  },
  {
    keywords: ["opdivo", "nivolumab", "bcbs", "pa criteria", "prior auth"],
    result: {
      answer: `BCBS NC requires prior authorization for Opdivo (nivolumab) under their Preferred Injectable Oncology Program. Key PA criteria include: confirmed pathology report with cancer type and stage, PD-L1 testing results (MSI-H or TMB-H status for tumor-agnostic approvals), ECOG performance status 0–2, and documentation that first-line platinum-based chemotherapy was completed or contraindicated. Prescriber must be a board-certified oncologist. Renewal authorization requires documented stable disease or partial response at 12 weeks per RECIST criteria.`,
      source: "BCBS NC Preferred Injectable Oncology Program (Mar 2025), p.12",
      sourceUrl: "#",
      coverageStates: [
        { payer: "UHC",             status: "covered",     tier: "Preferred Specialty", badge: "PA Required" },
        { payer: "Cigna",           status: "covered",     tier: "Preferred Specialty", badge: "PA Required" },
        { payer: "BCBS NC",         status: "covered",     tier: "Preferred Specialty", badge: "PA Required" },
        { payer: "UPMC",            status: "covered",     tier: "Preferred Specialty", badge: "PA Required" },
        { payer: "Priority Health", status: "covered",     tier: "Non-Preferred",      badge: "PA Required" },
      ],
      followUps: [
        "How does BCBS NC's Opdivo PA compare to Keytruda?",
        "What biomarker tests does BCBS NC require for Opdivo?",
        "Does Priority Health cover Opdivo as preferred?",
      ],
      policies: [
        { payer: "BCBS NC",          drug: "Preferred Injectable Oncology Program", drug_generic: "nivolumab", date: "Mar 2025", type: "Medical Benefit", pages: 34, id: null },
        { payer: "UnitedHealthcare", drug: "Nivolumab (Opdivo)",                    drug_generic: "nivolumab", date: "Jan 2025", type: "Medical Benefit", pages: 10, id: null },
        { payer: "Cigna",            drug: "Nivolumab Coverage Policy",             drug_generic: "nivolumab", date: "Dec 2024", type: "Medical Benefit", pages: 9,  id: null },
      ],
    },
  },
  {
    keywords: ["bevacizumab", "avastin", "upmc", "site of care", "site"],
    result: {
      answer: `UPMC Health Plan restricts bevacizumab (Avastin) administration to ambulatory infusion centers and physician offices only — hospital outpatient department infusions are not reimbursed under their site of care program effective January 2025. Patients currently receiving infusions at hospital outpatient departments must transition to an approved site within 90 days. Exceptions are granted for patients with documented medical necessity requiring hospital-level monitoring, subject to clinical review. UHC and Cigna allow all four site types but include SOS language encouraging ambulatory settings.`,
      source: "UPMC Commercial Medical Drug Policy — Bevacizumab (Jan 2025), p.4",
      sourceUrl: "#",
      coverageStates: [
        { payer: "UHC",             status: "covered",       tier: "Preferred Specialty", badge: "SOS Preferred" },
        { payer: "Cigna",           status: "covered",       tier: "Preferred Specialty", badge: "SOS Preferred" },
        { payer: "BCBS NC",         status: "covered",       tier: "Preferred Specialty", badge: "PA Required" },
        { payer: "UPMC",            status: "covered",       tier: "Preferred Specialty", badge: "Site restricted" },
        { payer: "Priority Health", status: "no_policy",     tier: null,                  badge: "No policy found" },
      ],
      followUps: [
        "Which payers have site of care restrictions for oncology drugs?",
        "What sites does UPMC allow for Keytruda infusions?",
        "Did UPMC change their bevacizumab SOS policy recently?",
      ],
      policies: [
        { payer: "UPMC",            drug: "Bevacizumab (Avastin) — SOS Policy",  drug_generic: "bevacizumab", date: "Jan 2025", type: "Medical Benefit", pages: 8,  id: null },
        { payer: "UnitedHealthcare", drug: "Bevacizumab Products",               drug_generic: "bevacizumab", date: "Nov 2024", type: "Medical Benefit", pages: 12, id: null },
        { payer: "Cigna",            drug: "Bevacizumab Coverage Policy",         drug_generic: "bevacizumab", date: "Oct 2024", type: "Medical Benefit", pages: 10, id: null },
      ],
    },
  },
];

const FALLBACK_RESULT = {
  answer: `No specific policy was found matching your query in the current policy library. This may mean no payer has published a medical benefit policy for this drug or indication, the policy uses different terminology, or the relevant documents haven't been ingested yet. Try rephrasing with the drug's brand or generic name, or check the Policy Library for recently ingested documents.`,
  source: "Anton-Cx Policy Library — Search Index",
  sourceUrl: "#",
  coverageStates: [
    { payer: "UHC",             status: "no_policy", tier: null, badge: "No policy found" },
    { payer: "Cigna",           status: "no_policy", tier: null, badge: "No policy found" },
    { payer: "BCBS NC",         status: "no_policy", tier: null, badge: "No policy found" },
    { payer: "UPMC",            status: "no_policy", tier: null, badge: "No policy found" },
    { payer: "Priority Health", status: "no_policy", tier: null, badge: "No policy found" },
  ],
  followUps: [
    "Search the policy library for this drug",
    "Ingest a new policy for this drug",
    "Try a broader search across all oncology drugs",
  ],
  policies: [],
};

function getMockResult(query: string) {
  const q = query.toLowerCase();
  const match = MOCK_RESPONSES.find(r => r.keywords.some(kw => q.includes(kw)));
  return match ? match.result : FALLBACK_RESULT;
}

interface CoverageState { payer: string; status: string; tier: string | null; badge: string | null; }
interface PolicyData    { payer: string; drug: string; drug_generic: string; date: string; type: string; pages: number; id: string | null; }
interface SearchResult  { answer: string; source: string; sourceUrl: string; coverageStates: CoverageState[]; followUps: string[]; policies: PolicyData[]; }
interface ChatMessage   { id: string; query: string; result: SearchResult; }

const statusConfig: Record<string, { bg: string; border: string; text: string; label: string }> = {
  covered:       { bg: "#E8F5E9", border: "#43A047", text: "#2E7D32", label: "Covered" },
  not_covered:   { bg: "#FFEBEE", border: "#E53935", text: "#B71C1C", label: "Not Covered" },
  pharmacy_only: { bg: "#FFF8E1", border: "#FB8C00", text: "#E65100", label: "Pharmacy Only" },
  no_policy:     { bg: "#F5F5F5", border: "#9E9E9E", text: "#424242", label: "No Policy Found" },
};

const G = `
  @keyframes pulse   { 0%,80%,100%{opacity:.2} 40%{opacity:1} }
  @keyframes spin    { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
  @keyframes fadeUp  { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
  @keyframes fadeOut { from{opacity:1;transform:translateY(0)} to{opacity:0;transform:translateY(-10px)} }
  @keyframes slideDown { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }
`;

function CoverageCard({ payer, status, tier, badge }: CoverageState) {
  const cfg = statusConfig[status] ?? statusConfig.no_policy;
  return (
    <div style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: 10, padding: "12px 14px", minWidth: 130, flex: "1 1 130px" }}>
      <div style={{ fontFamily: "var(--font-dm-mono)", fontSize: 11, color: "#6A7590", letterSpacing: "0.05em", marginBottom: 4 }}>{payer}</div>
      <div style={{ fontWeight: 600, fontSize: 13, color: cfg.text, marginBottom: 4 }}>{cfg.label}</div>
      {tier  && <div style={{ fontSize: 11, color: cfg.text, opacity: 0.8, marginBottom: 4 }}>{tier}</div>}
      {badge && <div style={{ display: "inline-block", background: "rgba(0,0,0,0.08)", borderRadius: 4, padding: "2px 6px", fontSize: 10, color: cfg.text, fontFamily: "var(--font-dm-mono)" }}>{badge}</div>}
    </div>
  );
}

function TypingText({ text, onDone }: { text: string; onDone?: () => void }) {
  const [displayed, setDisplayed] = useState("");
  const ref = useRef({ idx: 0, iv: 0 as ReturnType<typeof setInterval> });
  useEffect(() => {
    ref.current.idx = 0;
    clearInterval(ref.current.iv);
    setDisplayed("");
    ref.current.iv = setInterval(() => {
      ref.current.idx++;
      setDisplayed(text.slice(0, ref.current.idx));
      if (ref.current.idx >= text.length) { clearInterval(ref.current.iv); onDone?.(); }
    }, 8);
    return () => clearInterval(ref.current.iv);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);
  return <span>{displayed}</span>;
}

async function downloadPolicyPdf(drugGeneric: string, drugName: string, policyId: string | null) {
  const params = policyId ? `policy_id=${encodeURIComponent(policyId)}` : `drug=${encodeURIComponent(drugGeneric)}`;
  const res  = await fetch(`/api/generate-pdf?${params}`);
  if (!res.ok) { const e = await res.json().catch(() => ({ error: "Download failed" })); throw new Error(e.error ?? "Download failed"); }
  const blob = await res.blob();
  const url  = URL.createObjectURL(blob);
  const a    = Object.assign(document.createElement("a"), { href: url, download: `${drugName.replace(/\s+/g, "-")}-policy-report.pdf` });
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function PolicySourceCard({ pol }: { pol: PolicyData }) {
  const [st, setSt] = useState<"idle" | "loading" | "error">("idle");
  const dl = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (st === "loading") return;
    setSt("loading");
    try { await downloadPolicyPdf(pol.drug_generic, pol.drug, pol.id); setSt("idle"); }
    catch { setSt("error"); setTimeout(() => setSt("idle"), 3000); }
  };
  const bBg  = st === "error" ? "#FFEBEE" : st === "loading" ? "#EBF0FC" : "#F7F8FC";
  const bBdr = st === "error" ? "#E53935" : st === "loading" ? "#2E6BE6" : "#E8EBF2";
  const bClr = st === "error" ? "#B71C1C" : st === "loading" ? "#2E6BE6" : "#6A7590";
  return (
    <div style={{ background:"#FFF", border:`0.5px solid ${st==="error"?"#E53935":"#E8EBF2"}`, borderRadius:10, padding:"14px 16px", marginBottom:8, display:"flex", alignItems:"center", gap:14, cursor:"pointer", transition:"border-color .15s" }}
      onMouseEnter={e=>{ if(st!=="error") e.currentTarget.style.borderColor="#2E6BE6"; }}
      onMouseLeave={e=>{ if(st!=="error") e.currentTarget.style.borderColor="#E8EBF2"; }}>
      <div style={{ width:36, height:36, borderRadius:8, background:"#EBF0FC", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="2" y="1" width="10" height="13" rx="2" stroke="#2E6BE6" strokeWidth="1"/><path d="M5 5h5M5 8h5M5 11h3" stroke="#2E6BE6" strokeWidth="0.8" strokeLinecap="round"/></svg>
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:14, fontWeight:500, color:"#0D1C3A", marginBottom:2, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{pol.drug}</div>
        <div style={{ fontSize:12, color:"#6A7590", fontFamily:"var(--font-dm-mono)" }}>{pol.payer} · {pol.type} · {pol.date} · {pol.pages}p</div>
      </div>
      <button onClick={dl} disabled={st==="loading"}
        style={{ display:"flex", alignItems:"center", gap:5, background:bBg, border:`0.5px solid ${bBdr}`, borderRadius:6, padding:"5px 12px", fontSize:11, color:bClr, fontFamily:"var(--font-dm-mono)", cursor:st==="loading"?"not-allowed":"pointer", flexShrink:0, transition:"all .15s", whiteSpace:"nowrap" }}
        onMouseEnter={e=>{ if(st==="idle"){ e.currentTarget.style.background="#EBF0FC"; e.currentTarget.style.color="#2E6BE6"; e.currentTarget.style.borderColor="#2E6BE6"; }}}
        onMouseLeave={e=>{ if(st==="idle"){ e.currentTarget.style.background="#F7F8FC"; e.currentTarget.style.color="#6A7590"; e.currentTarget.style.borderColor="#E8EBF2"; }}}>
        {st==="loading" ? <><svg width="11" height="11" viewBox="0 0 11 11" fill="none" style={{animation:"spin 1s linear infinite"}}><circle cx="5.5" cy="5.5" r="4" stroke="#2E6BE6" strokeWidth="1.5" strokeDasharray="12 4"/></svg>Generating…</>
         : st==="error" ? <><svg width="11" height="11" viewBox="0 0 11 11" fill="none"><circle cx="5.5" cy="5.5" r="4.5" stroke="#E53935" strokeWidth="1"/><path d="M5.5 3v3M5.5 8v.5" stroke="#E53935" strokeWidth="1" strokeLinecap="round"/></svg>Failed</>
         :                <><svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M5.5 1v6M2.5 5l3 3 3-3" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/><path d="M1 9h9" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/></svg>PDF</>}
      </button>
    </div>
  );
}

function ChatTurn({ msg, isLatest, onFollowUp }: { msg: ChatMessage; isLatest: boolean; onFollowUp: (q: string) => void }) {
  const [done, setDone] = useState(!isLatest);
  return (
    <div style={{ marginBottom: 40, animation: isLatest ? "fadeUp 0.35s ease both" : "none" }}>
      <div style={{ display:"flex", justifyContent:"flex-end", marginBottom:20 }}>
        <div style={{ background:"#1B3A6B", color:"#FFF", borderRadius:"16px 16px 4px 16px", padding:"10px 18px", fontSize:14, fontFamily:"var(--font-dm-sans)", maxWidth:"80%", lineHeight:1.5 }}>
          {msg.query}
        </div>
      </div>

      <div style={{ marginBottom: 20 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
          <div style={{ background:"#EBF0FC", border:"0.5px solid #2E6BE6", borderRadius:6, padding:"3px 10px", fontSize:11, fontFamily:"var(--font-dm-mono)", color:"#2E6BE6", fontWeight:500 }}>AI Answer</div>
          <div style={{ background:"#F7F8FC", border:"0.5px solid #E8EBF2", borderRadius:6, padding:"3px 10px", fontSize:11, fontFamily:"var(--font-dm-mono)", color:"#A0AABB" }}>Medical Benefit · Oncology</div>
        </div>
        <p style={{ fontSize:15, lineHeight:1.75, color:"#0D1C3A", margin:"0 0 12px" }}>
          {isLatest ? <TypingText text={msg.result.answer} onDone={() => setDone(true)} /> : msg.result.answer}
        </p>
        {done && (
          <div style={{ display:"flex", alignItems:"center", gap:8, fontSize:12, color:"#6A7590", fontFamily:"var(--font-dm-mono)" }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1" y="1" width="12" height="12" rx="3" stroke="#A0AABB" strokeWidth="0.8"/><path d="M4 7l2 2 4-4" stroke="#2E6BE6" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <a href={msg.result.sourceUrl} style={{ color:"#2E6BE6", textDecoration:"none" }}>{msg.result.source}</a>
          </div>
        )}
      </div>

      {done && (
        <div style={{ marginBottom:20 }}>
          <div style={{ fontSize:11, fontFamily:"var(--font-dm-mono)", color:"#A0AABB", marginBottom:10, letterSpacing:"0.06em" }}>COVERAGE ACROSS PAYERS</div>
          <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
            {msg.result.coverageStates.map(c => <CoverageCard key={c.payer} {...c} />)}
          </div>
        </div>
      )}

      {done && isLatest && (
        <div style={{ marginBottom:20 }}>
          <div style={{ fontSize:11, fontFamily:"var(--font-dm-mono)", color:"#A0AABB", marginBottom:10, letterSpacing:"0.06em" }}>SUGGESTED FOLLOW-UPS</div>
          <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
            {msg.result.followUps.map(q => (
              <button key={q} onClick={() => onFollowUp(q)}
                style={{ background:"#F7F8FC", border:"0.5px solid #E8EBF2", borderRadius:20, padding:"7px 14px", fontSize:12, color:"#2E6BE6", cursor:"pointer", fontFamily:"var(--font-dm-sans)", transition:"background .1s, border-color .1s" }}
                onMouseEnter={e=>{ e.currentTarget.style.background="#EBF0FC"; e.currentTarget.style.borderColor="#2E6BE6"; }}
                onMouseLeave={e=>{ e.currentTarget.style.background="#F7F8FC"; e.currentTarget.style.borderColor="#E8EBF2"; }}
              >{q} →</button>
            ))}
          </div>
        </div>
      )}

      {done && (
        <>
          <div style={{ borderTop:"0.5px solid #E8EBF2", margin:"8px 0 18px" }} />
          <div style={{ fontSize:11, fontFamily:"var(--font-dm-mono)", color:"#A0AABB", marginBottom:12, letterSpacing:"0.06em" }}>
            SOURCE POLICIES — {msg.result.policies.length} DOCUMENTS
          </div>
          {msg.result.policies.map((pol, i) => <PolicySourceCard key={i} pol={pol} />)}
        </>
      )}
    </div>
  );
}

function FollowUpBar({ onSend, loading, activeFilters, onToggleFilter }: {
  onSend: (q: string) => void; loading: boolean; activeFilters: string[]; onToggleFilter: (p: string) => void;
}) {
  const [text, setText] = useState("");
  const taRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = taRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  }, [text]);

  const send = useCallback(() => {
    if (!text.trim() || loading) return;
    onSend(text.trim()); setText("");
    if (taRef.current) taRef.current.style.height = "auto";
  }, [text, loading, onSend]);

  return (
    <div style={{ position:"sticky", bottom:0, background:"linear-gradient(to bottom, transparent, #F7F8FC 32px)", paddingTop:32, paddingBottom:20 }}>
      <div style={{ display:"flex", gap:6, marginBottom:10, flexWrap:"wrap" }}>
        {PAYERS.map(p => (
          <button key={p} onClick={() => onToggleFilter(p)}
            style={{ background:activeFilters.includes(p)?"#EBF0FC":"transparent", border:`0.5px solid ${activeFilters.includes(p)?"#2E6BE6":"#D0D6E8"}`, borderRadius:20, padding:"3px 10px", fontSize:11, color:activeFilters.includes(p)?"#2E6BE6":"#6A7590", cursor:"pointer", fontFamily:"var(--font-dm-mono)", transition:"all .15s" }}
          >{p}</button>
        ))}
      </div>
      <div style={{ display:"flex", alignItems:"flex-end", gap:10, background:"#FFF", border:"1.5px solid #2E6BE6", borderRadius:16, padding:"10px 14px", boxShadow:"0 2px 16px rgba(46,107,230,0.08)" }}>
        <textarea ref={taRef} value={text} onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder="Ask a follow-up… (Shift+Enter for new line)" rows={1}
          style={{ flex:1, border:"none", outline:"none", resize:"none", fontSize:14, color:"#0D1C3A", background:"transparent", fontFamily:"var(--font-dm-sans)", lineHeight:1.5, overflow:"hidden" }}
        />
        <button onClick={send} disabled={!text.trim() || loading}
          style={{ background:!text.trim()||loading?"#E8EBF2":"#2E6BE6", border:"none", borderRadius:10, width:36, height:36, display:"flex", alignItems:"center", justifyContent:"center", cursor:!text.trim()||loading?"not-allowed":"pointer", flexShrink:0, transition:"background .15s" }}>
          {loading
            ? <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{animation:"spin 1s linear infinite"}}><circle cx="8" cy="8" r="6" stroke="#fff" strokeWidth="1.5" strokeDasharray="18 6"/></svg>
            : <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 13V3M4 7l4-4 4 4" stroke="#FFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
        </button>
      </div>
      <div style={{ fontSize:11, color:"#A0AABB", fontFamily:"var(--font-dm-mono)", textAlign:"center", marginTop:8 }}>
        Enter to send · Shift+Enter for new line
      </div>
    </div>
  );
}

export default function PolicySearch() {
  const [query,         setQuery]         = useState("");
  const [messages,      setMessages]      = useState<ChatMessage[]>([]);
  const [loading,       setLoading]       = useState(false);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [phase,         setPhase]         = useState<"hero" | "transitioning" | "chat">("hero");
  const [topBarQuery,   setTopBarQuery]   = useState("");

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);

  const toggleFilter = (p: string) =>
    setActiveFilters(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);

  const runSearch = useCallback((q: string) => {
    if (!q.trim() || loading) return;

    if (phase === "hero") {
      setTopBarQuery(q);
      setPhase("transitioning");
      setTimeout(() => {
        setPhase("chat");
        setLoading(true);
        setTimeout(() => {
          setMessages([{ id: crypto.randomUUID(), query: q, result: getMockResult(q) }]);
          setLoading(false);
        }, 1200);
      }, 320);
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setMessages(prev => [...prev, { id: crypto.randomUUID(), query: q, result: getMockResult(q) }]);
      setLoading(false);
    }, 1200);
  }, [loading, phase]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
    }
  }, [messages.length]);

  return (
    <div style={{ fontFamily:"var(--font-dm-sans)", background:"#F7F8FC", minHeight:"100%", display:"flex", flexDirection:"column", position:"relative" }}>
      <style>{G}</style>

      {(phase === "hero" || phase === "transitioning") && (
        <div style={{
          flex: 1,
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          padding: "0 32px 140px",
          animation: phase === "transitioning" ? "fadeOut 0.32s ease forwards" : "none",
        }}>
          <div style={{ fontFamily:"var(--font-syne)", fontSize:12, letterSpacing:"0.14em", color:"#2E6BE6", textTransform:"uppercase", marginBottom:14, fontWeight:600 }}>
            Policy Intelligence
          </div>
          <h1 style={{ fontFamily:"var(--font-syne)", fontSize:38, fontWeight:700, color:"#0D1C3A", margin:"0 0 10px", letterSpacing:"-0.02em", textAlign:"center" }}>
            Ask anything about drug coverage
          </h1>
          <p style={{ color:"#6A7590", fontSize:15, margin:"0 0 40px", textAlign:"center" }}>
            Search across all ingested payer policies — medical benefit, oncology, biologics
          </p>

          <div style={{ width:"100%", maxWidth:680 }}>
            <div style={{ display:"flex", alignItems:"center", background:"#FFF", border:"1.5px solid #2E6BE6", borderRadius:50, padding:"0 8px 0 22px", boxShadow:"0 2px 20px rgba(46,107,230,0.13)", gap:10, marginBottom:16 }}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ flexShrink:0 }}>
                <circle cx="7.5" cy="7.5" r="5.5" stroke="#2E6BE6" strokeWidth="1.5"/>
                <path d="M13 13L16 16" stroke="#2E6BE6" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <input ref={inputRef} autoFocus value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") runSearch(query); }}
                placeholder='e.g. "Does Cigna cover Keytruda for lung cancer?"'
                style={{ flex:1, border:"none", outline:"none", fontSize:15, color:"#0D1C3A", background:"transparent", padding:"17px 0", fontFamily:"var(--font-dm-sans)" }}
              />
              <button onClick={() => runSearch(query)}
                style={{ background:"#2E6BE6", color:"#fff", border:"none", borderRadius:40, padding:"10px 26px", fontSize:14, fontWeight:600, cursor:"pointer", fontFamily:"var(--font-dm-sans)", flexShrink:0, transition:"background .15s" }}
                onMouseEnter={e => e.currentTarget.style.background = "#1B3A6B"}
                onMouseLeave={e => e.currentTarget.style.background = "#2E6BE6"}
              >Search</button>
            </div>

            <div style={{ display:"flex", gap:8, flexWrap:"wrap", justifyContent:"center", marginBottom:24 }}>
              {PAYERS.map(p => (
                <button key={p} onClick={() => toggleFilter(p)}
                  style={{ background:activeFilters.includes(p)?"#EBF0FC":"transparent", border:`0.5px solid ${activeFilters.includes(p)?"#2E6BE6":"#D0D6E8"}`, borderRadius:20, padding:"5px 14px", fontSize:12, color:activeFilters.includes(p)?"#2E6BE6":"#6A7590", cursor:"pointer", fontFamily:"var(--font-dm-mono)", transition:"all .15s" }}
                >{p}</button>
              ))}
            </div>

            <div style={{ display:"flex", gap:8, flexWrap:"wrap", justifyContent:"center" }}>
              {EXAMPLE_QUESTIONS.map(q => (
                <button key={q} onClick={() => { setQuery(q); runSearch(q); }}
                  style={{ background:"#FFF", border:"0.5px solid #E8EBF2", borderRadius:20, padding:"7px 16px", fontSize:12, color:"#6A7590", cursor:"pointer", fontFamily:"var(--font-dm-sans)", transition:"border-color .15s, color .15s" }}
                  onMouseEnter={e => { e.currentTarget.style.color="#2E6BE6"; e.currentTarget.style.borderColor="#2E6BE6"; }}
                  onMouseLeave={e => { e.currentTarget.style.color="#6A7590"; e.currentTarget.style.borderColor="#E8EBF2"; }}
                >{q}</button>
              ))}
            </div>
          </div>
        </div>
      )}

      {phase === "chat" && (
        <>
          <div style={{ position:"sticky", top:0, zIndex:20, background:"#FFF", borderBottom:"0.5px solid #E8EBF2", padding:"12px 32px", animation:"slideDown 0.3s ease both" }}>
            <div style={{ maxWidth:720, margin:"0 auto", display:"flex", alignItems:"center", gap:12 }}>
              <div style={{ flex:1, display:"flex", alignItems:"center", background:"#F7F8FC", border:"0.5px solid #E8EBF2", borderRadius:50, padding:"0 14px", gap:8, height:40 }}>
                <svg width="14" height="14" viewBox="0 0 18 18" fill="none" style={{ flexShrink:0 }}>
                  <circle cx="7.5" cy="7.5" r="5.5" stroke="#A0AABB" strokeWidth="1.5"/>
                  <path d="M13 13L16 16" stroke="#A0AABB" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                <span style={{ flex:1, fontSize:13, color:"#6A7590", fontFamily:"var(--font-dm-sans)", overflow:"hidden", whiteSpace:"nowrap", textOverflow:"ellipsis" }}>
                  {topBarQuery}
                </span>
              </div>
              <button
                onClick={() => { setPhase("hero"); setMessages([]); setQuery(""); setTopBarQuery(""); setLoading(false); }}
                style={{ background:"#EBF0FC", border:"0.5px solid #C4D4F8", borderRadius:20, padding:"7px 16px", fontSize:11, color:"#1B3A6B", cursor:"pointer", fontFamily:"var(--font-dm-mono)", fontWeight:500, flexShrink:0, whiteSpace:"nowrap", transition:"background .15s" }}
                onMouseEnter={e => e.currentTarget.style.background = "#D6E4FC"}
                onMouseLeave={e => e.currentTarget.style.background = "#EBF0FC"}
              >+ New search</button>
            </div>
          </div>

          <div style={{ flex:1, maxWidth:720, width:"100%", margin:"0 auto", padding:"28px 32px 0" }}>
            {messages.map((msg, i) => (
              <ChatTurn key={msg.id} msg={msg} isLatest={i === messages.length - 1} onFollowUp={runSearch} />
            ))}

            {loading && (
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:32, animation:"fadeUp 0.2s ease both" }}>
                <div style={{ display:"flex", gap:5 }}>
                  {[0,1,2].map(i => (
                    <div key={i} style={{ width:7, height:7, borderRadius:"50%", background:"#2E6BE6", animation:`pulse 1.2s ease-in-out ${i*0.2}s infinite` }} />
                  ))}
                </div>
                <span style={{ color:"#6A7590", fontSize:13, fontFamily:"var(--font-dm-mono)" }}>Searching policy library…</span>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div style={{ maxWidth:720, width:"100%", margin:"0 auto", padding:"0 32px" }}>
            <FollowUpBar onSend={runSearch} loading={loading} activeFilters={activeFilters} onToggleFilter={toggleFilter} />
          </div>
        </>
      )}
    </div>
  );
}