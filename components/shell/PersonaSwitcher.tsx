"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { Persona } from "@/lib/types";

interface PersonaSwitcherProps {
  current:  Persona;
  onChange: (p: Persona) => void;
}

const PERSONAS: { value: Persona; label: string }[] = [
  { value: "analyst", label: "ANALYST" },
  { value: "mfr",     label: "MFR" },
  { value: "plan",    label: "PLAN" },
];

export function PersonaSwitcher({ current, onChange }: PersonaSwitcherProps) {
  return (
    <div
      className="flex items-center gap-1 rounded-md p-[3px]"
      style={{
        background:  "#F7F8FC",
        borderWidth: "0.5px",
        borderStyle: "solid",
        borderColor: "#E8EBF2",
      }}
    >
      {PERSONAS.map((p) => {
        const isActive = p.value === current;
        return (
          <button
            key={p.value}
            onClick={() => onChange(p.value)}
            className="relative rounded px-3 py-1 transition-colors"
            style={{ outline: "none" }}
          >
            {isActive && (
              <motion.div
                layoutId="persona-badge"
                className="absolute inset-0 rounded"
                style={{ background: "#1B3A6B" }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            )}
            <motion.span
              animate={{
                color: isActive ? "#FFFFFF" : "#6A7590",
                scale: isActive ? [0.9, 1.05, 1] : 1,
              }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="relative z-10"
              style={{
                fontFamily:    "var(--font-dm-mono), 'DM Mono', monospace",
                fontSize:      "10px",
                fontWeight:    500,
                letterSpacing: "0.07em",
                display:       "block",
              }}
            >
              {p.label}
            </motion.span>
          </button>
        );
      })}
    </div>
  );
}
