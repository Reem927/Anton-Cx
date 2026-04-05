"use client";

import { useEffect, useState } from "react";
import { X, FileJson, Tag, Layers3 } from "lucide-react";

interface Props {
  policyId: string | null;
  onClose: () => void;
}

interface PolicyResponse {
  policy?: Record<string, unknown>;
  metadata?: {
    moleculeType?: string;
    moleculeLabel?: string;
    therapeuticArea?: string;
    relatedProducts?: string[];
    policyGroupingHint?: string;
  };
  error?: string;
}

export default function PolicyJsonDrawer({ policyId, onClose }: Props) {
  const [data, setData] = useState<PolicyResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!policyId) {
      setData(null);
      return;
    }

    const load = async () => {
      setLoading(true);
      setData(null);

      try {
        const res = await fetch(`/api/policy-json/${policyId}`);
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error(err);
        setData({ error: "Failed to load policy JSON." });
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [policyId]);

  if (!policyId) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(13,28,58,0.18)",
        zIndex: 50,
        display: "flex",
        justifyContent: "flex-end",
      }}
    >
      <div
        style={{
          width: "min(760px, 100%)",
          height: "100%",
          background: "#FFFFFF",
          borderLeft: "0.5px solid #E8EBF2",
          padding: "20px",
          overflowY: "auto",
          boxShadow: "-12px 0 30px rgba(13,28,58,0.08)",
        }}
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <FileJson className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">
                Policy JSON Viewer
              </h2>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Structured policy data from your local JSON database
            </p>
          </div>

          <button
            onClick={onClose}
            style={{
              border: "0.5px solid #E8EBF2",
              background: "#FFFFFF",
              borderRadius: "8px",
              padding: "8px 10px",
              cursor: "pointer",
            }}
            aria-label="Close drawer"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center gap-3 rounded-lg border border-border bg-secondary/20 p-4">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="text-sm text-muted-foreground">Loading policy JSON...</p>
          </div>
        ) : data?.error ? (
          <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4">
            <p className="text-sm text-destructive">{data.error}</p>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-lg border border-border bg-card p-4">
                <div className="mb-2 flex items-center gap-2">
                  <Tag className="h-4 w-4 text-primary" />
                  <span className="text-sm font-semibold text-foreground">
                    Molecule Classification
                  </span>
                </div>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Type: </span>
                    <span className="font-medium text-foreground">
                      {data?.metadata?.moleculeLabel || "Not available"}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Therapeutic Area: </span>
                    <span className="font-medium text-foreground capitalize">
                      {data?.metadata?.therapeuticArea || "Not available"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-border bg-card p-4">
                <div className="mb-2 flex items-center gap-2">
                  <Layers3 className="h-4 w-4 text-primary" />
                  <span className="text-sm font-semibold text-foreground">
                    Related Products
                  </span>
                </div>
                <p className="text-sm text-foreground">
                  {data?.metadata?.relatedProducts &&
                  data.metadata.relatedProducts.length > 0
                    ? data.metadata.relatedProducts.join(", ")
                    : "No related products mapped"}
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-border bg-card p-4">
              <p className="mb-2 text-sm font-semibold text-foreground">
                Policy Grouping Hint
              </p>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {data?.metadata?.policyGroupingHint || "No grouping hint available."}
              </p>
            </div>

            <div className="rounded-lg border border-border bg-card p-4">
              <p className="mb-3 text-sm font-semibold text-foreground">Raw JSON</p>
              <pre
                style={{
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  fontSize: "12px",
                  lineHeight: 1.6,
                  color: "#0D1C3A",
                  margin: 0,
                }}
              >
                {JSON.stringify(data?.policy ?? {}, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}