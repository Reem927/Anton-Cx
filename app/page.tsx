"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useInView } from "framer-motion";

// ─── Constants ────────────────────────────────────────────────────────────────

const SPRING = { type: "spring" as const, stiffness: 300, damping: 30 };
const stagger = (i: number) => Math.min(i * 0.04, 0.2);

const TICKER_ITEMS = [
  { text: "AETNA",             type: "payer" },
  { text: "Humira · J0135",    type: "drug"  },
  { text: "UHC",               type: "payer" },
  { text: "Keytruda · J9271",  type: "drug"  },
  { text: "CIGNA",             type: "payer" },
  { text: "Dupixent · J0173",  type: "drug"  },
  { text: "BCBS-TX",           type: "payer" },
  { text: "Stelara · J3357",   type: "drug"  },
  { text: "HUMANA",            type: "payer" },
  { text: "Enbrel · J1438",    type: "drug"  },
  { text: "ELEVANCE",          type: "payer" },
  { text: "Ozempic · J3490",  type: "drug"  },
  { text: "CENTENE",           type: "payer" },
  { text: "Cosentyx · J0584", type: "drug"  },
  { text: "KAISER",           type: "payer" },
  { text: "Skyrizi · J0222",  type: "drug"  },
  { text: "MOLINA",            type: "payer" },
  { text: "Rinvoq · J0223",   type: "drug"  },
  { text: "ANTHEM",           type: "payer" },
  { text: "Tremfya · J0222",  type: "drug"  },
  { text: "MAGELLAN",         type: "payer" },
  { text: "Cimzia · J0718",   type: "drug"  },
  { text: "FLORIDA BLUE",     type: "payer" },
  { text: "Xolair · J2357",   type: "drug"  },
];

const DEMO_ROWS = [
  { drug: "Humira",   jCode: "J0135", aetna: "pa_required", uhc: "pa_required", cigna: "pa_required", bcbs: "covered"     },
  { drug: "Keytruda", jCode: "J9271", aetna: "covered",     uhc: "covered",     cigna: "pa_required", bcbs: "pa_required" },
  { drug: "Dupixent", jCode: "J0173", aetna: "pa_required", uhc: "pa_required", cigna: "denied",      bcbs: "pa_required" },
  { drug: "Stelara",  jCode: "J3357", aetna: "pa_required", uhc: "pa_required", cigna: "denied",      bcbs: "pa_required" },
];

const STATUS_PILL: Record<string, { label: string; bg: string; text: string; border: string }> = {
  covered:     { label: "COVERED", bg: "#EDFAF3", text: "#0F7A40", border: "#B8EDD0" },
  pa_required: { label: "PA REQ",  bg: "#FFF4E0", text: "#D4880A", border: "#F5D898" },
  denied:      { label: "DENIED",  bg: "#FEE8E8", text: "#B02020", border: "#F5C0C0" },
};

