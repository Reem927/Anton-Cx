"use client";

import { useMemo, useState } from "react";
import type { CSSProperties } from "react";
import {
  BarChart3,
  Building2,
  ExternalLink,
  FileJson,
  Plus,
  Search,
  Sparkles,
} from "lucide-react";

type CoverageState = "Covered" | "Not Covered" | "No Policy Found" | "Pharmacy Only";
type ViewMode = "table" | "split";
type MetricTab = "price" | "copay" | "quantity";

interface CriteriaItem {
  status: string;
  note?: string;
}

interface CriteriaSet {
  coverageState: CoverageState;
  priorAuthorization: CriteriaItem;
  stepTherapy: CriteriaItem;
  quantityLimit: string;
  ageRestriction: string;
  diagnosisRequirement: string;
  specialtyPharmacy: CriteriaItem;
  mailOrderAvailable: CriteriaItem;
  authorizationRenewal: string;
}

interface CompareRow {
  id: string;
  payerId: string;
  company: string;
  drugBrand: string;
  drugGeneric: string;
  category: string;
  plan: string;
  policyType: string;
  coverage: CoverageState;
  access: string;
  ranking: string;
  rankDetail: string;
  competingDrugs: string[];
  rebateImplication: string;
  price: number | null;
  copay: number | null;
  quantity: number | string | null;
  policyTitle: string;
  policyEffective: string | null;
  policyLinkLabel: string;
  summary: string;
  relatedProducts: string[];
  criteria: CriteriaSet;
  medicalPolicyId: string | null;
  pharmacyPolicyId: string | null;
  medicalPolicyExists: boolean;
  pharmacyPolicyExists: boolean;
  sourceUrl: string | null;
  policyJson: Record<string, unknown>;
}

interface DrugMeta {
  brand: string;
  generic: string;
  type: string;
  category: string;
  therapeuticArea: string;
  relatedProducts: string[];
  policyHint: string;
}

const KNOWN_COMPANIES = [
  "UnitedHealthcare",
  "Cigna",
  "EmblemHealth",
  "UPMC Health Plan",
  "Priority Health",
  "Blue Cross Blue Shield of North Carolina",
  "Florida Blue",
  "Aetna",
  "Anthem",
  "Blue Cross Blue Shield",
  "Centene",
  "Humana",
  "Kaiser Permanente",
];

const DRUG_META: Record<string, DrugMeta> = {
  humira: {
    brand: "Humira",
    generic: "adalimumab",
    type: "Reference Biologic",
    category: "Immunology - Autoimmune Drugs",
    therapeuticArea: "Immunology",
    relatedProducts: ["Amjevita", "Hyrimoz", "Hadlima", "Cyltezo"],
    policyHint:
      "Some payers group the reference biologic and biosimilars together, while others separate them or use biosimilar-first step therapy.",
  },
  keytruda: {
    brand: "Keytruda",
    generic: "pembrolizumab",
    type: "Biologic",
    category: "Oncology - Cancer Drugs",
    therapeuticArea: "Oncology",
    relatedProducts: [],
    policyHint:
      "Policies are usually indication-specific and depend on tumor type, line of therapy, and biomarker requirements.",
  },
  dupixent: {
    brand: "Dupixent",
    generic: "dupilumab",
    type: "Biologic",
    category: "Immunology - Inflammatory Drugs",
    therapeuticArea: "Immunology",
    relatedProducts: [],
    policyHint:
      "Usually appears as a standalone biologic policy with prior authorization and disease-specific criteria.",
  },
  stelara: {
    brand: "Stelara",
    generic: "ustekinumab",
    type: "Reference Biologic",
    category: "Immunology - Autoimmune Drugs",
    therapeuticArea: "Immunology",
    relatedProducts: ["Wezlana"],
    policyHint:
      "May be handled as reference-biologic coverage with competing biosimilar placement depending on payer policy structure.",
  },
};

