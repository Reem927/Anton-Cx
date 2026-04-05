"use client";

import { useState, useMemo } from "react";
import { SearchHero } from "@/components/search/SearchHero";
import { PolicyResultCard } from "@/components/search/PolicyResultCard";
import { usePersona } from "@/lib/persona-context";
import { getPersonaConfig } from "@/lib/persona";
import { SEED_POLICIES } from "@/lib/seed-data";

export default function SearchPage() {
  const { persona }          = usePersona();
  const config               = getPersonaConfig(persona);
  const [query, setQuery]    = useState("");
  const [filter, setFilter]  = useState(config.filters[0]);

  const results = useMemo(() => {
    let list = SEED_POLICIES;

    if (query) {
      const q = query.toLowerCase();
      list = list.filter(
        (p) =>
          p.drug_name.toLowerCase().includes(q) ||
          p.drug_generic.toLowerCase().includes(q) ||
          p.j_code.toLowerCase().includes(q) ||
          p.payer_id.toLowerCase().includes(q)
      );
    }

    // Apply filter
    if (filter === "PA required") {
      list = list.filter((p) => p.prior_auth_required);
    } else if (filter === "Changed this qtr") {
      list = list.filter((p) => p.changed_fields.length > 0);
    } else if (filter === "Denied") {
      list = list.filter((p) => p.coverage_status === "not_covered");
    } else if (filter === "Open access") {
      list = list.filter((p) => p.coverage_status === "covered");
    } else if (filter === "Restricted") {
      list = list.filter((p) => p.coverage_status !== "covered");
    } else if (filter === "My policy only") {
      list = list.filter((p) => p.payer_id === "bcbs-tx");
    } else if (filter === "Outliers" || filter === "More restrictive") {
      list = list.filter((p) => p.coverage_status === "not_covered");
    } else if (filter === "More permissive") {
      list = list.filter((p) => p.coverage_status === "covered");
    } else if (filter === "Changed") {
      list = list.filter((p) => p.changed_fields.length > 0);
    }

    return list;
  }, [query, filter]);

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
          Policy Search
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

      <div className="mb-6">
        <SearchHero
          persona={persona}
          onSearch={setQuery}
          activeFilter={filter}
          onFilter={setFilter}
        />
      </div>

      {/* Results count */}
      <div
        className="mb-3"
        style={{
          fontFamily:    "var(--font-dm-mono), 'DM Mono', monospace",
          fontSize:      "10px",
          color:         "#A0AABB",
          letterSpacing: "0.06em",
        }}
      >
        {results.length} {results.length === 1 ? "POLICY" : "POLICIES"} FOUND
      </div>

      {/* Results */}
      <div className="flex flex-col gap-2">
        {results.map((policy, i) => (
          <PolicyResultCard key={policy.id} policy={policy} index={i} />
        ))}
        {results.length === 0 && (
          <div
            className="py-12 text-center"
            style={{
              fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
              fontSize:   "14px",
              color:      "#A0AABB",
            }}
          >
            No policies match your search.
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 mt-6">
        {config.actions.map((action) => (
          <button
            key={action}
            className="rounded px-4 py-2 transition-colors"
            style={{
              fontFamily:    "var(--font-dm-sans), 'DM Sans', sans-serif",
              fontSize:      "13px",
              fontWeight:    500,
              background:    action === config.actions[0] ? "#2E6BE6" : "#FFFFFF",
              color:         action === config.actions[0] ? "#FFFFFF" : "#6A7590",
              borderWidth:   "0.5px",
              borderStyle:   "solid",
              borderColor:   action === config.actions[0] ? "#2E6BE6" : "#E8EBF2",
              cursor:        "pointer",
            }}
          >
            {action}
          </button>
        ))}
      </div>
    </div>
  );
}
