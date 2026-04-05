"use client";

import { motion } from "framer-motion";

interface CompareToolbarProps {
  drugs:        string[];
  selectedDrug: string;
  onDrugChange: (d: string) => void;
  payers:       string[];
  selectedPayers: string[];
  onPayerToggle: (p: string) => void;
  diffsOnly:    boolean;
  onDiffsOnlyToggle: () => void;
}

const ALL_PAYERS = ["aetna", "uhc", "cigna", "bcbs-tx", "humana", "elevance", "centene", "kaiser"];

export function CompareToolbar({
  drugs,
  selectedDrug,
  onDrugChange,
  selectedPayers,
  onPayerToggle,
  diffsOnly,
  onDiffsOnlyToggle,
}: CompareToolbarProps) {
  return (
    <div
      className="flex items-center gap-4 flex-wrap"
      style={{ marginBottom: "20px" }}
    >
      {/* Drug selector */}
      <div className="flex items-center gap-2">
        <span
          style={{
            fontFamily:    "var(--font-dm-mono), Lato, sans-serif",
            fontSize:      "9px",
            color:         "#A0AABB",
            letterSpacing: "0.08em",
          }}
        >
          DRUG
        </span>
        <select
          value={selectedDrug}
          onChange={(e) => onDrugChange(e.target.value)}
          className="rounded px-3 py-[5px]"
          style={{
            fontFamily:  "var(--font-dm-sans), Lato, sans-serif",
            fontSize:    "13px",
            color:       "#0D1C3A",
            background:  "#FFFFFF",
            borderWidth: "0.5px",
            borderStyle: "solid",
            borderColor: "#E8EBF2",
            cursor:      "pointer",
            outline:     "none",
          }}
        >
          {drugs.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
      </div>

      {/* Payer toggles */}
      <div className="flex items-center gap-2 flex-wrap">
        <span
          style={{
            fontFamily:    "var(--font-dm-mono), Lato, sans-serif",
            fontSize:      "9px",
            color:         "#A0AABB",
            letterSpacing: "0.08em",
          }}
        >
          PAYERS
        </span>
        {ALL_PAYERS.slice(0, 6).map((payer) => {
          const active = selectedPayers.includes(payer);
          return (
            <motion.button
              key={payer}
              onClick={() => onPayerToggle(payer)}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="rounded px-2 py-[3px] transition-colors"
              style={{
                fontFamily:    "var(--font-dm-mono), Lato, sans-serif",
                fontSize:      "9px",
                fontWeight:    500,
                letterSpacing: "0.06em",
                background:    active ? "#EBF0FC" : "#F7F8FC",
                color:         active ? "#1B3A6B" : "#A0AABB",
                borderWidth:   "0.5px",
                borderStyle:   "solid",
                borderColor:   active ? "#C4D4F8" : "#E8EBF2",
                cursor:        "pointer",
              }}
            >
              {payer.toUpperCase()}
            </motion.button>
          );
        })}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Diffs only toggle */}
      <button
        onClick={onDiffsOnlyToggle}
        className="flex items-center gap-2 rounded px-3 py-[5px] transition-colors"
        style={{
          fontFamily:    "var(--font-dm-mono), Lato, sans-serif",
          fontSize:      "10px",
          fontWeight:    500,
          letterSpacing: "0.06em",
          background:    diffsOnly ? "#EBF0FC" : "#FFFFFF",
          color:         diffsOnly ? "#1B3A6B" : "#6A7590",
          borderWidth:   "0.5px",
          borderStyle:   "solid",
          borderColor:   diffsOnly ? "#C4D4F8" : "#E8EBF2",
          cursor:        "pointer",
        }}
      >
        <span
          style={{
            width:      "10px",
            height:     "10px",
            borderRadius: "2px",
            background:  diffsOnly ? "#2E6BE6" : "#FFFFFF",
            borderWidth: "0.5px",
            borderStyle: "solid",
            borderColor: diffsOnly ? "#2E6BE6" : "#D0D6E8",
            display:     "inline-block",
            flexShrink:  0,
          }}
        />
        DIFFS ONLY
      </button>
    </div>
  );
}
