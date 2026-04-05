"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { FetchByDrug } from "@/components/ingestion/FetchByDrug";
import { UploadPDF } from "@/components/ingestion/UploadPDF";
import { PasteURL } from "@/components/ingestion/PasteURL";

const TABS = [
  { key: "fetch", label: "Fetch by Drug Name", icon: <SearchTabIcon /> },
  { key: "upload", label: "Upload PDF", icon: <UploadTabIcon /> },
  { key: "url", label: "Paste URL", icon: <LinkTabIcon /> },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default function IngestionPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("fetch");
  const headerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!headerRef.current) return;
    gsap.fromTo(
      headerRef.current.querySelectorAll(".header-el"),
      { opacity: 0, y: 10 },
      { opacity: 1, y: 0, duration: 0.25, stagger: 0.04, ease: "power2.out" }
    );
  }, { scope: headerRef });

  return (
    <div className="p-6" style={{ maxWidth: 680 }}>
      {/* Header */}
      <div ref={headerRef} className="mb-6">
        <h1
          className="header-el"
          style={{
            fontFamily: "var(--font-syne), Lato, sans-serif",
            fontSize: "22px",
            fontWeight: 800,
            color: "#0D1C3A",
            marginBottom: 4,
          }}
        >
          Policy Ingestion
        </h1>
        <p
          className="header-el"
          style={{
            fontFamily: "var(--font-dm-sans), Lato, sans-serif",
            fontSize: "13px",
            color: "#6A7590",
          }}
        >
          Fetch, upload, or paste policy documents to extract and add to your library.
        </p>
      </div>

      {/* Tab bar */}
      <div
        className="header-el flex rounded-lg mb-6 p-1 gap-1"
        style={{
          background: "#FFFFFF",
          borderWidth: "0.5px",
          borderStyle: "solid",
          borderColor: "#E8EBF2",
        }}
      >
        {TABS.map((tab) => {
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="relative flex-1 flex items-center justify-center gap-[6px] rounded-md py-[9px] px-3"
              style={{
                fontFamily: "var(--font-dm-sans), Lato, sans-serif",
                fontSize: "13px",
                fontWeight: active ? 500 : 400,
                color: active ? "#1B3A6B" : "#6A7590",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                zIndex: 1,
              }}
            >
              {active && (
                <motion.div
                  layoutId="tab-bg"
                  className="absolute inset-0 rounded-md"
                  style={{ background: "#EBF0FC", zIndex: -1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <span
                className="flex-shrink-0"
                style={{ color: active ? "#1B3A6B" : "#A0AABB", display: "flex" }}
              >
                {tab.icon}
              </span>
              <span className="hidden sm:inline">{tab.label}</span>
              {/* Mobile: short labels */}
              <span className="sm:hidden">
                {tab.key === "fetch" ? "Fetch" : tab.key === "upload" ? "Upload" : "URL"}
              </span>
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div
        className="rounded-lg p-6"
        style={{
          background: "#FFFFFF",
          borderWidth: "0.5px",
          borderStyle: "solid",
          borderColor: "#E8EBF2",
        }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
          >
            {activeTab === "fetch" && <FetchByDrug />}
            {activeTab === "upload" && <UploadPDF />}
            {activeTab === "url" && <PasteURL />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

// ── Tab icons (14x14) ──────────────────────────────────────────────

function SearchTabIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <circle cx="6" cy="6" r="4.25" stroke="currentColor" strokeWidth="1.25" />
      <path d="M9.5 9.5L12.5 12.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
    </svg>
  );
}

function UploadTabIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M7 10V3" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
      <path d="M4 6l3-3 3 3" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M2 12h10" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
    </svg>
  );
}

function LinkTabIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M5.5 8.5l3-3" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
      <path d="M8 10l1.25-1.25a1.77 1.77 0 000-2.5L8.25 5.25a1.77 1.77 0 00-2.5 0L4.5 6.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
      <path d="M6 4l-1.25 1.25a1.77 1.77 0 000 2.5l1 1a1.77 1.77 0 002.5 0L9.5 7.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
    </svg>
  );
}