const FEATURES = [
  {
    id: "search", label: "Policy Search",
    title: "Ask anything. Get cited answers.",
    desc: "Natural language queries across all ingested payer policies. Ask which plans cover Keytruda for NSCLC, or what PA criteria Aetna requires — and get structured, cited answers in seconds.",
    stat: "48+", statLabel: "Payers indexed",
    pill: { label: "Q&A", bg: "#EBF0FC", text: "#1B3A6B", border: "#C4D4F8" },
    icon: (<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.25"/><path d="M11 11L14 14" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/></svg>),
  },
  {
    id: "compare", label: "Comparison Engine",
    title: "Side-by-side. Every payer.",
    desc: "Select any drug and instantly see a normalized comparison grid — PA criteria, step therapy, covered indications, site-of-care restrictions — across every payer in your library.",
    stat: "9", statLabel: "Fields normalized",
    pill: { label: "COMPARE", bg: "#EDFAF3", text: "#0F7A40", border: "#B8EDD0" },
    icon: (<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 4h5M2 8h5M2 12h5M9 4h5M9 8h5M9 12h5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/></svg>),
  },
  {
    id: "changes", label: "Change Tracker",
    title: "Know before your clients do.",
    desc: "Automated monitoring flags policy updates the moment they happen. Get AI-generated summaries of exactly what changed — PA criteria, step therapy, coverage status — with page-level citations.",
    stat: "< 24h", statLabel: "Detection lag",
    pill: { label: "CHANGED", bg: "#FFF4E0", text: "#D4880A", border: "#F5D898" },
    icon: (<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 5l2.5-2.5L8 5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/><path d="M5.5 2.5V10" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/><path d="M13 11l-2.5 2.5L8 11" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/><path d="M10.5 13.5V6" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/></svg>),
  },
  {
    id: "library", label: "Policy Library",
    title: "One place. Every policy.",
    desc: "A centralized, normalized repository of clinical policy bulletins across all payers. Filter by drug, payer, plan type, or effective date. No more hunting through PDFs from incompatible portals.",
    stat: "1", statLabel: "Source of truth",
    pill: { label: "INDEXED", bg: "#EBF0FC", text: "#1B3A6B", border: "#C4D4F8" },
    icon: (<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/><path d="M6 4v8M10 4v8" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/></svg>),
  },
];

const STEPS = [
  { step: "01", title: "Upload or paste a URL", desc: "Drag-and-drop any payer's clinical policy PDF, or paste a URL from uhcprovider.com, aetna.com/cpb, cigna.com, or any other plan portal." },
  { step: "02", title: "Claude extracts structure", desc: "The Anthropic API reads every page and extracts 9 normalized fields — PA criteria, step therapy drugs, covered indications, site-of-care, and more — into a clean JSON record." },
  { step: "03", title: "Search, compare & track", desc: "Your policy is live. Query in natural language, include it in comparison grids, and let the change tracker alert you when a new version appears." },
];

// ─── Primitives ───────────────────────────────────────────────────────────────

function SPill({ status }: { status: string }) {
  const p = STATUS_PILL[status];
  return (
    <span style={{
      fontFamily: "var(--font-dm-mono),Lato,sans-serif",
      fontSize: "9px", fontWeight: 500, letterSpacing: "0.06em",
      padding: "2px 6px", borderRadius: "4px", whiteSpace: "nowrap" as const,
      background: p.bg, color: p.text,
      borderWidth: "0.5px", borderStyle: "solid", borderColor: p.border,
    }}>{p.label}</span>
  );
}

function TPill({ label, bg, text, border }: { label: string; bg: string; text: string; border: string }) {
  return (
    <span style={{
      fontFamily: "var(--font-dm-mono),Lato,sans-serif",
      fontSize: "9px", fontWeight: 500, letterSpacing: "0.06em",
      padding: "2px 6px", borderRadius: "4px", whiteSpace: "nowrap" as const,
      background: bg, color: text,
      borderWidth: "0.5px", borderStyle: "solid", borderColor: border,
    }}>{label}</span>
  );
}

function Card({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: "#FFFFFF", borderWidth: "0.5px", borderStyle: "solid", borderColor: "#E8EBF2", borderRadius: "10px", ...style }}>
      {children}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const [activeFeature, setActiveFeature] = useState(0);
  const [scrolled, setScrolled] = useState(false);

  const heroRef  = useRef<HTMLDivElement>(null);
  const featRef  = useRef<HTMLDivElement>(null);
  const stepsRef = useRef<HTMLDivElement>(null);
  const ctaRef   = useRef<HTMLDivElement>(null);

  const heroInView  = useInView(heroRef,  { once: true, margin: "-60px" });
  const featInView  = useInView(featRef,  { once: true, margin: "-60px" });
  const stepsInView = useInView(stepsRef, { once: true, margin: "-60px" });
  const ctaInView   = useInView(ctaRef,   { once: true, margin: "-60px" });

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const feat = FEATURES[activeFeature];

  return (
    <div style={{ background: "#F7F8FC", minHeight: "100vh", overflowX: "hidden" }}>
      <style>{`
        @keyframes ticker { from { transform: translateX(0) } to { transform: translateX(-33.333%) } }
        *, *::before, *::after { box-sizing: border-box; }
      `}</style>

      {/* NAV */}
      <motion.header
        animate={{ background: scrolled ? "rgba(255,255,255,0.96)" : "transparent", borderBottomColor: scrolled ? "#E8EBF2" : "transparent" }}
        transition={{ duration: 0.2 }}
        style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, height: "52px", display: "flex", alignItems: "center", borderBottomWidth: "0.5px", borderBottomStyle: "solid", backdropFilter: scrolled ? "blur(12px)" : "none" }}
      >
        <div style={{ maxWidth: 1120, margin: "0 auto", padding: "0 32px", width: "100%", display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: "6px", background: "#1B3A6B", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontFamily: "var(--font-syne),Lato,sans-serif", fontSize: "11px", fontWeight: 800, color: "#FFFFFF", letterSpacing: "-0.5px" }}>Cx</span>
            </div>
            <span style={{ fontFamily: "var(--font-dm-sans),Lato,sans-serif", fontSize: "15px", fontWeight: 700, color: "#1B3A6B", letterSpacing: "-0.2px" }}>Anton Cx</span>
          </div>
          <nav style={{ display: "flex", gap: 28 }}>
            {["Features", "How It Works", "Payers"].map((l) => (
              <a key={l} href={`#${l.toLowerCase().replace(/\s+/g, "-")}`} style={{ fontFamily: "var(--font-dm-sans),Lato,sans-serif", fontSize: "13px", color: "#6A7590", textDecoration: "none", fontWeight: 500 }}>{l}</a>
            ))}
          </nav>
          <div style={{ flex: 1, display: "flex", justifyContent: "flex-end", gap: 10, alignItems: "center" }}>
            <Link href="/login" style={{ fontFamily: "var(--font-dm-sans),Lato,sans-serif", fontSize: "13px", fontWeight: 500, color: "#6A7590", textDecoration: "none", padding: "6px 14px", borderRadius: "6px", borderWidth: "0.5px", borderStyle: "solid", borderColor: "#E8EBF2", background: "#FFFFFF" }}>Log in</Link>
            <Link href="/signup" style={{ fontFamily: "var(--font-dm-sans),Lato,sans-serif", fontSize: "13px", fontWeight: 600, color: "#FFFFFF", textDecoration: "none", padding: "6px 16px", borderRadius: "6px", background: "#2E6BE6" }}>Get started</Link>
          </div>
        </div>
      </motion.header>

      {/* HERO */}
      <section ref={heroRef} style={{ maxWidth: 1120, margin: "0 auto", padding: "116px 32px 72px" }}>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={heroInView ? { opacity: 1, y: 0 } : {}} transition={{ ...SPRING }} style={{ marginBottom: 22 }}>
          <span style={{ fontFamily: "var(--font-dm-mono),Lato,sans-serif", fontSize: "10px", fontWeight: 500, letterSpacing: "0.1em", color: "#2E6BE6", background: "#EBF0FC", borderWidth: "0.5px", borderStyle: "solid", borderColor: "#C4D4F8", padding: "4px 10px", borderRadius: "4px", display: "inline-block" }}>
            MEDICAL BENEFIT DRUG POLICY INTELLIGENCE
          </span>
        </motion.div>

        {/* H1 — Bold, impactful headline */}
        <motion.h1
          initial={{ opacity: 0, y: 14 }} animate={heroInView ? { opacity: 1, y: 0 } : {}}
          transition={{ ...SPRING, delay: stagger(1) }}
          style={{ fontFamily: "var(--font-dm-sans),Lato,sans-serif", fontSize: "clamp(32px, 4.5vw, 58px)", fontWeight: 800, color: "#0D1C3A", letterSpacing: "-0.8px", lineHeight: 1.08, maxWidth: "900px", margin: "0 0 20px" }}
        >
          Every payer policy.
          <br />
          <span style={{ color: "#2E6BE6", fontWeight: 800 }}>One source of truth.</span>
        </motion.h1>

        {/* Subtext — DM Sans, fluid size, simple and readable */}
        <motion.p
          initial={{ opacity: 0, y: 14 }} animate={heroInView ? { opacity: 1, y: 0 } : {}}
          transition={{ ...SPRING, delay: stagger(2) }}
          style={{ fontFamily: "var(--font-dm-sans),Lato,sans-serif", fontSize: "clamp(14px, 1.2vw, 17px)", color: "#6A7590", lineHeight: 1.7, maxWidth: "620px", margin: "0 0 36px" }}
        >
          Anton Cx ingests, normalizes, and tracks clinical policy bulletins from 48+ health plans — giving market access analysts a searchable, comparable, always-current view of drug coverage.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 14 }} animate={heroInView ? { opacity: 1, y: 0 } : {}}
          transition={{ ...SPRING, delay: stagger(3) }}
          style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 64 }}
        >
          <Link href="/signup" style={{ fontFamily: "var(--font-dm-sans),Lato,sans-serif", fontSize: "14px", fontWeight: 600, color: "#FFFFFF", textDecoration: "none", padding: "10px 22px", borderRadius: "7px", background: "#2E6BE6", display: "inline-block" }}>Start for free →</Link>
          <Link href="/login" style={{ fontFamily: "var(--font-dm-sans),Lato,sans-serif", fontSize: "14px", fontWeight: 500, color: "#6A7590", textDecoration: "none", padding: "10px 18px", borderRadius: "7px", borderWidth: "0.5px", borderStyle: "solid", borderColor: "#E8EBF2", background: "#FFFFFF", display: "inline-block" }}>Log in</Link>
        </motion.div>

        {/* Demo table */}
        <motion.div initial={{ opacity: 0, y: 28 }} animate={heroInView ? { opacity: 1, y: 0 } : {}} transition={{ ...SPRING, delay: stagger(4) }}>
          <Card style={{ overflow: "hidden", boxShadow: "0 4px 28px rgba(13,28,58,0.07)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 16px", borderBottom: "0.5px solid #E8EBF2", background: "#F7F8FC" }}>
              {[1,2,3].map(i => <div key={i} style={{ width: 9, height: 9, borderRadius: "50%", background: "#E8EBF2" }} />)}
              <span style={{ fontFamily: "var(--font-dm-mono),Lato,sans-serif", fontSize: "10px", color: "#A0AABB", letterSpacing: "0.05em", marginLeft: 8 }}>COVERAGE OVERVIEW — Q2 2026</span>
              <div style={{ flex: 1 }} />
              <TPill label="CHANGED THIS QTR" bg="#FFF4E0" text="#D4880A" border="#F5D898" />
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "0.5px solid #E8EBF2" }}>
                    {["DRUG", "AETNA", "UHC", "CIGNA", "BCBS-TX"].map(h => (
                      <th key={h} style={{ padding: "9px 16px", textAlign: "left", fontFamily: "var(--font-dm-mono),Lato,sans-serif", fontSize: "9px", fontWeight: 500, letterSpacing: "0.08em", color: "#A0AABB", background: "#F7F8FC" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {DEMO_ROWS.map((row, i) => (
                    <motion.tr key={row.drug} initial={{ opacity: 0, x: -6 }} animate={heroInView ? { opacity: 1, x: 0 } : {}} transition={{ ...SPRING, delay: 0.3 + stagger(i) }} style={{ borderBottom: "0.5px solid #E8EBF2" }}>
                      <td style={{ padding: "10px 16px" }}>
                        <span style={{ fontFamily: "var(--font-syne),Lato,sans-serif", fontSize: "13px", fontWeight: 700, color: "#0D1C3A", display: "block" }}>{row.drug}</span>
                        <span style={{ fontFamily: "var(--font-dm-mono),Lato,sans-serif", fontSize: "9px", color: "#A0AABB", letterSpacing: "0.05em" }}>{row.jCode}</span>
                      </td>
                      {[row.aetna, row.uhc, row.cigna, row.bcbs].map((status, j) => (
                        <td key={j} style={{ padding: "10px 16px" }}><SPill status={status} /></td>
                      ))}
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ padding: "9px 16px", borderTop: "0.5px solid #E8EBF2", background: "#F7F8FC", display: "flex", alignItems: "center" }}>
              <span style={{ fontFamily: "var(--font-dm-mono),Lato,sans-serif", fontSize: "9px", color: "#A0AABB", letterSpacing: "0.05em" }}>48 PAYERS · 5 DRUG CLASSES · UPDATED APR 4, 2026</span>
              <div style={{ flex: 1 }} />
              <Link href="/compare" style={{ fontFamily: "var(--font-dm-mono),Lato,sans-serif", fontSize: "9px", color: "#2E6BE6", letterSpacing: "0.05em", textDecoration: "none" }}>OPEN IN COMPARE →</Link>
            </div>
          </Card>
        </motion.div>
      </section>

      {/* TICKER — 3 copies, animates -33.333% for seamless loop */}
      <section id="payers" style={{ borderTop: "0.5px solid #E8EBF2", borderBottom: "0.5px solid #E8EBF2", background: "#FFFFFF", padding: "13px 0", overflow: "hidden" }}>
        <div style={{ display: "flex", animation: "ticker 40s linear infinite", width: "max-content" }}>
          {[...TICKER_ITEMS, ...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
            <span key={i} style={{ display: "inline-flex", alignItems: "center" }}>
              <span style={{ fontFamily: "var(--font-dm-mono),Lato,sans-serif", fontSize: "10px", fontWeight: item.type === "payer" ? 600 : 400, letterSpacing: item.type === "payer" ? "0.12em" : "0.06em", color: item.type === "payer" ? "#6A7590" : "#A0AABB", whiteSpace: "nowrap" as const, padding: "0 18px" }}>{item.text}</span>
              <span style={{ color: "#D0D6E8", fontSize: "8px" }}>·</span>
            </span>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" ref={featRef} style={{ maxWidth: 1200, margin: "0 auto", padding: "88px 32px" }}>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={featInView ? { opacity: 1, y: 0 } : {}} transition={{ ...SPRING }}
          style={{ fontFamily: "var(--font-dm-mono),Lato,sans-serif", fontSize: "10px", fontWeight: 500, letterSpacing: "0.12em", color: "#A0AABB", marginBottom: 14 }}>
          WHAT ANTON CX DOES
        </motion.div>

        {/* h2 — DM Sans weight 600, pharmaceutical clarity */}
        <motion.h2 initial={{ opacity: 0, y: 10 }} animate={featInView ? { opacity: 1, y: 0 } : {}} transition={{ ...SPRING, delay: stagger(1) }}
          style={{ fontFamily: "var(--font-dm-sans),Lato,sans-serif", fontSize: "clamp(24px, 3vw, 38px)", fontWeight: 600, color: "#0D1C3A", letterSpacing: "-0.4px", lineHeight: 1.2, marginBottom: 48, maxWidth: "700px" }}>
          Built for analysts who can&apos;t afford to be slow.
        </motion.h2>

        <div style={{ display: "grid", gridTemplateColumns: "minmax(180px, 240px) 1fr", gap: 32, alignItems: "start" }}>
          {/* Feature tabs */}
          <div style={{ display: "flex", flexDirection: "column" as const, gap: 4 }}>
            {FEATURES.map((f, i) => {
              const active = activeFeature === i;
              return (
                <motion.button key={f.id} onClick={() => setActiveFeature(i)}
                  initial={{ opacity: 0, x: -8 }} animate={featInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ ...SPRING, delay: stagger(i) }}
                  style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderRadius: "8px", border: "none", cursor: "pointer", background: active ? "#EBF0FC" : "transparent", color: active ? "#1B3A6B" : "#6A7590", textAlign: "left" as const, position: "relative" as const, transition: "background 0.15s, color 0.15s" }}
                >
                  {active && (
                    <motion.div layoutId="feat-bar" transition={SPRING}
                      style={{ position: "absolute" as const, left: 0, top: 6, bottom: 6, width: 3, borderRadius: 2, background: "#2E6BE6" }} />
                  )}
                  <span style={{ color: active ? "#1B3A6B" : "#A0AABB", display: "flex", flexShrink: 0 }}>{f.icon}</span>
                  <span style={{ fontFamily: "var(--font-syne),Lato,sans-serif", fontSize: "14px", fontWeight: active ? 700 : 400 }}>{f.label}</span>
                </motion.button>
              );
            })}
          </div>

          {/* Feature detail */}
          <AnimatePresence mode="wait">
            <motion.div key={feat.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ ...SPRING }}>
              <Card style={{ padding: "32px", boxShadow: "0 4px 24px rgba(13,28,58,0.06)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, flexWrap: "wrap", gap: "16px" }}>
                  <TPill label={feat.pill.label} bg={feat.pill.bg} text={feat.pill.text} border={feat.pill.border} />
                  <div style={{ textAlign: "right" as const }}>
                    <div style={{ fontFamily: "var(--font-syne),Lato,sans-serif", fontSize: "32px", fontWeight: 800, color: "#0D1C3A", lineHeight: 1 }}>{feat.stat}</div>
                    <div style={{ fontFamily: "var(--font-dm-mono),Lato,sans-serif", fontSize: "10px", color: "#A0AABB", letterSpacing: "0.06em", marginTop: 4 }}>{feat.statLabel.toUpperCase()}</div>
                  </div>
                </div>
                {/* Feature h3 — DM Sans, clean and clinical */}
                <h3 style={{ fontFamily: "var(--font-dm-sans),Lato,sans-serif", fontSize: "22px", fontWeight: 600, color: "#0D1C3A", letterSpacing: "-0.3px", marginBottom: 12 }}>{feat.title}</h3>
                <p style={{ fontFamily: "var(--font-dm-sans),Lato,sans-serif", fontSize: "15px", color: "#6A7590", lineHeight: 1.75, maxWidth: "600px" }}>{feat.desc}</p>
                <div style={{ marginTop: 28, paddingTop: 20, borderTop: "0.5px solid #E8EBF2", display: "flex", alignItems: "center", gap: 16 }}>
                  <Link href={feat.id === "compare" ? "/compare" : "/signup"} style={{ fontFamily: "var(--font-dm-sans),Lato,sans-serif", fontSize: "14px", fontWeight: 600, color: "#FFFFFF", textDecoration: "none", padding: "10px 20px", borderRadius: "6px", background: "#2E6BE6" }}>
                    {feat.id === "compare" ? "Open comparison" : "Try it free"}
                  </Link>
                  <span style={{ fontFamily: "var(--font-dm-mono),Lato,sans-serif", fontSize: "10px", color: "#A0AABB", letterSpacing: "0.05em" }}>No credit card required</span>
                </div>
              </Card>
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" ref={stepsRef} style={{ background: "#FFFFFF", borderTop: "0.5px solid #E8EBF2", borderBottom: "0.5px solid #E8EBF2", padding: "88px 0" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 32px" }}>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={stepsInView ? { opacity: 1, y: 0 } : {}} transition={{ ...SPRING }}
            style={{ fontFamily: "var(--font-dm-mono),Lato,sans-serif", fontSize: "10px", letterSpacing: "0.12em", color: "#A0AABB", marginBottom: 14 }}>
            HOW IT WORKS
          </motion.div>
          <motion.h2 initial={{ opacity: 0, y: 10 }} animate={stepsInView ? { opacity: 1, y: 0 } : {}} transition={{ ...SPRING, delay: stagger(1) }}
            style={{ fontFamily: "var(--font-dm-sans),Lato,sans-serif", fontSize: "clamp(24px, 3vw, 38px)", fontWeight: 600, color: "#0D1C3A", letterSpacing: "-0.4px", lineHeight: 1.2, marginBottom: 48, maxWidth: "700px" }}>
            From messy PDF to structured intelligence in one upload.
          </motion.h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24 }}>
            {STEPS.map((s, i) => (
              <motion.div key={s.step} initial={{ opacity: 0, y: 16 }} animate={stepsInView ? { opacity: 1, y: 0 } : {}} transition={{ ...SPRING, delay: stagger(i + 1) }}>
                <Card style={{ padding: "28px", height: "100%" }}>
                  <div style={{ fontFamily: "var(--font-dm-mono),Lato,sans-serif", fontSize: "11px", fontWeight: 500, letterSpacing: "0.1em", color: "#2E6BE6", marginBottom: 16 }}>{s.step}</div>
                  <div style={{ width: 32, height: "2px", background: "#2E6BE6", borderRadius: 2, marginBottom: 16, opacity: 0.4 }} />
                  <h3 style={{ fontFamily: "var(--font-dm-sans),Lato,sans-serif", fontSize: "17px", fontWeight: 600, color: "#0D1C3A", letterSpacing: "-0.2px", marginBottom: 10 }}>{s.title}</h3>
                  <p style={{ fontFamily: "var(--font-dm-sans),Lato,sans-serif", fontSize: "14px", color: "#6A7590", lineHeight: 1.7 }}>{s.desc}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section ref={ctaRef} style={{ padding: "88px 32px", textAlign: "center" as const }}>
        <div style={{ maxWidth: 700, margin: "0 auto" }}>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={ctaInView ? { opacity: 1, y: 0 } : {}} transition={{ ...SPRING }} style={{ marginBottom: 16 }}>
            <span style={{ fontFamily: "var(--font-dm-mono),Lato,sans-serif", fontSize: "9px", letterSpacing: "0.12em", color: "#A0AABB", background: "#FFFFFF", borderWidth: "0.5px", borderStyle: "solid", borderColor: "#E8EBF2", padding: "3px 10px", borderRadius: "4px", display: "inline-block" }}>START FREE — NO CREDIT CARD</span>
          </motion.div>
          <motion.h2 initial={{ opacity: 0, y: 14 }} animate={ctaInView ? { opacity: 1, y: 0 } : {}} transition={{ ...SPRING, delay: stagger(1) }}
            style={{ fontFamily: "var(--font-dm-sans),Lato,sans-serif", fontSize: "clamp(26px, 3.5vw, 40px)", fontWeight: 600, color: "#0D1C3A", letterSpacing: "-0.5px", lineHeight: 1.2, marginBottom: 16 }}>
            Stop reading policy PDFs.<br />Start making decisions.
          </motion.h2>
          <motion.p initial={{ opacity: 0, y: 14 }} animate={ctaInView ? { opacity: 1, y: 0 } : {}} transition={{ ...SPRING, delay: stagger(2) }}
            style={{ fontFamily: "var(--font-dm-sans),Lato,sans-serif", fontSize: "16px", color: "#6A7590", lineHeight: 1.65, marginBottom: 36, maxWidth: "560px", margin: "0 auto 36px" }}>
            Join market access teams who use Anton Cx to stay ahead of payer policy changes across 48+ health plans.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 14 }} animate={ctaInView ? { opacity: 1, y: 0 } : {}} transition={{ ...SPRING, delay: stagger(3) }}
            style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" as const }}>
            <Link href="/signup" style={{ fontFamily: "var(--font-dm-sans),Lato,sans-serif", fontSize: "15px", fontWeight: 600, color: "#FFFFFF", textDecoration: "none", padding: "14px 32px", borderRadius: "8px", background: "#2E6BE6", display: "inline-block" }}>Create free account →</Link>
            <Link href="/login" style={{ fontFamily: "var(--font-dm-sans),Lato,sans-serif", fontSize: "15px", fontWeight: 500, color: "#6A7590", textDecoration: "none", padding: "14px 24px", borderRadius: "8px", borderWidth: "0.5px", borderStyle: "solid", borderColor: "#E8EBF2", background: "#FFFFFF", display: "inline-block" }}>Log in</Link>
          </motion.div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: "0.5px solid #E8EBF2", background: "#FFFFFF", padding: "24px 0" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 32px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" as const, gap: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 26, height: 26, borderRadius: "6px", background: "#1B3A6B", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontFamily: "var(--font-syne),Lato,sans-serif", fontSize: "10px", fontWeight: 800, color: "#FFFFFF" }}>Cx</span>
            </div>
            <span style={{ fontFamily: "var(--font-dm-sans),Lato,sans-serif", fontSize: "14px", fontWeight: 700, color: "#1B3A6B" }}>Anton Cx</span>
          </div>
          <span style={{ fontFamily: "var(--font-dm-mono),Lato,sans-serif", fontSize: "9px", color: "#A0AABB", letterSpacing: "0.05em" }}>© 2026 ANTON RX LLC · MEDICAL BENEFIT DRUG POLICY INTELLIGENCE</span>
        </div>
      </footer>
    </div>
  );
}
