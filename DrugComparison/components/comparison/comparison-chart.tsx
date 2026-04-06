"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChartContainer, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import type { ComparisonResult } from "./drug-comparison";
import { useState } from "react";

interface ComparisonChartProps {
  data: ComparisonResult[];
  drugName: string;
}

type ChartMetric = "price" | "copay" | "quantity";

export function ComparisonChart({ data, drugName }: ComparisonChartProps) {
  const [metric, setMetric] = useState<ChartMetric>("price");

  const chartConfig: ChartConfig = {
    price: { label: "Price", color: "var(--chart-1)" },
    copay: { label: "Copay", color: "var(--chart-2)" },
    quantity: { label: "Quantity", color: "var(--chart-3)" },
  };

  const chartData = data.map((item) => ({
    company: item.company.length > 12 ? item.company.substring(0, 12) + "..." : item.company,
    fullCompany: item.company,
    price: item.price ?? 0,
    copay: item.copay ?? 0,
    quantity: item.quantity ?? 0,
    coverageState: item.coverageState,
    policyType: item.policyType,
  }));

  const getMetricLabel = () => {
    switch (metric) {
      case "price":
        return "Price ($)";
      case "copay":
        return "Copay ($)";
      case "quantity":
        return "Quantity";
    }
  };

  const formatValue = (row: ComparisonResult, value: number) => {
    if (metric === "quantity") return row.quantity != null ? `${value}` : "N/A";
    if (metric === "price") return row.price != null ? `$${value.toFixed(2)}` : "N/A";
    return row.copay != null ? `$${value.toFixed(2)}` : "N/A";
  };

  return (
    <Card className="border-border bg-card shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle className="text-lg font-medium">Visual Comparison</CardTitle>
          <CardDescription>
            {drugName} - {getMetricLabel()} by payer from ingested policies
          </CardDescription>
        </div>

        <Tabs value={metric} onValueChange={(v) => setMetric(v as ChartMetric)}>
          <TabsList className="bg-secondary/50">
            <TabsTrigger value="price" className="text-xs">Price</TabsTrigger>
            <TabsTrigger value="copay" className="text-xs">Copay</TabsTrigger>
            <TabsTrigger value="quantity" className="text-xs">Quantity</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>

      <CardContent>
        <ChartContainer config={chartConfig} className="h-[350px] w-full">
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.5} />
            <XAxis
              dataKey="company"
              tickLine={false}
              axisLine={false}
              tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
              angle={-45}
              textAnchor="end"
              height={80}
              interval={0}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
              tickFormatter={(value) => (metric === "quantity" ? value : `$${value}`)}
            />
            <Tooltip
              content={
                <ChartTooltipContent
                  formatter={(value, _name, item) => {
                    const original = data.find((d) => d.company === item.payload.fullCompany);
                    if (!original) return null;
                    return (
                      <div className="flex flex-col gap-1">
                        <span className="font-medium">{item.payload.fullCompany}</span>
                        <span>
                          {getMetricLabel()}: {formatValue(original, value as number)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Coverage State: {original.coverageState}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Policy Type: {original.policyType}
                        </span>
                      </div>
                    );
                  }}
                />
              }
              cursor={{ fill: "var(--muted)", opacity: 0.3 }}
            />
            <Legend verticalAlign="top" height={36} formatter={() => getMetricLabel()} />
            <Bar
              dataKey={metric}
              fill={`var(--chart-${metric === "price" ? 1 : metric === "copay" ? 2 : 3})`}
              radius={[4, 4, 0, 0]}
              maxBarSize={60}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}