export default function ComparePage() {
  const [drugInput, setDrugInput] = useState("");
  const [searchAllCompanies, setSearchAllCompanies] = useState(false);
  const [companyInput, setCompanyInput] = useState("");
  const [manualCompanies, setManualCompanies] = useState<string[]>([
    "Cigna",
    "UnitedHealthcare",
    "EmblemHealth",
  ]);
  const [searchResults, setSearchResults] = useState<CompareRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedPolicyJson, setSelectedPolicyJson] = useState<Record<string, unknown> | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [metricTab, setMetricTab] = useState<MetricTab>("price");
  const [splitCompanyLeft, setSplitCompanyLeft] = useState("");
  const [splitCompanyRight, setSplitCompanyRight] = useState("");
  const [aiSummary, setAiSummary] = useState("");
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [showAiSummary, setShowAiSummary] = useState(false);

  const normalizedDrugInput = drugInput.trim().toLowerCase();
  const liveDrugMeta = normalizedDrugInput ? DRUG_META[normalizedDrugInput] : null;

  const sortedRows = useMemo(() => {
    return [...searchResults].sort((a, b) => a.company.localeCompare(b.company));
  }, [searchResults]);

  const splitLeftRow = sortedRows.find((row) => row.company === splitCompanyLeft) ?? null;
  const splitRightRow = sortedRows.find((row) => row.company === splitCompanyRight) ?? null;

  const canCompare =
    normalizedDrugInput.length > 0 &&
    (searchAllCompanies || manualCompanies.length > 0);

  const handleAddCompany = () => {
    const next = cleanCompanyInput(companyInput);
    if (!next) return;

    const alreadyExists = manualCompanies.some(
      (company) => normalizeCompanyName(company) === normalizeCompanyName(next)
    );

    if (!alreadyExists) {
      setManualCompanies((prev) => [...prev, next]);
    }

    setCompanyInput("");
  };

  const handleRemoveCompany = (company: string) => {
    setManualCompanies((prev) => prev.filter((item) => item !== company));
  };

  const handleCompare = async () => {
    if (!canCompare) return;

    setIsLoading(true);
    setHasSearched(false);
    setShowAiSummary(false);
    setAiSummary("");
    setSearchResults([]);
    setErrorMessage("");

    try {
      const payerIds = searchAllCompanies
        ? ""
        : manualCompanies
            .map((company) => normalizeCompanyName(company))
            .map(mapCompanyToPayerId)
            .filter(Boolean)
            .join(",");

      const qs = new URLSearchParams({
        drug_name: drugInput.trim(),
        all_companies: String(searchAllCompanies),
      });

      if (payerIds) {
        qs.set("payer_ids", payerIds);
      }

      const response = await fetch(`/api/compare?${qs.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch comparison data");

      const data = (await response.json()) as CompareRow[];

      setSearchResults(data);
      setHasSearched(true);

      if (data.length > 0) {
        setSplitCompanyLeft(data[0]?.company ?? "");
        setSplitCompanyRight(data[1]?.company ?? data[0]?.company ?? "");
      }
    } catch (error) {
      console.error(error);
      setErrorMessage("Unable to load comparison results.");
      setHasSearched(true);
    } finally {
      setIsLoading(false);
    }
  };

  const generateLiveAiSummary = async () => {
    if (!splitLeftRow || !splitRightRow) return;

    setSummaryLoading(true);
    setAiSummary("");
    setShowAiSummary(true);

    try {
      const response = await fetch("/api/compare-summary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          drugName: splitLeftRow.drugBrand,
          rows: [splitLeftRow, splitRightRow],
        }),
      });

      if (!response.ok) throw new Error("Failed to generate summary");

      const data = await response.json();
      setAiSummary(data.summary ?? "");
    } catch (error) {
      console.error(error);
      setAiSummary("Unable to generate AI summary right now.");
    } finally {
      setSummaryLoading(false);
    }
  };

  const openPolicyPdf = (row: CompareRow) => {
    const source = row.medicalPolicyId ? "medical" : row.pharmacyPolicyId ? "pharmacy" : null;
    const policyId = row.medicalPolicyId ?? row.pharmacyPolicyId;

    if (!source || !policyId) return;

    window.open(`/api/generate-pdf?policy_id=${policyId}&source=${source}`, "_blank");
  };

  return (
    <div className="p-6">
      <div style={{ maxWidth: "1240px", margin: "0 auto" }}>
        <div className="mb-6">
          <h1 style={titleStyle}>Drug Policy Comparison</h1>
          <p style={subtitleStyle}>
            Compare drug coverage policies across healthcare organizations
          </p>
        </div>

        <div style={cardStyle} className="mb-6">
          <div className="mb-6">
            <div style={sectionTitleStyle}>Search Policies</div>
            <p style={sectionHintStyle}>
              Enter a drug name and select companies to compare, or search all companies at once
            </p>
          </div>

          <div className="mb-4">
            <label style={labelStyle}>Drug Name</label>
            <input
              value={drugInput}
              onChange={(event) => setDrugInput(event.target.value)}
              placeholder="Enter drug name (e.g., Humira, Keytruda, Dupixent)"
              style={inputStyle}
            />
          </div>

          {liveDrugMeta ? (
            <div style={contextCardStyle} className="mb-4">
              <div style={{ ...labelStyle, marginBottom: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
                <FileJson size={15} />
                Biosimilar / Biologic Context
              </div>

              <div
                className="grid gap-4"
                style={{ gridTemplateColumns: "repeat(2, minmax(0, 1fr))", marginBottom: "12px" }}
              >
                <InfoBlock label="Brand / Generic" value={`${liveDrugMeta.brand} / ${liveDrugMeta.generic}`} />
                <InfoBlock label="Type" value={liveDrugMeta.type} />
                <InfoBlock label="Drug Category" value={liveDrugMeta.category} />
                <InfoBlock label="Therapeutic Area" value={liveDrugMeta.therapeuticArea} />
              </div>

              <InfoBlock
                label="Related Products"
                value={liveDrugMeta.relatedProducts.length ? liveDrugMeta.relatedProducts.join(", ") : "None listed"}
              />
              <div style={{ height: 12 }} />
              <InfoBlock label="Policy Hint" value={liveDrugMeta.policyHint} />
            </div>
          ) : null}

          <div style={allCompaniesRowStyle} className="mb-4">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={searchAllCompanies}
                onChange={(event) => setSearchAllCompanies(event.target.checked)}
                style={{ marginTop: "4px" }}
              />
              <div>
                <div style={labelStyle}>Search All Companies</div>
                <div style={{ fontSize: "12px", color: "#6A7590" }}>
                  Compare policies from all available healthcare organizations
                </div>
              </div>
            </div>
            <Building2 size={18} color="#6A7590" />
          </div>

          {!searchAllCompanies ? (
            <>
              <div className="mb-3">
                <label style={labelStyle}>Select Companies</label>
                <div className="flex gap-3">
                  <input
                    value={companyInput}
                    onChange={(event) => setCompanyInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        handleAddCompany();
                      }
                    }}
                    placeholder="Add company name (e.g., Cigna, UHC)"
                    style={{ ...inputStyle, flex: 1 }}
                  />
                  <button type="button" onClick={handleAddCompany} style={iconButtonStyle}>
                    <Plus size={18} />
                  </button>
                </div>
              </div>

              {manualCompanies.length > 0 ? (
                <div className="flex flex-wrap gap-2 mb-4">
                  {manualCompanies.map((company) => (
                    <button
                      key={company}
                      type="button"
                      onClick={() => handleRemoveCompany(company)}
                      style={chipStyle}
                    >
                      {company}
                      <span style={{ fontSize: "11px" }}>×</span>
                    </button>
                  ))}
                </div>
              ) : null}
            </>
          ) : null}

          <button
            type="button"
            onClick={handleCompare}
            disabled={!canCompare || isLoading}
            style={{
              ...primaryButtonStyle,
              background: !canCompare || isLoading ? "#A7BEC7" : "#4E8091",
              cursor: !canCompare || isLoading ? "not-allowed" : "pointer",
            }}
          >
            <Search size={16} />
            {isLoading ? "Analyzing Policies..." : "Compare Policies"}
          </button>
        </div>

        {hasSearched ? (
          <>
            <div className="mb-4 flex items-center justify-between flex-wrap" style={{ gap: "12px" }}>
              <div>
                <div style={sectionTitleStyle}>
                  Results for "{liveDrugMeta?.brand ?? drugInput.trim()}"
                </div>
                <div style={{ fontSize: "13px", color: "#6A7590" }}>
                  {sortedRows.length} policies found
                </div>
              </div>

              <div style={toggleGroupStyle}>
                <button
                  type="button"
                  onClick={() => setViewMode("table")}
                  style={viewMode === "table" ? activeToggleStyle : inactiveToggleStyle}
                >
                  Table View
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("split")}
                  style={viewMode === "split" ? activeToggleStyle : inactiveToggleStyle}
                >
                  Split View
                </button>
              </div>
            </div>

            {errorMessage ? (
              <div style={errorCardStyle}>{errorMessage}</div>
            ) : viewMode === "table" ? (
              <div style={tableCardStyle} className="mb-6">
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", minWidth: "1280px", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: "#F8FBFD", borderBottom: "1px solid #D9E2EC" }}>
                        <HeaderCell label="Drug" />
                        <HeaderCell label="Payer" />
                        <HeaderCell label="Category" />
                        <HeaderCell label="Plan" />
                        <HeaderCell label="Policy Type" />
                        <HeaderCell label="Coverage" />
                        <HeaderCell label="Access" />
                        <HeaderCell label="Ranking" />
                        <HeaderCell label="Competing Drugs" />
                        <HeaderCell label="Rebate Implication" />
                        <HeaderCell label="Price" />
                        <HeaderCell label="Copay" />
                        <HeaderCell label="Policy" />
                      </tr>
                    </thead>
                    <tbody>
                      {sortedRows.map((row) => (
                        <tr key={row.id} style={{ borderBottom: "1px solid #E8EBF2" }}>
                          <DataCell>
                            <div style={{ fontWeight: 700, color: "#0D1C3A", fontSize: "14px" }}>
                              {row.drugBrand}
                            </div>
                            <div style={{ fontSize: "12px", color: "#6A7590", marginTop: "4px" }}>
                              {row.drugGeneric}
                            </div>
                          </DataCell>
                          <DataCell strong>{row.company}</DataCell>
                          <DataCell>{row.category || "N/A"}</DataCell>
                          <DataCell>{row.plan || "N/A"}</DataCell>
                          <DataCell>{row.policyType}</DataCell>
                          <DataCell>
                            <CoveragePill coverage={row.coverage} />
                          </DataCell>
                          <DataCell>{row.access}</DataCell>
                          <DataCell>{row.ranking}</DataCell>
                          <DataCell>{row.competingDrugs.length ? row.competingDrugs.join(", ") : "—"}</DataCell>
                          <DataCell>{row.rebateImplication}</DataCell>
                          <DataCell money>{row.price !== null ? `$${row.price.toFixed(2)}` : "N/A"}</DataCell>
                          <DataCell money>{row.copay !== null ? `$${row.copay.toFixed(2)}` : "N/A"}</DataCell>
                          <DataCell>
                            <div className="flex items-center gap-2 flex-wrap">
                              {(row.medicalPolicyId || row.pharmacyPolicyId) ? (
                                <button
                                  type="button"
                                  onClick={() => openPolicyPdf(row)}
                                  style={linkButtonStyle}
                                >
                                  <ExternalLink size={14} />
                                  Open PDF
                                </button>
                              ) : null}
                              <button
                                type="button"
                                onClick={() => setSelectedPolicyJson(row.policyJson)}
                                style={jsonButtonStyle}
                              >
                                <FileJson size={15} />
                                View JSON
                              </button>
                            </div>
                          </DataCell>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <>
                <div style={cardStyle} className="mb-6">
                  <div className="grid gap-4 mb-5" style={{ gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
                    <div>
                      <label style={labelStyle}>Left Company</label>
                      <select
                        value={splitCompanyLeft}
                        onChange={(event) => setSplitCompanyLeft(event.target.value)}
                        style={inputStyle}
                      >
                        {sortedRows.map((row) => (
                          <option key={row.company} value={row.company}>
                            {row.company}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>Right Company</label>
                      <select
                        value={splitCompanyRight}
                        onChange={(event) => setSplitCompanyRight(event.target.value)}
                        style={inputStyle}
                      >
                        {sortedRows.map((row) => (
                          <option key={row.company} value={row.company}>
                            {row.company}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <button type="button" onClick={generateLiveAiSummary} style={primaryButtonStyle}>
                    <Sparkles size={15} />
                    AI Summary
                  </button>

                  {showAiSummary ? (
                    <div style={summaryCardStyle} className="mt-5">
                      <div style={{ ...labelStyle, marginBottom: "10px", display: "flex", alignItems: "center", gap: "8px" }}>
                        <Sparkles size={15} />
                        AI Summary
                      </div>
                      {summaryLoading ? (
                        <div style={{ fontSize: "13px", color: "#6A7590" }}>Generating summary...</div>
                      ) : (
                        <p style={{ fontSize: "13px", color: "#40546B", lineHeight: 1.8 }}>{aiSummary}</p>
                      )}
                    </div>
                  ) : null}
                </div>

                <div style={cardStyle} className="mb-6">
                  <div className="mb-4">
                    <div style={sectionTitleStyle}>Visual Comparison</div>
                    <div style={{ fontSize: "13px", color: "#6A7590" }}>
                      Compare price, copay, and quantity across selected payers
                    </div>
                  </div>

                  <div style={toggleGroupStyle} className="mb-5">
                    <button
                      type="button"
                      onClick={() => setMetricTab("price")}
                      style={metricTab === "price" ? activeToggleStyle : inactiveToggleStyle}
                    >
                      Price
                    </button>
                    <button
                      type="button"
                      onClick={() => setMetricTab("copay")}
                      style={metricTab === "copay" ? activeToggleStyle : inactiveToggleStyle}
                    >
                      Copay
                    </button>
                    <button
                      type="button"
                      onClick={() => setMetricTab("quantity")}
                      style={metricTab === "quantity" ? activeToggleStyle : inactiveToggleStyle}
                    >
                      Quantity
                    </button>
                  </div>

                  <SimpleBarChart rows={sortedRows} metric={metricTab} />
                </div>
              </>
            )}
          </>
        ) : null}
      </div>

      {selectedPolicyJson ? (
        <JsonModal json={selectedPolicyJson} onClose={() => setSelectedPolicyJson(null)} />
      ) : null}
    </div>
  );
}

function normalizeCompanyName(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function cleanCompanyInput(value: string) {
  const raw = value.trim();
  if (!raw) return "";

  const exact = KNOWN_COMPANIES.find(
    (company) => normalizeCompanyName(company) === normalizeCompanyName(raw)
  );

  if (exact) return exact;
  if (normalizeCompanyName(raw) === "uhc") return "UnitedHealthcare";
  if (normalizeCompanyName(raw) === "bcbs") return "Blue Cross Blue Shield of North Carolina";

  return raw;
}

function mapCompanyToPayerId(company: string) {
  const normalized = normalizeCompanyName(company);

  const mapping: Record<string, string> = {
    cigna: "cigna",
    unitedhealthcare: "uhc",
    uhc: "uhc",
    emblemhealth: "emblemhealth",
    "upmc health plan": "upmc",
    "priority health": "priority_health",
    "blue cross blue shield of north carolina": "bcbs_nc",
    "florida blue": "florida_blue",
    aetna: "aetna",
    anthem: "anthem",
    centene: "centene",
    humana: "humana",
    "kaiser permanente": "kaiser",
  };

  return mapping[normalized] ?? normalized.replace(/\s+/g, "_");
}

function HeaderCell({ label }: { label: string }) {
  return (
    <th
      style={{
        padding: "14px 12px",
        textAlign: "left",
        fontSize: "12px",
        fontWeight: 700,
        color: "#6A7590",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </th>
  );
}

function DataCell({
  children,
  strong,
  money,
}: {
  children: React.ReactNode;
  strong?: boolean;
  money?: boolean;
}) {
  return (
    <td
      style={{
        padding: "14px 12px",
        fontSize: "13px",
        color: "#0D1C3A",
        lineHeight: 1.65,
        verticalAlign: "top",
        fontWeight: strong || money ? 700 : 400,
        whiteSpace: "normal",
      }}
    >
      {children}
    </td>
  );
}

function CoveragePill({ coverage }: { coverage: CoverageState }) {
  const map: Record<CoverageState, { bg: string; border: string; text: string }> = {
    Covered: { bg: "#DDF7EB", border: "#9DD9B7", text: "#0E8A49" },
    "Not Covered": { bg: "#FDE7E7", border: "#F4B7B7", text: "#E11D1D" },
    "No Policy Found": { bg: "#F3F4F6", border: "#D9DEE5", text: "#3A4A5B" },
    "Pharmacy Only": { bg: "#E4ECFF", border: "#BDD0FF", text: "#0E57FF" },
  };

  const item = map[coverage];

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "4px 9px",
        borderRadius: "4px",
        border: `1px solid ${item.border}`,
        background: item.bg,
        color: item.text,
        fontSize: "12px",
        fontWeight: 700,
        lineHeight: 1,
        whiteSpace: "nowrap",
      }}
    >
      {coverage}
    </span>
  );
}

function InfoBlock({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div>
      <div style={{ fontSize: "12px", color: "#6A7590", marginBottom: "3px" }}>{label}</div>
      <div style={{ fontSize: "13px", fontWeight: 700, color: "#0D1C3A", lineHeight: 1.7 }}>
        {value}
      </div>
    </div>
  );
}

function JsonModal({
  json,
  onClose,
}: {
  json: Record<string, unknown>;
  onClose: () => void;
}) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(13,28,58,0.24)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 80,
        padding: "24px",
      }}
    >
      <div
        style={{
          width: "min(760px, 100%)",
          maxHeight: "80vh",
          overflow: "auto",
          background: "#FFFFFF",
          borderRadius: "12px",
          border: "1px solid #D9E2EC",
          boxShadow: "0 16px 40px rgba(13,28,58,0.18)",
          padding: "18px",
        }}
      >
        <div className="flex items-center justify-between" style={{ marginBottom: "14px" }}>
          <div style={{ fontSize: "16px", fontWeight: 800, color: "#0D1C3A" }}>
            Policy JSON Preview
          </div>
          <button type="button" onClick={onClose} style={closeButtonStyle}>
            Close
          </button>
        </div>

        <pre
          style={{
            background: "#F8FBFD",
            border: "1px solid #E8EBF2",
            borderRadius: "8px",
            padding: "14px",
            fontSize: "12px",
            color: "#0D1C3A",
            lineHeight: 1.7,
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}
        >
          {JSON.stringify(json, null, 2)}
        </pre>
      </div>
    </div>
  );
}

function SimpleBarChart({
  rows,
  metric,
}: {
  rows: CompareRow[];
  metric: MetricTab;
}) {
  const values = rows.map((row) => {
    if (metric === "price") return row.price ?? 0;
    if (metric === "copay") return row.copay ?? 0;
    const numeric = typeof row.quantity === "number" ? row.quantity : Number(row.quantity ?? 0);
    return Number.isFinite(numeric) ? numeric : 0;
  });

  const maxValue = Math.max(...values, 1);

  return (
    <div
      style={{
        minHeight: "260px",
        display: "flex",
        alignItems: "flex-end",
        gap: "16px",
        paddingTop: "20px",
      }}
    >
      {rows.map((row) => {
        const raw =
          metric === "price"
            ? row.price ?? 0
            : metric === "copay"
            ? row.copay ?? 0
            : typeof row.quantity === "number"
            ? row.quantity
            : Number(row.quantity ?? 0) || 0;

        const height = Math.max(16, (raw / maxValue) * 180);

        return (
          <div
            key={`${row.id}-${metric}`}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              minWidth: 0,
            }}
          >
            <div
              style={{
                width: "100%",
                maxWidth: "72px",
                height: `${height}px`,
                background: "#44798A",
                borderRadius: "6px 6px 0 0",
              }}
            />
            <div style={{ marginTop: "8px", fontSize: "12px", color: "#0D1C3A", textAlign: "center" }}>
              {row.company}
            </div>
            <div style={{ marginTop: "4px", fontSize: "12px", color: "#6A7590" }}>
              {metric === "price" || metric === "copay" ? `$${raw}` : raw}
            </div>
          </div>
        );
      })}
    </div>
  );
}

const titleStyle: CSSProperties = {
  fontSize: "22px",
  fontWeight: 800,
  color: "#0D1C3A",
  lineHeight: 1.2,
  marginBottom: "6px",
};

const subtitleStyle: CSSProperties = {
  fontSize: "13px",
  color: "#6A7590",
};

const cardStyle: CSSProperties = {
  background: "#FFFFFF",
  border: "1px solid #D9E2EC",
  boxShadow: "0 2px 8px rgba(13,28,58,0.06)",
  borderRadius: "12px",
  padding: "24px",
};

const tableCardStyle: CSSProperties = {
  background: "#FFFFFF",
  border: "1px solid #D9E2EC",
  boxShadow: "0 2px 8px rgba(13,28,58,0.05)",
  borderRadius: "12px",
  overflow: "hidden",
};

const contextCardStyle: CSSProperties = {
  border: "1px solid #BFD4E0",
  background: "#F7FBFD",
  borderRadius: "12px",
  padding: "20px",
};

const sectionTitleStyle: CSSProperties = {
  fontSize: "18px",
  fontWeight: 700,
  color: "#0D1C3A",
  marginBottom: "8px",
};

const sectionHintStyle: CSSProperties = {
  fontSize: "13px",
  color: "#6A7590",
};

const labelStyle: CSSProperties = {
  display: "block",
  fontSize: "13px",
  fontWeight: 700,
  color: "#0D1C3A",
  marginBottom: "10px",
};

const inputStyle: CSSProperties = {
  width: "100%",
  border: "1px solid #D9E2EC",
  borderRadius: "6px",
  background: "#FFFFFF",
  color: "#0D1C3A",
  fontSize: "14px",
  padding: "10px 12px",
  outline: "none",
};

const allCompaniesRowStyle: CSSProperties = {
  border: "1px solid #D3DCE6",
  background: "#FAFCFD",
  borderRadius: "8px",
  padding: "16px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "16px",
};

const iconButtonStyle: CSSProperties = {
  width: "42px",
  height: "42px",
  border: "1px solid #E1E7EC",
  borderRadius: "6px",
  background: "#F7FAFC",
  color: "#6A7590",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  flexShrink: 0,
};

const chipStyle: CSSProperties = {
  border: "1px solid #BFD4E0",
  background: "#F4FAFD",
  color: "#29556C",
  fontSize: "12px",
  borderRadius: "6px",
  padding: "6px 10px",
  display: "inline-flex",
  gap: "8px",
  alignItems: "center",
  cursor: "pointer",
};

const primaryButtonStyle: CSSProperties = {
  border: "none",
  borderRadius: "6px",
  background: "#4E8091",
  color: "#FFFFFF",
  fontSize: "14px",
  fontWeight: 700,
  padding: "11px 18px",
  display: "inline-flex",
  alignItems: "center",
  gap: "10px",
  cursor: "pointer",
};

const jsonButtonStyle: CSSProperties = {
  border: "1px solid #D9E2EC",
  borderRadius: "6px",
  background: "#FFFFFF",
  color: "#0D1C3A",
  fontSize: "13px",
  fontWeight: 700,
  padding: "9px 12px",
  display: "inline-flex",
  alignItems: "center",
  gap: "8px",
  cursor: "pointer",
  whiteSpace: "nowrap",
};

const linkButtonStyle: CSSProperties = {
  border: "1px solid #D9E2EC",
  borderRadius: "6px",
  background: "#F8FBFD",
  color: "#2D6E8C",
  fontSize: "13px",
  fontWeight: 700,
  padding: "9px 12px",
  display: "inline-flex",
  alignItems: "center",
  gap: "8px",
  cursor: "pointer",
  whiteSpace: "nowrap",
};

const closeButtonStyle: CSSProperties = {
  border: "1px solid #D9E2EC",
  background: "#FFFFFF",
  borderRadius: "6px",
  padding: "8px 12px",
  cursor: "pointer",
  fontSize: "13px",
  color: "#0D1C3A",
};

const errorCardStyle: CSSProperties = {
  border: "1px solid #F4B7B7",
  background: "#FDE7E7",
  color: "#B02020",
  borderRadius: "12px",
  padding: "16px",
};

const summaryCardStyle: CSSProperties = {
  border: "1px solid #D9E2EC",
  background: "#F8FBFD",
  borderRadius: "12px",
  padding: "16px",
};

const toggleGroupStyle: CSSProperties = {
  display: "inline-flex",
  border: "1px solid #D3DCE6",
  borderRadius: "6px",
  overflow: "hidden",
  background: "#FFFFFF",
};

const activeToggleStyle: CSSProperties = {
  border: "none",
  background: "#4E8091",
  color: "#FFFFFF",
  fontSize: "14px",
  fontWeight: 700,
  padding: "10px 14px",
  cursor: "pointer",
};

const inactiveToggleStyle: CSSProperties = {
  border: "none",
  background: "#FFFFFF",
  color: "#6A7590",
  fontSize: "14px",
  fontWeight: 700,
  padding: "10px 14px",
  cursor: "pointer",
};