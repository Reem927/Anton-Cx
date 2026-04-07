"use client";

import { useMemo } from "react";
import { MetricCards } from "@/components/dashboard/MetricCards";
import { CoverageTable } from "@/components/dashboard/CoverageTable";
import { AlertFeed } from "@/components/dashboard/AlertFeed";
import type { Alert, AlertSeverity } from "@/components/dashboard/AlertFeed";
import { getPersonaConfig } from "@/lib/persona";
import { usePersona } from "@/lib/persona-context";
import { useCachedFetch } from "@/lib/hooks/use-cached-fetch";
import type { PolicyDocument } from "@/lib/types";

export default function DashboardPage() {
  const { persona } = usePersona();
  const config = getPersonaConfig(persona);

  const { data: policies, loading } = useCachedFetch<PolicyDocument[]>(
    "dashboard:policies",
    "/api/policies",
  );

  // Compute real metrics from policy data
  const metrics = policies
    ? {
        payersTracked:   new Set(policies.map(p => p.payer_id)).size,
        policiesIndexed: policies.length,
        changedThisQtr:  policies.filter(p => p.changed_fields.length > 0).length,
        paRequired:      policies.filter(p => p.prior_auth_required).length,
      }
    : {};

  // Generate real alerts from policies with changed_fields
  const alerts: Alert[] = useMemo(() => {
    if (!policies) return [];
    return policies
      .filter(p => p.changed_fields.length > 0)
      .sort((a, b) => new Date(b.extracted_at).getTime() - new Date(a.extracted_at).getTime())
      .slice(0, 10)
      .map((p, i) => {
        const severity: AlertSeverity =
          p.changed_fields.includes("coverage_status") ? "high" :
          p.changed_fields.includes("prior_auth_required") || p.changed_fields.includes("step_therapy") ? "medium" :
          "low";
        return {
          id:         `alert-${p.id ?? i}`,
          severity,
          drug_name:  p.drug_name,
          payer_id:   p.payer_id,
          message:    `Changed: ${p.changed_fields.join(", ")}`,
          created_at: p.extracted_at,
        };
      });
  }, [policies]);

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
        <MetricCards persona={persona} data={metrics} />
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
          <CoverageTable policies={policies ?? []} loading={loading} />
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
            <AlertFeed alerts={alerts} />
          </div>
        </div>
      </div>
    </div>
  );
}
