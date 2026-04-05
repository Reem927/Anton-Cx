"use client";

import { motion } from "framer-motion";

interface CompareToolbarProps {
  drugs: string[];
  selectedDrug: string;
  onDrugChange: (d: string) => void;
  selectedPayers: string[];
  onPayerToggle: (p: string) => void;
  diffsOnly: boolean;
  onDiffsOnlyToggle: () => void;
  splitView: boolean;
  onSplitViewToggle: () => void;
}

const ALL_PAYERS = [
  "aetna",
  "uhc",
  "cigna",
  "bcbs-tx",
  "humana",
  "elevance",
  "centene",
  "kaiser",
];

export function CompareToolbar({
  drugs,
  selectedDrug,
  onDrugChange,
  selectedPayers,
  onPayerToggle,
  diffsOnly,
  onDiffsOnlyToggle,
  splitView,
  onSplitViewToggle,
}: CompareToolbarProps) {
  return (
    <div
      className="rounded-lg p-4 mb-5"
      style={{
        background: "#FFFFFF",
        borderWidth: "0.5px",
        borderStyle: "solid",
        borderColor: "#E8EBF2",
      }}
    >
      <div className="flex items-center gap-5 flex-wrap">
        <div className="flex items-center gap-2">
          <span
            style={{
              fontFamily: "var(--font-dm-mono), 'DM Mono', monospace",
              fontSize: "9px",
              color: "#A0AABB",
              letterSpacing: "0.08em",
            }}
          >
            DRUG
          </span>
          <select
            value={selectedDrug}
            onChange={(e) => onDrugChange(e.target.value)}
            className="rounded px-3 py-[7px]"
            style={{
              fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
              fontSize: "13px",
              color: "#0D1C3A",
              background: "#FFFFFF",
              borderWidth: "0.5px",
              borderStyle: "solid",
              borderColor: "#E8EBF2",
              cursor: "pointer",
              outline: "none",
              minWidth: "160px",
            }}
          >
            {drugs.map((drug) => (
              <option key={drug} value={drug}>
                {drug}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-start gap-2 flex-wrap">
          <span
            style={{
              fontFamily: "var(--font-dm-mono), 'DM Mono', monospace",
              fontSize: "9px",
              color: "#A0AABB",
              letterSpacing: "0.08em",
              paddingTop: "10px",
            }}
          >
            PAYERS
          </span>

          <div className="flex gap-2 flex-wrap">
            {ALL_PAYERS.map((payer) => {
              const active = selectedPayers.includes(payer);
              return (
                <motion.button
                  key={payer}
                  type="button"
                  onClick={() => onPayerToggle(payer)}
                  whileTap={{ scale: 0.97 }}
                  className="rounded px-3 py-[7px] transition-colors"
                  style={{
                    fontFamily: "var(--font-dm-mono), 'DM Mono', monospace",
                    fontSize: "10px",
                    fontWeight: 500,
                    letterSpacing: "0.06em",
                    background: active ? "#EBF0FC" : "#F7F8FC",
                    color: active ? "#1B3A6B" : "#6A7590",
                    borderWidth: "0.5px",
                    borderStyle: "solid",
                    borderColor: active ? "#C4D4F8" : "#E8EBF2",
                    cursor: "pointer",
                  }}
                >
                  {payer.toUpperCase()}
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3 flex-wrap">
        <ToggleButton
          active={diffsOnly}
          label="DIFFS ONLY"
          onClick={onDiffsOnlyToggle}
        />
        <ToggleButton
          active={splitView}
          label="SPLIT VIEW"
          onClick={onSplitViewToggle}
        />
      </div>
    </div>
  );
}

function ToggleButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-2 rounded px-3 py-[7px] transition-colors"
      style={{
        fontFamily: "var(--font-dm-mono), 'DM Mono', monospace",
        fontSize: "10px",
        fontWeight: 500,
        letterSpacing: "0.06em",
        background: active ? "#EBF0FC" : "#FFFFFF",
        color: active ? "#1B3A6B" : "#6A7590",
        borderWidth: "0.5px",
        borderStyle: "solid",
        borderColor: active ? "#C4D4F8" : "#E8EBF2",
        cursor: "pointer",
      }}
    >
      <span
        style={{
          width: "10px",
          height: "10px",
          borderRadius: "2px",
          background: active ? "#2E6BE6" : "#FFFFFF",
          borderWidth: "0.5px",
          borderStyle: "solid",
          borderColor: active ? "#2E6BE6" : "#D0D6E8",
          display: "inline-block",
          flexShrink: 0,
        }}
      />
      {label}
    </button>
  );
}