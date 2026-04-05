"use client";

import { useState, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { DEMO_PAYERS } from "./constants";
import type { IngestionStage } from "./IngestionProgress";
import { IngestionProgress } from "./IngestionProgress";

interface FetchByDrugProps {
  onStageChange?: (stage: IngestionStage) => void;
}

export function FetchByDrug({ onStageChange }: FetchByDrugProps) {
  const [drugQuery, setDrugQuery] = useState("");
  const [payerSearch, setPayerSearch] = useState("");
  const [selectedPayers, setSelectedPayers] = useState<string[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [stage, setStage] = useState<IngestionStage>("idle");
  const [error, setError] = useState("");
  const [addedCount, setAddedCount] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useGSAP(() => {
    if (!containerRef.current) return;
    gsap.fromTo(
      containerRef.current.querySelectorAll(".fetch-field"),
      { opacity: 0, y: 8 },
      { opacity: 1, y: 0, duration: 0.2, stagger: 0.04, ease: "power2.out" }
    );
  }, { scope: containerRef });

  // Filter payers by search, exclude already selected
  const filteredPayers = useMemo(() => {
    const q = payerSearch.toLowerCase();
    return DEMO_PAYERS.filter(
      (p) => !selectedPayers.includes(p) && p.toLowerCase().includes(q)
    );
  }, [payerSearch, selectedPayers]);

  const updateStage = (s: IngestionStage) => {
    setStage(s);
    onStageChange?.(s);
  };

  const addPayer = (payer: string) => {
    setSelectedPayers((prev) => [...prev, payer]);
    setPayerSearch("");
    setDropdownOpen(false);
    inputRef.current?.focus();
  };

  const removePayer = (payer: string) => {
    setSelectedPayers((prev) => prev.filter((p) => p !== payer));
  };

  const selectAll = () => {
    setSelectedPayers([...DEMO_PAYERS]);
    setPayerSearch("");
    setDropdownOpen(false);
  };

  const handleFetch = async () => {
    if (!drugQuery.trim() || selectedPayers.length === 0) return;

    setError("");
    setAddedCount(0);
    updateStage("fetching");

    const isHcpcs = /^[JjCc]\d{4}$/.test(drugQuery.trim());
    let totalAdded = 0;
    const errors: string[] = [];

    try {
      await delay(300);
      updateStage("extracting");

      // Fire requests for each selected payer
      for (const payer of selectedPayers) {
        try {
          const res = await fetch("/api/ingest", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              source: "auto_fetch",
              drug_name: isHcpcs ? undefined : drugQuery.trim(),
              hcpcs_code: isHcpcs ? drugQuery.trim().toUpperCase() : undefined,
              payer_name: payer,
            }),
          });

          if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            errors.push(`${payer}: ${data.error ?? res.status}`);
            continue;
          }

          const data = await res.json();
          const count = (data.medical_policy ? 1 : 0) + (data.pharmacy_policy ? 1 : 0);
          totalAdded += count;
          setAddedCount(totalAdded);
        } catch (err) {
          errors.push(`${payer}: ${err instanceof Error ? err.message : "failed"}`);
        }
      }

      updateStage("saving");
      await delay(400);

      if (totalAdded > 0) {
        updateStage("success");
      } else {
        setError(errors.length > 0 ? errors.join("; ") : "No policies found");
        updateStage("error");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fetch failed");
      updateStage("error");
    }
  };

  const canSubmit =
    drugQuery.trim() &&
    selectedPayers.length > 0 &&
    (stage === "idle" || stage === "success" || stage === "error");

  return (
    <div ref={containerRef}>
      {/* Drug name / HCPCS input */}
      <div className="fetch-field mb-4">
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
          Drug Name or HCPCS Code
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
          <DrugIcon />
          <input
            type="text"
            value={drugQuery}
            onChange={(e) => setDrugQuery(e.target.value)}
            placeholder="e.g. Keytruda, Pembrolizumab, or J9271"
            className="flex-1 bg-transparent outline-none"
            style={{
              fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
              fontSize: "14px",
              color: "#0D1C3A",
            }}
          />
          {drugQuery && (
            <button
              type="button"
              onClick={() => setDrugQuery("")}
              style={{ color: "#A0AABB", cursor: "pointer", fontSize: 18, lineHeight: 1 }}
            >
              x
            </button>
          )}
        </div>
      </div>

      {/* Payer multi-select search */}
      <div className="fetch-field mb-2 relative" ref={dropdownRef} style={{ zIndex: dropdownOpen ? 40 : undefined }}>
        <div className="flex items-center justify-between mb-[6px]">
          <label
            style={{
              fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
              fontSize: "12px",
              fontWeight: 500,
              color: "#6A7590",
            }}
          >
            Search and Select Payers
          </label>
          {selectedPayers.length < DEMO_PAYERS.length && (
            <button
              type="button"
              onClick={selectAll}
              style={{
                fontFamily: "var(--font-dm-mono), 'DM Mono', monospace",
                fontSize: "10px",
                color: "#2E6BE6",
                background: "none",
                border: "none",
                cursor: "pointer",
                letterSpacing: "0.04em",
              }}
            >
              SELECT ALL
            </button>
          )}
        </div>

        {/* Search input */}
        <div
          className="flex items-center gap-3 rounded-lg px-4"
          style={{
            background: "#FFFFFF",
            borderWidth: "0.5px",
            borderStyle: "solid",
            borderColor: dropdownOpen ? "#C4D4F8" : "#E8EBF2",
            height: 44,
            transition: "border-color 0.1s",
          }}
        >
          <PayerIcon />
          <input
            ref={inputRef}
            type="text"
            value={payerSearch}
            onChange={(e) => {
              const val = e.target.value;
              setPayerSearch(val);
              setDropdownOpen(val.trim().length > 0);
            }}
            onFocus={() => { if (payerSearch.trim()) setDropdownOpen(true); }}
            placeholder={
              selectedPayers.length > 0
                ? "Add another payer..."
                : "e.g. UnitedHealthcare"
            }
            className="flex-1 bg-transparent outline-none"
            style={{
              fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
              fontSize: "14px",
              color: "#0D1C3A",
            }}
          />
          {selectedPayers.length > 0 && (
            <span
              style={{
                fontFamily: "var(--font-dm-mono), 'DM Mono', monospace",
                fontSize: "10px",
                color: "#1B3A6B",
                background: "#EBF0FC",
                borderRadius: 4,
                padding: "2px 6px",
                whiteSpace: "nowrap",
              }}
            >
              {selectedPayers.length} SELECTED
            </span>
          )}
        </div>

        {/* Dropdown */}
        <AnimatePresence>
          {dropdownOpen && payerSearch.trim().length > 0 && filteredPayers.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.12 }}
              className="absolute left-0 right-0 z-30 rounded-lg overflow-hidden"
              style={{
                top: "100%",
                marginTop: 4,
                background: "#FFFFFF",
                borderWidth: "0.5px",
                borderStyle: "solid",
                borderColor: "#E8EBF2",
                boxShadow: "0 4px 16px rgba(13, 28, 58, 0.08)",
                maxHeight: 220,
                overflowY: "auto",
              }}
            >
              {filteredPayers.map((payer) => (
                <button
                  key={payer}
                  type="button"
                  onClick={() => addPayer(payer)}
                  className="w-full text-left px-4 py-[10px]"
                  style={{
                    fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
                    fontSize: "13px",
                    color: "#0D1C3A",
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    transition: "background 80ms",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#F3F5FA")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  {payer}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Click-away to close dropdown */}
        {dropdownOpen && (
          <div
            className="fixed inset-0 z-10"
            onClick={() => setDropdownOpen(false)}
          />
        )}
      </div>

      {/* Selected payer chips */}
      <div className="fetch-field mb-6">
        <AnimatePresence>
          {selectedPayers.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-wrap gap-[6px] mt-2"
            >
              {selectedPayers.map((payer) => (
                <motion.span
                  key={payer}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  className="inline-flex items-center gap-[5px] rounded px-[8px] py-[4px]"
                  style={{
                    fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
                    fontSize: "12px",
                    fontWeight: 500,
                    color: "#1B3A6B",
                    background: "#EBF0FC",
                    borderWidth: "0.5px",
                    borderStyle: "solid",
                    borderColor: "#C4D4F8",
                  }}
                >
                  {payer}
                  <button
                    type="button"
                    onClick={() => removePayer(payer)}
                    style={{
                      color: "#6A7590",
                      cursor: "pointer",
                      fontSize: 13,
                      lineHeight: 1,
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    x
                  </button>
                </motion.span>
              ))}

              {/* Clear all */}
              {selectedPayers.length > 1 && (
                <button
                  type="button"
                  onClick={() => setSelectedPayers([])}
                  className="inline-flex items-center rounded px-[8px] py-[4px]"
                  style={{
                    fontFamily: "var(--font-dm-mono), 'DM Mono', monospace",
                    fontSize: "10px",
                    color: "#6A7590",
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    letterSpacing: "0.04em",
                  }}
                >
                  CLEAR ALL
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Fetch button + policy count */}
      <div className="fetch-field flex items-center gap-4">
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
            opacity: !canSubmit && stage !== "idle" && stage !== "success" && stage !== "error" ? 0.6 : 1,
          }}
        >
          Fetch All Policies
        </motion.button>

        {addedCount > 0 && (
          <motion.span
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            style={{
              fontFamily: "var(--font-dm-mono), 'DM Mono', monospace",
              fontSize: "11px",
              color: "#0F7A40",
              background: "#EDFAF3",
              borderWidth: "0.5px",
              borderStyle: "solid",
              borderColor: "#B8EDD0",
              borderRadius: 4,
              padding: "3px 8px",
            }}
          >
            {addedCount} {addedCount === 1 ? "POLICY" : "POLICIES"} ADDED
          </motion.span>
        )}

        {selectedPayers.length > 0 && stage === "idle" && (
          <span
            style={{
              fontFamily: "var(--font-dm-mono), 'DM Mono', monospace",
              fontSize: "10px",
              color: "#6A7590",
              letterSpacing: "0.04em",
            }}
          >
            {selectedPayers.length} {selectedPayers.length === 1 ? "PAYER" : "PAYERS"}
          </span>
        )}
      </div>

      <IngestionProgress
        stage={stage}
        error={error}
        policyCount={addedCount}
        onDismiss={() => updateStage("idle")}
      />
    </div>
  );
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function DrugIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0">
      <rect x="4" y="1" width="8" height="14" rx="4" stroke="#A0AABB" strokeWidth="1.25" />
      <path d="M4 8h8" stroke="#A0AABB" strokeWidth="1.25" />
    </svg>
  );
}

function PayerIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0">
      <rect x="2" y="3" width="12" height="10" rx="1.5" stroke="#A0AABB" strokeWidth="1.25" />
      <path d="M2 6h12" stroke="#A0AABB" strokeWidth="1.25" />
    </svg>
  );
}
