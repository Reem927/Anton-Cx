"use client";

import { useState } from "react";
import { CompareToolbar } from "@/components/compare/CompareToolbar";
import { DiffSummaryBar } from "@/components/compare/DiffSummaryBar";
import { CompareGrid } from "@/components/compare/CompareGrid";
import { usePersona } from "@/lib/persona-context";
import { getPersonaConfig } from "@/lib/persona";
import { SEED_POLICIES } from "@/lib/seed-data";

const DRUGS = ["Humira", "Keytruda", "Dupixent", "Stelara", "Enbrel"];
const DEFAULT_PAYERS = ["aetna", "uhc", "cigna", "bcbs-tx"];

export default function ComparePage() {
  const { persona }                     = usePersona();
  const config                          = getPersonaConfig(persona);
  const [selectedDrug, setSelectedDrug] = useState(DRUGS[0]);
  const [payers, setPayers]             = useState<string[]>(DEFAULT_PAYERS);
  const [diffsOnly, setDiffsOnly]       = useState(false);

  const togglePayer = (p: string) => {
    setPayers((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    );
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1
          style={{
            fontFamily:   "var(--font-syne), Syne, sans-serif",
            fontSize:     "22px",
            fontWeight:   800,
            color:        "#0D1C3A",
            marginBottom: "4px",
          }}
        >
          Comparison Engine
        </h1>
        <p
          style={{
            fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
            fontSize:   "13px",
            color:      "#6A7590",
          }}
        >
          {config.bannerText}
        </p>
      </div>

      <CompareToolbar
        drugs={DRUGS}
        selectedDrug={selectedDrug}
        onDrugChange={setSelectedDrug}
        payers={payers}
        selectedPayers={payers}
        onPayerToggle={togglePayer}
        diffsOnly={diffsOnly}
        onDiffsOnlyToggle={() => setDiffsOnly((v) => !v)}
      />

      <DiffSummaryBar
        policies={SEED_POLICIES}
        payers={payers}
        drug={selectedDrug}
      />

      <CompareGrid
        payers={payers}
        drug={selectedDrug}
        policies={SEED_POLICIES}
        config={config}
        diffsOnly={diffsOnly}
      />
    </div>
  );
}
