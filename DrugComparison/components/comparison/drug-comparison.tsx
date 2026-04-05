"use client";

import { useMemo, useRef, useState } from "react";
import { csvFormat } from "d3-dsv";
import {
  Search,
  X,
  Plus,
  BarChart3,
  SplitSquareVertical,
  Building2,
  FileText,
  Sparkles,
  RefreshCw,
  TableIcon,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileJson,
  ChevronDown,
  Download,
  Copy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ComparisonTable } from "./comparison-table";
import { ComparisonChart } from "./comparison-chart";
import PolicyJsonDrawer from "./policy-json-drawer";
import { cn } from "@/lib/utils";
import { formatMoleculeType, getDrugMeta } from "@/lib/drug-catalog";

export function DrugComparison() {
  const [drugName, setDrugName] = useState("");
  const [companies, setCompanies] = useState<string[]>([]);
  const [companyInput, setCompanyInput] = useState("");
  const [searchAllCompanies, setSearchAllCompanies] = useState(false);
  const [searchResults, setSearchResults] = useState<ComparisonResult[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<"table" | "split">("table");
  const [selectedForSplit, setSelectedForSplit] = useState<Set<string>>(new Set());
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [activePolicyId, setActivePolicyId] = useState<string | null>(null);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const exportRef = useRef<HTMLDivElement | null>(null);

  const selectedDrugMeta = useMemo(() => {
    return drugName.trim() ? getDrugMeta(drugName) : null;
  }, [drugName]);

  const visibleExportData =
    viewMode === "split" && selectedForSplit.size >= 2
      ? searchResults?.filter((item) => selectedForSplit.has(item.id)) || []
      : searchResults || [];

  const handleAddCompany = () => {
    if (companyInput.trim() && !companies.includes(companyInput.trim())) {
      setCompanies([...companies, companyInput.trim()]);
      setCompanyInput("");
    }
  };

  const handleRemoveCompany = (company: string) => {
    setCompanies(companies.filter((c) => c !== company));
  };

  const handleSearch = async () => {
    if (!drugName.trim()) return;
    if (!searchAllCompanies && companies.length === 0) return;

    setIsLoading(true);
    setSelectedForSplit(new Set());
    setViewMode("table");
    setAiSummary(null);
    setSummaryError(null);

    try {
      const response = await fetch("/api/compare-engine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          drugName,
          companies,
          searchAllCompanies,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || "Failed to load comparison results.");
      }

      const data = await response.json();
      setSearchResults(data.results ?? []);
    } catch (error) {
      console.error(error);
      setSearchResults([]);
      setSummaryError(error instanceof Error ? error.message : "Failed to load comparison results.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      if (companyInput) {
        handleAddCompany();
      } else {
        handleSearch();
      }
    }
  };

  const toggleSplitSelection = (id: string) => {
    const next = new Set(selectedForSplit);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedForSplit(next);
    setAiSummary(null);
    setSummaryError(null);
  };

  const splitViewData = searchResults?.filter((item) => selectedForSplit.has(item.id)) || [];

  const generateAISummary = async () => {
    if (splitViewData.length < 2) return;

    setIsGeneratingSummary(true);
    setSummaryError(null);
    setAiSummary(null);

    try {
      const response = await fetch("/api/compare-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          drugName,
          comparisonData: splitViewData,
        }),
      });

      if (!response.ok) throw new Error("Failed to generate summary");
      const data = await response.json();
      setAiSummary(data.summary);
    } catch (error) {
      console.error(error);
      setSummaryError("Unable to generate AI summary. Please try again.");
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const handleExportCsv = () => {
    if (!visibleExportData.length) return;

    const csv = csvFormat(
      visibleExportData.map((row) => ({
        brandDrugName: row.drugName,
        genericDrugName: row.genericName,
        payerName: row.company,
        drugCategory: row.drugCategory,
        planType: row.planType,
        policyType: row.policyType,
        coverageState: row.coverageState,
        formularyAccessStatus: row.formularyAccessStatus,
        preferredRank: row.preferredRank ?? "",
        totalDrugsOnTier: row.totalDrugsOnTier ?? "",
        positionLabel: row.positionLabel,
        competingDrugs: row.competingDrugs.join("; "),
        rebateImplication: row.rebateImplication,
        coverage: row.coverage,
        tier: row.tier,
        dosage: row.dosage,
        quantity: row.quantity ?? "",
        price: row.price ?? "",
        copay: row.copay ?? "",
        effectiveDate: row.effectiveDate ?? "",
        policyName: row.policyName,
        policySummary: row.policySummary,
      }))
    );

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "drug-policy-comparison.csv";
    link.click();
    URL.revokeObjectURL(url);
    setExportMenuOpen(false);
  };

  const handleCopyPasteFormat = async () => {
    if (!visibleExportData.length) return;

    const lines = [
      `Drug Policy Comparison Report`,
      `Drug: ${drugName}`,
      ``,
      ...visibleExportData.map((row, index) =>
        [
          `${index + 1}. ${row.company}`,
          `Brand / Generic: ${row.drugName} / ${row.genericName}`,
          `Drug Category: ${row.drugCategory}`,
          `Plan Type: ${row.planType}`,
          `Policy Type: ${row.policyType}`,
          `Coverage State: ${row.coverageState}`,
          `Access Status: ${row.formularyAccessStatus}`,
          `Ranking: ${row.positionLabel}`,
          `Competing Drugs: ${row.competingDrugs.length ? row.competingDrugs.join(", ") : "None listed"}`,
          `Rebate Implication: ${row.rebateImplication}`,
          `Price: ${row.price != null ? `$${row.price.toFixed(2)}` : "N/A"} | Copay: ${row.copay != null ? `$${row.copay.toFixed(2)}` : "N/A"}`,
          `Policy: ${row.policyName}`,
          `Summary: ${row.policySummary}`,
          ``,
        ].join("\n")
      ),
    ].join("\n");

    try {
      await navigator.clipboard.writeText(lines);
    } catch (error) {
      console.error("Copy failed:", error);
    }

    setExportMenuOpen(false);
  };

  const handleExportPdf = async () => {
    if (!exportRef.current) return;

    try {
      const { default: html2canvas } = await import("html2canvas");

      const canvas = await html2canvas(exportRef.current, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
      });

      const imageData = canvas.toDataURL("image/png");
      const printWindow = window.open("", "_blank", "width=1200,height=900");

      if (!printWindow) return;

      printWindow.document.write(`
        <html>
          <head>
            <title>Drug Policy Comparison PDF</title>
            <style>
              body { margin: 0; padding: 24px; font-family: Arial, sans-serif; background: white; }
              img { width: 100%; height: auto; display: block; }
            </style>
          </head>
          <body>
            <img src="${imageData}" />
            <script>window.onload = function () { window.print(); };</script>
          </body>
        </html>
      `);
      printWindow.document.close();
    } catch (error) {
      console.error("PDF export failed:", error);
    }

    setExportMenuOpen(false);
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Drug Policy Comparison
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Compare real ingested policy results across healthcare organizations
        </p>
      </div>

      <Card className="border-border bg-card shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Search Policies</CardTitle>
          <CardDescription>
            Search ingested medical and pharmacy policies for a drug and compare payer coverage.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="drug-name" className="text-sm font-medium">
              Drug Name
            </Label>
            <Input
              id="drug-name"
              placeholder="Enter brand or generic drug name"
              value={drugName}
              onChange={(e) => setDrugName(e.target.value)}
              onKeyDown={handleKeyDown}
              className="bg-background"
            />
          </div>

          {selectedDrugMeta ? (
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
              <div className="mb-2 flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold text-foreground">
                  Drug Context
                </span>
              </div>
              <div className="grid gap-3 md:grid-cols-2 text-sm">
                <div>
                  <p className="text-muted-foreground">Brand / Generic</p>
                  <p className="font-medium text-foreground">
                    {selectedDrugMeta.canonicalName} / {selectedDrugMeta.genericName}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Type</p>
                  <p className="font-medium text-foreground">
                    {formatMoleculeType(selectedDrugMeta.moleculeType)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Drug Category</p>
                  <p className="font-medium text-foreground">{selectedDrugMeta.drugCategory}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Therapeutic Area</p>
                  <p className="font-medium text-foreground capitalize">
                    {selectedDrugMeta.therapeuticArea}
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          <div className="flex items-center gap-3 rounded-lg border border-border bg-secondary/30 p-3">
            <Checkbox
              id="all-companies"
              checked={searchAllCompanies}
              onCheckedChange={(checked) => setSearchAllCompanies(checked === true)}
            />
            <div className="flex-1">
              <Label htmlFor="all-companies" className="cursor-pointer text-sm font-medium">
                Search All Available Payers
              </Label>
              <p className="text-xs text-muted-foreground">
                Pull all ingested payer records for this drug from Supabase.
              </p>
            </div>
            <Building2 className="h-5 w-5 text-muted-foreground" />
          </div>

          {!searchAllCompanies && (
            <div className="space-y-3">
              <Label className="text-sm font-medium">Select Payers</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Add payer name (e.g., Aetna, Cigna)"
                  value={companyInput}
                  onChange={(e) => setCompanyInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="flex-1 bg-background"
                />
                <Button
                  variant="secondary"
                  size="icon"
                  onClick={handleAddCompany}
                  disabled={!companyInput.trim()}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {companies.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {companies.map((company) => (
                    <Badge
                      key={company}
                      variant="secondary"
                      className="gap-1 px-3 py-1.5 bg-primary/10 text-primary border-primary/20"
                    >
                      {company}
                      <button
                        onClick={() => handleRemoveCompany(company)}
                        className="ml-1 rounded-full hover:bg-primary/20 p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          )}

          <Button
            onClick={handleSearch}
            disabled={Boolean(!drugName.trim() || (!searchAllCompanies && companies.length === 0) || isLoading)}
            className="w-full sm:w-auto"
          >
            {isLoading ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Loading Policies...
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                Compare Policies
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {summaryError && !searchResults && (
        <Card className="border-destructive/20 bg-destructive/5">
          <CardContent className="p-4 text-sm text-destructive">{summaryError}</CardContent>
        </Card>
      )}

      {searchResults && (
        <div ref={exportRef} className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-medium text-foreground">
                Results for &quot;{drugName}&quot;
              </h2>
              <p className="text-sm text-muted-foreground">
                {searchResults.length} payer result{searchResults.length === 1 ? "" : "s"} found
              </p>
            </div>

            <div className="flex gap-2 items-center">
              <div className="flex rounded-lg border border-border bg-secondary/50 p-1">
                <Button
                  variant={viewMode === "table" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("table")}
                  className={cn("gap-2", viewMode === "table" ? "" : "text-muted-foreground")}
                >
                  <BarChart3 className="h-4 w-4" />
                  Table View
                </Button>
                <Button
                  variant={viewMode === "split" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("split")}
                  className={cn("gap-2", viewMode === "split" ? "" : "text-muted-foreground")}
                >
                  <SplitSquareVertical className="h-4 w-4" />
                  Split View
                  {selectedForSplit.size > 0 && (
                    <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                      {selectedForSplit.size}
                    </Badge>
                  )}
                </Button>
              </div>

              <div className="relative">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => setExportMenuOpen((v) => !v)}
                >
                  <Download className="h-4 w-4" />
                  Export
                  <ChevronDown className="h-4 w-4" />
                </Button>

                {exportMenuOpen && (
                  <div className="absolute right-0 top-11 z-20 w-56 rounded-lg border border-border bg-card shadow-lg p-2">
                    <button
                      onClick={handleExportPdf}
                      className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-secondary/50"
                    >
                      <Download className="h-4 w-4" />
                      PDF
                    </button>
                    <button
                      onClick={handleExportCsv}
                      className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-secondary/50"
                    >
                      <Download className="h-4 w-4" />
                      CSV
                    </button>
                    <button
                      onClick={handleCopyPasteFormat}
                      className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-secondary/50"
                    >
                      <Copy className="h-4 w-4" />
                      Copy / Paste Format
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {viewMode === "split" && (
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <SplitSquareVertical className="h-5 w-5 text-primary mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">Split View Mode</p>
                    <p className="text-xs text-muted-foreground">
                      Select rows in the comparison table to compare them side by side.
                    </p>
                  </div>
                  {selectedForSplit.size > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedForSplit(new Set())}
                      className="text-xs"
                    >
                      Clear Selection
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          <ComparisonTable
            data={searchResults}
            selectable={viewMode === "split"}
            selectedIds={selectedForSplit}
            onToggleSelect={toggleSplitSelection}
            onOpenPolicyJson={setActivePolicyId}
          />

          {viewMode === "split" && splitViewData.length >= 2 && (
            <Card className="border-border bg-card shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <SplitSquareVertical className="h-5 w-5 text-primary" />
                      Side-by-Side Comparison
                    </CardTitle>
                    <CardDescription>
                      Detailed comparison of {splitViewData.length} selected policies
                    </CardDescription>
                  </div>

                  <Button
                    onClick={generateAISummary}
                    disabled={isGeneratingSummary}
                    size="sm"
                    className="gap-2"
                  >
                    {isGeneratingSummary ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        AI Summary
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                {(aiSummary || isGeneratingSummary || summaryError) && (
                  <div className="rounded-lg border border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles className="h-4 w-4 text-primary" />
                      <span className="text-sm font-semibold text-foreground">
                        AI Comparison Summary
                      </span>
                    </div>

                    {isGeneratingSummary && (
                      <div className="flex items-center gap-3 py-4">
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                        <p className="text-sm text-muted-foreground">
                          Analyzing policies and generating insights...
                        </p>
                      </div>
                    )}

                    {summaryError && (
                      <div className="flex items-center justify-between rounded-md bg-destructive/10 p-3">
                        <p className="text-sm text-destructive">{summaryError}</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={generateAISummary}
                          className="text-xs"
                        >
                          Retry
                        </Button>
                      </div>
                    )}

                    {aiSummary && !isGeneratingSummary && (
                      <div className="prose prose-sm max-w-none">
                        <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap">
                          {aiSummary}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <TableIcon className="h-4 w-4 text-primary" />
                    <span className="text-sm font-semibold text-foreground">
                      Coverage Criteria Comparison
                    </span>
                  </div>

                  <div className="rounded-lg border border-border overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-secondary/50 border-b border-border">
                            <th className="text-left p-3 font-medium text-muted-foreground min-w-[180px]">
                              Criteria
                            </th>
                            {splitViewData.map((item, idx) => (
                              <th key={item.id} className="text-left p-3 font-medium min-w-[150px]">
                                <div className="flex items-center gap-2">
                                  <div
                                    className={cn(
                                      "h-2.5 w-2.5 rounded-full",
                                      idx === 0 ? "bg-chart-1" : idx === 1 ? "bg-chart-2" : "bg-chart-3"
                                    )}
                                  />
                                  <span className="text-foreground">{item.company}</span>
                                </div>
                              </th>
                            ))}
                          </tr>
                        </thead>

                        <tbody>
                          <tr className="border-b border-border hover:bg-secondary/20">
                            <td className="p-3 text-muted-foreground">Coverage State</td>
                            {splitViewData.map((item) => (
                              <td key={`cs-${item.id}`} className="p-3">
                                <Badge variant="outline">{item.coverageState}</Badge>
                              </td>
                            ))}
                          </tr>

                          <tr className="border-b border-border hover:bg-secondary/20">
                            <td className="p-3 text-muted-foreground">Prior Authorization</td>
                            {splitViewData.map((item) => (
                              <td key={`pa-${item.id}`} className="p-3">
                                {item.coverageCriteria.priorAuthRequired ? (
                                  <div className="flex items-center gap-2">
                                    <AlertCircle className="h-4 w-4 text-amber-500" />
                                    <span className="text-amber-700">Required</span>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                    <span className="text-emerald-700">Not Required</span>
                                  </div>
                                )}
                              </td>
                            ))}
                          </tr>

                          <tr className="border-b border-border hover:bg-secondary/20">
                            <td className="p-3 text-muted-foreground">Step Therapy</td>
                            {splitViewData.map((item) => (
                              <td key={`st-${item.id}`} className="p-3">
                                {item.coverageCriteria.stepTherapyRequired ? (
                                  <div className="flex items-center gap-2">
                                    <AlertCircle className="h-4 w-4 text-amber-500" />
                                    <span className="text-amber-700">Required</span>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                    <span className="text-emerald-700">Not Required</span>
                                  </div>
                                )}
                              </td>
                            ))}
                          </tr>

                          <tr className="hover:bg-secondary/20">
                            <td className="p-3 text-muted-foreground">Quantity Limit</td>
                            {splitViewData.map((item) => (
                              <td key={`ql-${item.id}`} className="p-3 font-medium">
                                {item.coverageCriteria.quantityLimit}
                              </td>
                            ))}
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  {splitViewData.map((item, index) => (
                    <Card
                      key={item.id}
                      className={cn(
                        "border-2",
                        index === 0 ? "border-chart-1/30 bg-chart-1/5" : "border-chart-2/30 bg-chart-2/5"
                      )}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-center gap-2">
                          <div
                            className={cn(
                              "h-3 w-3 rounded-full",
                              index === 0 ? "bg-chart-1" : "bg-chart-2"
                            )}
                          />
                          <CardTitle className="text-base">{item.company}</CardTitle>
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <p className="text-muted-foreground">Drug</p>
                            <p className="font-medium">{item.drugName}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Generic</p>
                            <p className="font-medium">{item.genericName}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Category</p>
                            <p className="font-medium">{item.drugCategory}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Plan / Policy</p>
                            <p className="font-medium">{item.planType} / {item.policyType}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Coverage State</p>
                            <Badge variant="outline">{item.coverageState}</Badge>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Access Status</p>
                            <p className="font-medium">{item.formularyAccessStatus}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Ranking</p>
                            <p className="font-medium">{item.positionLabel}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Rebate</p>
                            <p className="font-medium">{item.rebateImplication}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Price</p>
                            <p className="font-mono font-semibold text-foreground">
                              {item.price != null ? `$${item.price.toFixed(2)}` : "N/A"}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Copay</p>
                            <p className="font-mono font-semibold text-primary">
                              {item.copay != null ? `$${item.copay.toFixed(2)}` : "N/A"}
                            </p>
                          </div>
                        </div>

                        <div className="border-t border-border" />

                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-primary" />
                            <span className="text-sm font-medium text-foreground">Policy Reference</span>
                          </div>

                          <div className="rounded-md bg-secondary/50 p-3">
                            <button
                              onClick={() => setActivePolicyId(item.id)}
                              className="flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                            >
                              {item.policyName}
                              <FileJson className="h-3 w-3" />
                            </button>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              Effective: {item.effectiveDate ?? "Unknown"}
                            </p>
                          </div>

                          <div>
                            <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                              Summary
                            </p>
                            <p className="text-sm leading-relaxed text-foreground/90">
                              {item.policySummary}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {viewMode === "split" && selectedForSplit.size < 2 && (
            <Card className="border-dashed border-border bg-secondary/20">
              <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                <SplitSquareVertical className="h-10 w-10 text-muted-foreground mb-3" />
                <p className="text-sm font-medium text-foreground">
                  Select at least 2 payers to compare
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Click on rows in the table above to select them for comparison
                </p>
              </CardContent>
            </Card>
          )}

          <ComparisonChart
            data={viewMode === "split" && splitViewData.length >= 2 ? splitViewData : searchResults}
            drugName={drugName}
          />
        </div>
      )}

      <PolicyJsonDrawer
        policyId={activePolicyId}
        onClose={() => setActivePolicyId(null)}
      />
    </div>
  );
}

export interface CoverageCriteria {
  priorAuthRequired: boolean;
  priorAuthDetails?: string;
  stepTherapyRequired: boolean;
  stepTherapyDetails?: string;
  quantityLimit: string;
  ageRestriction?: string;
  diagnosisRequired?: string;
  specialtyPharmacyRequired: boolean;
  mailOrderAvailable: boolean;
  renewalRequired: boolean;
  renewalPeriod?: string;
}

export interface ComparisonResult {
  id: string;
  company: string;
  drugName: string;
  genericName: string;
  drugCategory: string;
  planType: string;
  policyType: string;
  coverageState: "Covered" | "Not Covered" | "No Policy Found" | "Pharmacy Only";
  formularyAccessStatus: string;
  preferredRank: number | null;
  totalDrugsOnTier: number | null;
  positionLabel: string;
  competingDrugs: string[];
  rebateImplication: string;
  coverage: "Covered" | "Prior Auth" | "Step Therapy" | "Not Covered";
  tier: number;
  dosage: string;
  quantity: number | null;
  price: number | null;
  copay: number | null;
  effectiveDate: string | null;
  policyName: string;
  policyUrl: string | null;
  policySummary: string;
  coverageCriteria: CoverageCriteria;
  moleculeType: string | null;
  therapeuticArea: string | null;
  relatedProducts: string[];
  policyScopeNote: string;
}