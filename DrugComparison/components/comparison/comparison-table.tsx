"use client";

import { useState } from "react";
import { ArrowUpDown, ChevronDown, ChevronUp, Check, FileJson } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ComparisonResult } from "./drug-comparison";

interface ComparisonTableProps {
  data: ComparisonResult[];
  selectable?: boolean;
  selectedIds?: Set<string>;
  onToggleSelect?: (id: string) => void;
  onOpenPolicyJson?: (id: string) => void;
}

type SortKey =
  | "company"
  | "drugName"
  | "genericName"
  | "drugCategory"
  | "planType"
  | "policyType"
  | "coverageState"
  | "formularyAccessStatus"
  | "preferredRank"
  | "totalDrugsOnTier"
  | "price"
  | "copay";

type SortDirection = "asc" | "desc";

export function ComparisonTable({
  data,
  selectable = false,
  selectedIds = new Set(),
  onToggleSelect,
  onOpenPolicyJson,
}: ComparisonTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("company");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  const sortedData = [...data].sort((a, b) => {
    const aValue = a[sortKey];
    const bValue = b[sortKey];

    if (typeof aValue === "string" && typeof bValue === "string") {
      return sortDirection === "asc"
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }

    if (typeof aValue === "number" && typeof bValue === "number") {
      return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
    }

    return 0;
  });

  const getCoverageStateBadge = (coverageState: ComparisonResult["coverageState"]) => {
    const variants: Record<ComparisonResult["coverageState"], { className: string }> = {
      Covered: { className: "bg-emerald-100 text-emerald-700 border-emerald-200" },
      "Not Covered": { className: "bg-red-100 text-red-700 border-red-200" },
      "No Policy Found": { className: "bg-slate-100 text-slate-700 border-slate-200" },
      "Pharmacy Only": { className: "bg-blue-100 text-blue-700 border-blue-200" },
    };

    return (
      <Badge variant="outline" className={variants[coverageState].className}>
        {coverageState}
      </Badge>
    );
  };

  const SortIcon = ({ column }: { column: SortKey }) => {
    if (sortKey !== column) {
      return <ArrowUpDown className="ml-1 h-3 w-3 opacity-50" />;
    }
    return sortDirection === "asc" ? (
      <ChevronUp className="ml-1 h-3 w-3" />
    ) : (
      <ChevronDown className="ml-1 h-3 w-3" />
    );
  };

  return (
    <Card className="border-border bg-card overflow-hidden shadow-sm w-full">
      <div className="w-full overflow-x-auto">
        <Table className="w-full min-w-[1500px] table-fixed text-[12px]">
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent bg-secondary/30">
              {selectable && (
                <TableHead className="w-10 min-w-10 px-2">
                  <span className="sr-only">Select</span>
                </TableHead>
              )}

              <TableHead className="w-[140px] px-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort("drugName")}
                  className="-ml-2 h-8 px-1 font-medium text-muted-foreground hover:text-foreground whitespace-nowrap text-[11px]"
                >
                  Drug
                  <SortIcon column="drugName" />
                </Button>
              </TableHead>

              <TableHead className="w-[130px] px-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort("company")}
                  className="-ml-2 h-8 px-1 font-medium text-muted-foreground hover:text-foreground whitespace-nowrap text-[11px]"
                >
                  Payer
                  <SortIcon column="company" />
                </Button>
              </TableHead>

              <TableHead className="w-[150px] px-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort("drugCategory")}
                  className="-ml-2 h-8 px-1 font-medium text-muted-foreground hover:text-foreground whitespace-nowrap text-[11px]"
                >
                  Category
                  <SortIcon column="drugCategory" />
                </Button>
              </TableHead>

              <TableHead className="w-[90px] px-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort("planType")}
                  className="-ml-2 h-8 px-1 font-medium text-muted-foreground hover:text-foreground whitespace-nowrap text-[11px]"
                >
                  Plan
                  <SortIcon column="planType" />
                </Button>
              </TableHead>

              <TableHead className="w-[140px] px-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort("policyType")}
                  className="-ml-2 h-8 px-1 font-medium text-muted-foreground hover:text-foreground whitespace-nowrap text-[11px]"
                >
                  Policy Type
                  <SortIcon column="policyType" />
                </Button>
              </TableHead>

              <TableHead className="w-[130px] px-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort("coverageState")}
                  className="-ml-2 h-8 px-1 font-medium text-muted-foreground hover:text-foreground whitespace-nowrap text-[11px]"
                >
                  Coverage
                  <SortIcon column="coverageState" />
                </Button>
              </TableHead>

              <TableHead className="w-[120px] px-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort("formularyAccessStatus")}
                  className="-ml-2 h-8 px-1 font-medium text-muted-foreground hover:text-foreground whitespace-nowrap text-[11px]"
                >
                  Access
                  <SortIcon column="formularyAccessStatus" />
                </Button>
              </TableHead>

              <TableHead className="w-[130px] px-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort("preferredRank")}
                  className="-ml-2 h-8 px-1 font-medium text-muted-foreground hover:text-foreground whitespace-nowrap text-[11px]"
                >
                  Ranking
                  <SortIcon column="preferredRank" />
                </Button>
              </TableHead>

              <TableHead className="w-[170px] px-2">Competing Drugs</TableHead>
              <TableHead className="w-[200px] px-2">Rebate Implication</TableHead>

              <TableHead className="w-[80px] px-2 text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort("price")}
                  className="-ml-2 h-8 px-1 font-medium text-muted-foreground hover:text-foreground whitespace-nowrap text-[11px]"
                >
                  Price
                  <SortIcon column="price" />
                </Button>
              </TableHead>

              <TableHead className="w-[80px] px-2 text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort("copay")}
                  className="-ml-2 h-8 px-1 font-medium text-muted-foreground hover:text-foreground whitespace-nowrap text-[11px]"
                >
                  Copay
                  <SortIcon column="copay" />
                </Button>
              </TableHead>

              <TableHead className="w-[110px] px-2">Policy</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {sortedData.map((row) => {
              const isSelected = selectedIds.has(row.id);

              return (
                <TableRow
                  key={row.id}
                  className={cn(
                    "border-border transition-colors align-top",
                    selectable && "cursor-pointer",
                    isSelected
                      ? "bg-primary/10 hover:bg-primary/15"
                      : "hover:bg-secondary/50"
                  )}
                  onClick={() => selectable && onToggleSelect?.(row.id)}
                >
                  {selectable && (
                    <TableCell className="w-10 px-2 align-top">
                      <div
                        className={cn(
                          "flex h-5 w-5 items-center justify-center rounded border-2 transition-colors",
                          isSelected
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border"
                        )}
                      >
                        {isSelected && <Check className="h-3 w-3" />}
                      </div>
                    </TableCell>
                  )}

                  <TableCell className="px-2 py-3 align-top">
                    <div className="whitespace-normal break-words font-medium text-foreground leading-5">
                      {row.drugName}
                    </div>
                    <div className="mt-1 whitespace-normal break-words text-[11px] text-muted-foreground leading-4">
                      {row.genericName}
                    </div>
                  </TableCell>

                  <TableCell className="px-2 py-3 align-top">
                    <div className="whitespace-normal break-words font-medium text-foreground leading-5">
                      {row.company}
                    </div>
                  </TableCell>

                  <TableCell className="px-2 py-3 align-top">
                    <div className="whitespace-normal break-words text-muted-foreground leading-5">
                      {row.drugCategory}
                    </div>
                  </TableCell>

                  <TableCell className="px-2 py-3 align-top">
                    <div className="whitespace-normal break-words text-muted-foreground leading-5">
                      {row.planType}
                    </div>
                  </TableCell>

                  <TableCell className="px-2 py-3 align-top">
                    <div className="whitespace-normal break-words text-muted-foreground leading-5">
                      {row.policyType}
                    </div>
                  </TableCell>

                  <TableCell className="px-2 py-3 align-top">
                    <div className="whitespace-normal">
                      {getCoverageStateBadge(row.coverageState)}
                    </div>
                  </TableCell>

                  <TableCell className="px-2 py-3 align-top">
                    <div className="whitespace-normal break-words text-muted-foreground leading-5">
                      {row.formularyAccessStatus}
                    </div>
                  </TableCell>

                  <TableCell className="px-2 py-3 align-top">
                    <div className="whitespace-normal break-words text-muted-foreground leading-5">
                      {row.positionLabel}
                    </div>
                    <div className="mt-1 text-[11px] text-muted-foreground">
                      Rank {row.preferredRank} of {row.totalDrugsOnTier}
                    </div>
                  </TableCell>

                  <TableCell className="px-2 py-3 align-top">
                    <div className="whitespace-normal break-words text-muted-foreground leading-5">
                      {row.competingDrugs.length > 0
                        ? row.competingDrugs.join(", ")
                        : "—"}
                    </div>
                  </TableCell>

                  <TableCell className="px-2 py-3 align-top">
                    <div className="whitespace-normal break-words text-muted-foreground leading-5">
                      {row.rebateImplication}
                    </div>
                  </TableCell>

                  <TableCell className="px-2 py-3 align-top text-right">
                    <div className="whitespace-nowrap font-mono text-foreground">
                      ${row.price.toFixed(2)}
                    </div>
                  </TableCell>

                  <TableCell className="px-2 py-3 align-top text-right">
                    <div className="whitespace-nowrap font-mono font-semibold text-primary">
                      ${row.copay.toFixed(2)}
                    </div>
                  </TableCell>

                  <TableCell className="px-2 py-3 align-top">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2 whitespace-nowrap px-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenPolicyJson?.(row.id);
                      }}
                    >
                      <FileJson className="h-4 w-4" />
                      View JSON
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}