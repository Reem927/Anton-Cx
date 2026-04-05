"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import type { IngestionStage } from "./IngestionProgress";
import { IngestionProgress } from "./IngestionProgress";

interface PasteURLProps {
  onStageChange?: (stage: IngestionStage) => void;
}

export function PasteURL({ onStageChange }: PasteURLProps) {
  const [url, setUrl] = useState("");
  const [stage, setStage] = useState<IngestionStage>("idle");
  const [error, setError] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!containerRef.current) return;
    gsap.fromTo(
      containerRef.current.querySelectorAll(".url-field"),
      { opacity: 0, y: 8 },
      { opacity: 1, y: 0, duration: 0.2, stagger: 0.04, ease: "power2.out" }
    );
  }, { scope: containerRef });

  const updateStage = (s: IngestionStage) => {
    setStage(s);
    onStageChange?.(s);
  };

  const handleFetch = async () => {
    if (!url.trim()) return;

    setError("");
    updateStage("fetching");

    try {
      await delay(300);
      updateStage("extracting");

      const res = await fetch("/api/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: "url_paste",
          url: url.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `Request failed (${res.status})`);
      }

      updateStage("saving");
      await delay(500);
      updateStage("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "URL fetch failed");
      updateStage("error");
    }
  };

  const canSubmit = url.trim() && (stage === "idle" || stage === "success" || stage === "error");

  return (
    <div ref={containerRef}>
      {/* URL input */}
      <div className="url-field mb-4">
        <label
          style={{
            fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
            fontSize: "12px",
            fontWeight: 500,
            color: "#6A7590",
            display: "block",
            marginBottom: 6,
          }}
        >
          Paste URL Link (any format — PDF, site, etc.)
        </label>
        <div
          className="flex items-center gap-3 rounded-lg px-4"
          style={{
            background: "#FFFFFF",
            borderWidth: "0.5px",
            borderStyle: "solid",
            borderColor: "#E8EBF2",
            height: 44,
            transition: "border-color 0.1s",
          }}
          onFocusCapture={(e) => (e.currentTarget.style.borderColor = "#C4D4F8")}
          onBlurCapture={(e) => (e.currentTarget.style.borderColor = "#E8EBF2")}
        >
          <LinkIcon />
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="e.g. https://www.uhcprovider.com/content/dam/provider/docs/public/policies/medadv-guidelines/k/keytruda.pdf"
            className="flex-1 bg-transparent outline-none"
            style={{
              fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
              fontSize: "14px",
              color: "#0D1C3A",
            }}
          />
          {url && (
            <button
              type="button"
              onClick={() => setUrl("")}
              style={{ color: "#A0AABB", cursor: "pointer", fontSize: 18, lineHeight: 1 }}
            >
              x
            </button>
          )}
        </div>
        <p
          style={{
            fontFamily: "var(--font-dm-mono), 'DM Mono', monospace",
            fontSize: "11px",
            color: "#A0AABB",
            margin: "6px 0 0",
          }}
        >
          Payer and plan type are extracted automatically from the document
        </p>
      </div>

      {/* Submit */}
      <div className="url-field">
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleFetch}
          disabled={!canSubmit}
          className="rounded-lg px-6 py-[10px]"
          style={{
            fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
            fontSize: "14px",
            fontWeight: 500,
            background: canSubmit ? "#2E6BE6" : "#C4D4F8",
            color: "#FFFFFF",
            border: "none",
            cursor: canSubmit ? "pointer" : "not-allowed",
          }}
        >
          Fetch & Extract Policy
        </motion.button>
      </div>

      <IngestionProgress
        stage={stage}
        error={error}
        onDismiss={() => updateStage("idle")}
      />
    </div>
  );
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function LinkIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0">
      <path d="M6.5 9.5l3-3" stroke="#A0AABB" strokeWidth="1.25" strokeLinecap="round" />
      <path d="M9 11l1.5-1.5a2.12 2.12 0 000-3L9.5 5.5a2.12 2.12 0 00-3 0L5 7" stroke="#A0AABB" strokeWidth="1.25" strokeLinecap="round" />
      <path d="M7 5L5.5 6.5a2.12 2.12 0 000 3L6.5 10.5a2.12 2.12 0 003 0L11 9" stroke="#A0AABB" strokeWidth="1.25" strokeLinecap="round" />
    </svg>
  );
}
