"use client";

import { useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import type { IngestionStage } from "./IngestionProgress";
import { IngestionProgress } from "./IngestionProgress";

interface UploadPDFProps {
  onStageChange?: (stage: IngestionStage) => void;
}

export function UploadPDF({ onStageChange }: UploadPDFProps) {
  const [file, setFile] = useState<File | null>(null);
  const [stage, setStage] = useState<IngestionStage>("idle");
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!containerRef.current) return;
    gsap.fromTo(
      containerRef.current.querySelectorAll(".upload-field"),
      { opacity: 0, y: 8 },
      { opacity: 1, y: 0, duration: 0.2, stagger: 0.04, ease: "power2.out" }
    );
  }, { scope: containerRef });

  const updateStage = (s: IngestionStage) => {
    setStage(s);
    onStageChange?.(s);
  };

  const handleFile = useCallback((f: File) => {
    if (f.type !== "application/pdf") return;
    setFile(f);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const f = e.dataTransfer.files[0];
      if (f) handleFile(f);
    },
    [handleFile]
  );

  const handleExtract = async () => {
    if (!file) return;

    setError("");
    updateStage("fetching");

    try {
      const base64 = await fileToBase64(file);

      updateStage("extracting");

      const res = await fetch("/api/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: "pdf_upload",
          pdf_base64: base64,
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
      setError(err instanceof Error ? err.message : "Upload failed");
      updateStage("error");
    }
  };

  const canSubmit = file && (stage === "idle" || stage === "success" || stage === "error");

  return (
    <div ref={containerRef}>
      {/* Drop zone */}
      <div
        className="upload-field rounded-lg mb-5"
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        style={{
          padding: "32px 24px",
          background: dragging ? "#EBF0FC" : "#F7F8FC",
          borderWidth: dragging ? "1.5px" : "0.5px",
          borderStyle: "dashed",
          borderColor: dragging ? "#2E6BE6" : "#D0D6E8",
          borderRadius: 8,
          cursor: "pointer",
          textAlign: "center",
          transition: "border-color 0.1s, background 0.1s",
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
        />

        <div className="flex flex-col items-center gap-2">
          <div
            className="flex items-center justify-center rounded-full"
            style={{
              width: 40,
              height: 40,
              background: dragging ? "#C4D4F8" : "#E8EBF2",
            }}
          >
            <UploadIcon active={dragging} />
          </div>

          {file ? (
            <div className="flex items-center gap-2">
              <PdfBadge />
              <span
                style={{
                  fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
                  fontSize: "14px",
                  fontWeight: 500,
                  color: "#0D1C3A",
                }}
              >
                {file.name}
              </span>
              <button
                onClick={(e) => { e.stopPropagation(); setFile(null); }}
                style={{ color: "#A0AABB", cursor: "pointer", fontSize: 16, lineHeight: 1, marginLeft: 4 }}
              >
                x
              </button>
            </div>
          ) : (
            <>
              <p
                style={{
                  fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
                  fontSize: "14px",
                  fontWeight: 500,
                  color: "#0D1C3A",
                  margin: 0,
                }}
              >
                Drop PDF here or{" "}
                <span style={{ color: "#2E6BE6" }}>browse files</span>
              </p>
              <p
                style={{
                  fontFamily: "var(--font-dm-mono), 'DM Mono', monospace",
                  fontSize: "11px",
                  color: "#A0AABB",
                  margin: 0,
                }}
              >
                PDF format only · Payer and plan type are extracted automatically
              </p>
            </>
          )}
        </div>
      </div>

      {/* Submit */}
      <div className="upload-field">
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleExtract}
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
          Extract Policy
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

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function UploadIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M10 14V4" stroke={active ? "#2E6BE6" : "#6A7590"} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M6 8l4-4 4 4" stroke={active ? "#2E6BE6" : "#6A7590"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3 17h14" stroke={active ? "#2E6BE6" : "#6A7590"} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function PdfBadge() {
  return (
    <span
      style={{
        fontFamily: "var(--font-dm-mono), 'DM Mono', monospace",
        fontSize: "9px",
        fontWeight: 500,
        color: "#B02020",
        background: "#FEE8E8",
        borderRadius: 3,
        padding: "2px 5px",
        letterSpacing: "0.04em",
      }}
    >
      PDF
    </span>
  );
}
