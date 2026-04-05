"use client";

import { MetricCards } from "@/components/dashboard/MetricCards";
import { CoverageTable } from "@/components/dashboard/CoverageTable";
import { AlertFeed } from "@/components/dashboard/AlertFeed";
import { getPersonaConfig } from "@/lib/persona";
import { usePersona } from "@/lib/persona-context";
import { SEED_POLICIES } from "@/lib/seed-data";

export default function DashboardPage() {
  const { persona } = usePersona();
  const config = getPersonaConfig(persona);

  return (
    <div className="p-6">
      {/* Page header */}
      <div className="mb-6">
        <h1
          style={{
            fontFamily:   "var(--font-syne), Lato, sans-serif",
            fontSize:     "22px",
            fontWeight:   800,
            color:        "#0D1C3A",
            marginBottom: "4px",
          }}
        >
          Dashboard
        </h1>
        <p
          style={{
            fontFamily: "var(--font-dm-sans), Lato, sans-serif",
            fontSize:   "13px",
            color:      "#6A7590",
          }}
        >
          {config.bannerText}
        </p>
      </div>

      {/* Metric cards */}
      <div className="mb-6">
        <MetricCards persona={persona} data={{}} />
      </div>

      {/* Coverage table + alert feed */}
      <div className="grid gap-6" style={{ gridTemplateColumns: "1fr 360px" }}>
        <div>
          <h2
            style={{
              fontFamily:    "var(--font-dm-mono), Lato, sans-serif",
              fontSize:      "10px",
              fontWeight:    500,
              letterSpacing: "0.08em",
              color:         "#A0AABB",
              marginBottom:  "12px",
            }}
          >
            COVERAGE OVERVIEW
          </h2>
          <CoverageTable policies={SEED_POLICIES} />
        </div>

        <div>
          <h2
            style={{
              fontFamily:    "var(--font-dm-mono), Lato, sans-serif",
              fontSize:      "10px",
              fontWeight:    500,
              letterSpacing: "0.08em",
              color:         "#A0AABB",
              marginBottom:  "12px",
            }}
          >
            RECENT ALERTS
          </h2>
          <div
            className="rounded-lg p-4"
            style={{
              background:  "#FFFFFF",
              borderWidth: "0.5px",
              borderStyle: "solid",
              borderColor: "#E8EBF2",
            }}
          >
            <AlertFeed />
          </div>
        </div>
      </div>
    </div>
  );
}
