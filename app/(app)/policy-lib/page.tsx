"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { LibraryToolbar, type SortOption, type ViewMode } from "@/components/library/LibraryToolbar";
import { PolicyCard }        from "@/components/library/PolicyCard";
import { PolicyListTable }   from "@/components/library/PolicyListTable";
import { PolicyContextMenu } from "@/components/library/PolicyContextMenu";
import { PAYER_DISPLAY }     from "@/components/library/utils";
import type { PolicyDocument } from "@/lib/types";

// ─── Drug group type ─────────────────────────────────────────────────────────

export interface DrugGroup {
  drug_name:    string;
  drug_generic: string;
  j_code:       string;
  policies:     PolicyDocument[];
  payer_ids:    string[];
  /** Most recent effective date across all payers */
  effective_date: string;
  /** True if any policy in the group has changed_fields */
  hasChanges:   boolean;
}

// ─── Filter + group logic ────────────────────────────────────────────────────

function applyFilters(
  policies:       PolicyDocument[],
  search:         string,
  payerFilter:    string,
  coverageFilter: string,
  tierFilter:     string,
): PolicyDocument[] {
  const q = search.toLowerCase();
  return policies.filter(p => {
    if (q) {
      const matches =
        p.drug_name.toLowerCase().includes(q) ||
        p.drug_generic.toLowerCase().includes(q) ||
        p.j_code.toLowerCase().includes(q) ||
        p.payer_id.toLowerCase().includes(q);
      if (!matches) return false;
    }
    if (payerFilter    && p.payer_id        !== payerFilter)    return false;
    if (coverageFilter && p.coverage_status !== coverageFilter) return false;
    if (tierFilter) {
      if (tierFilter === "none") {
        if (p.formulary_tier !== null) return false;
      } else {
        if (p.formulary_tier !== tierFilter) return false;
      }
    }
    return true;
  });
}

function groupByDrug(policies: PolicyDocument[], sort: SortOption): DrugGroup[] {
  const map = new Map<string, DrugGroup>();

  for (const p of policies) {
    const key = p.drug_generic.toLowerCase();
    const existing = map.get(key);
    if (existing) {
      existing.policies.push(p);
      if (!existing.payer_ids.includes(p.payer_id)) existing.payer_ids.push(p.payer_id);
      if (p.effective_date > existing.effective_date) existing.effective_date = p.effective_date;
      if (p.changed_fields.length > 0) existing.hasChanges = true;
    } else {
      map.set(key, {
        drug_name:      p.drug_name,
        drug_generic:   p.drug_generic,
        j_code:         p.j_code,
        policies:       [p],
        payer_ids:      [p.payer_id],
        effective_date: p.effective_date,
        hasChanges:     p.changed_fields.length > 0,
      });
    }
  }

  const groups = Array.from(map.values());

  return groups.sort((a, b) => {
    switch (sort) {
      case "recent":
        return new Date(b.effective_date).getTime() - new Date(a.effective_date).getTime();
      case "drug":
        return a.drug_name.localeCompare(b.drug_name);
      case "payer":
        return a.payer_ids.length - b.payer_ids.length;
      case "changed": {
        const ac = a.policies.filter(p => p.changed_fields.length > 0).length;
        const bc = b.policies.filter(p => p.changed_fields.length > 0).length;
        return bc - ac;
      }
    }
  });
}

// ─── PDF download helper ─────────────────────────────────────────────────────

async function downloadPolicyPdf(drugGeneric: string, drugName: string) {
  const res = await fetch(`/api/generate-pdf?drug=${encodeURIComponent(drugGeneric)}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Download failed" }));
    throw new Error(err.error ?? "Download failed");
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${drugName.replace(/\s+/g, "-")}-policy-report.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PolicyLibraryPage() {
  const [policies,       setPolicies]       = useState<PolicyDocument[]>([]);
  const [loading,        setLoading]        = useState(true);
  const [view,           setView]           = useState<ViewMode>("card");
  const [cols,           setCols]           = useState(3);
  const [search,         setSearch]         = useState("");
  const [payerFilter,    setPayerFilter]    = useState("");
  const [coverageFilter, setCoverageFilter] = useState("");
  const [tierFilter,     setTierFilter]     = useState("");
  const [sort,           setSort]           = useState<SortOption>("recent");
  const [selectedIds,    setSelectedIds]    = useState<Set<string>>(new Set());
  const [contextMenu,    setContextMenu]    = useState<{
    policyId: string; x: number; y: number;
  } | null>(null);
  const [downloading,    setDownloading]    = useState(false);

  // Fetch from Supabase on mount
  useEffect(() => {
    let cancelled = false;

    async function fetchPolicies() {
      try {
        const res = await fetch("/api/policies");
        if (!res.ok) throw new Error("fetch failed");
        const data: PolicyDocument[] = await res.json();
        if (!cancelled) setPolicies(data);
      } catch {
        // Supabase unavailable — show empty state
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchPolicies();
    return () => { cancelled = true; };
  }, []);

  // Derive payer list from actual data
  const allPayers = useMemo(() => {
    const ids = Array.from(new Set(policies.map(p => p.payer_id))).sort();
    return ids.map(id => ({
      id,
      label: PAYER_DISPLAY[id] ?? id.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase()),
    }));
  }, [policies]);

  const uniquePayers = allPayers.length;
  const totalCount = policies.length;

  const lastSynced = useMemo(() => {
    const latest = policies.reduce(
      (acc, p) => (p.extracted_at > acc ? p.extracted_at : acc), "",
    );
    return latest
      ? new Date(latest).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
      : "—";
  }, [policies]);

  const filtered = useMemo(
    () => applyFilters(policies, search, payerFilter, coverageFilter, tierFilter),
    [policies, search, payerFilter, coverageFilter, tierFilter],
  );

  const groups = useMemo(
    () => groupByDrug(filtered, sort),
    [filtered, sort],
  );

  const changedGroups   = useMemo(() => groups.filter(g => g.hasChanges), [groups]);
  const unchangedGroups = useMemo(() => groups.filter(g => !g.hasChanges), [groups]);
  const showSections =
    sort === "recent" && changedGroups.length > 0 && unchangedGroups.length > 0;

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const openContextMenu = useCallback((id: string, x: number, y: number) => {
    setContextMenu({ policyId: id, x, y });
  }, []);

  // ── Context menu + card download handler ────────────────────

  const triggerDownload = useCallback(async (group: DrugGroup) => {
    setDownloading(true);
    try {
      await downloadPolicyPdf(group.drug_generic, group.drug_name);
    } catch (err) {
      console.error("PDF download failed:", err);
    } finally {
      setDownloading(false);
    }
  }, []);

  const handleAction = useCallback(async (action: string) => {
    if (!contextMenu) return;
    // contextMenu.policyId is now drug_generic key
    const group = groups.find(g => g.drug_generic.toLowerCase() === contextMenu.policyId);
    if (!group) return;

    switch (action) {
      case "download":
        await triggerDownload(group);
        break;
      case "open":
        // Future: navigate to policy detail page
        break;
      case "diff":
        // Future: open diff viewer
        break;
      case "compare":
        // Future: add to comparison set
        break;
      case "remove":
        // Remove all policies in this group from local state
        setPolicies(prev => prev.filter(p => p.drug_generic.toLowerCase() !== group.drug_generic.toLowerCase()));
        break;
    }
  }, [contextMenu, groups, triggerDownload]);

  const COL_TEMPLATE: Record<number, string> = {
    2: "repeat(2, 1fr)",
    3: "repeat(3, 1fr)",
    4: "repeat(4, 1fr)",
    5: "repeat(5, 1fr)",
  };

  return (
    <div style={{ padding: "28px 32px", maxWidth: "1400px", margin: "0 auto" }}>

      <div style={{ marginBottom: "20px" }}>
        <h1
          style={{
            fontFamily: "var(--font-syne), Syne, sans-serif",
            fontSize:   "22px",
            fontWeight: 800,
            color:      "#1B3A6B",
            margin:     "0 0 4px",
          }}
        >
          Policy Library
        </h1>
        <p
          style={{
            fontFamily: "var(--font-dm-mono), 'DM Mono', monospace",
            fontSize:   "11px",
            color:      "#9AA3BB",
            margin:     0,
          }}
        >
          {loading ? "Loading…" : `${totalCount} policies · ${groups.length} drugs · ${uniquePayers} payers · Last synced ${lastSynced}`}
        </p>
      </div>

      {downloading && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background:   "#EBF0FC",
            borderWidth:  "0.5px",
            borderStyle:  "solid",
            borderColor:  "#C4D4F8",
            borderRadius: "8px",
            padding:      "10px 16px",
            marginBottom: "16px",
            fontFamily:   "var(--font-dm-sans), 'DM Sans', sans-serif",
            fontSize:     "13px",
            color:        "#1B3A6B",
            display:      "flex",
            alignItems:   "center",
            gap:          "10px",
          }}
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            style={{
              width: 14, height: 14, borderRadius: "50%",
              border: "2px solid #C4D4F8", borderTopColor: "#2E6BE6",
            }}
          />
          Generating PDF report…
        </motion.div>
      )}

      <div style={{ marginBottom: "20px" }}>
        <LibraryToolbar
          search={search}
          payerFilter={payerFilter}
          coverageFilter={coverageFilter}
          tierFilter={tierFilter}
          sort={sort}
          view={view}
          cols={cols}
          resultCount={filtered.length}
          allPayers={allPayers}
          onSearch={setSearch}
          onPayer={setPayerFilter}
          onCoverage={setCoverageFilter}
          onTier={setTierFilter}
          onSort={setSort}
          onView={setView}
          onCols={setCols}
        />
      </div>


      <AnimatePresence mode="wait">
        {view === "card" ? (
          <motion.div
            key="card"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {groups.length === 0 ? (
              <EmptyState loading={loading} />
            ) : showSections ? (
              <>
                <SectionLabel label="Recently changed" />
                <DrugGroupGrid groups={changedGroups} cols={cols} selectedIds={selectedIds} indexOffset={0} onSelect={toggleSelect} onContextMenu={openContextMenu} onDownload={triggerDownload} colTemplate={COL_TEMPLATE} />
                <SectionLabel label="All policies" style={{ marginTop: "24px" }} />
                <DrugGroupGrid groups={unchangedGroups} cols={cols} selectedIds={selectedIds} indexOffset={changedGroups.length} onSelect={toggleSelect} onContextMenu={openContextMenu} onDownload={triggerDownload} colTemplate={COL_TEMPLATE} />
              </>
            ) : (
              <>
                <SectionLabel label="All policies" />
                <DrugGroupGrid groups={groups} cols={cols} selectedIds={selectedIds} indexOffset={0} onSelect={toggleSelect} onContextMenu={openContextMenu} onDownload={triggerDownload} colTemplate={COL_TEMPLATE} />
              </>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {groups.length === 0 ? (
              <EmptyState loading={loading} />
            ) : (
              <PolicyListTable
                groups={groups}
                onContextMenu={openContextMenu}
                onDownload={triggerDownload}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>


      {contextMenu && (
        <PolicyContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          onAction={handleAction}
        />
      )}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function DrugGroupGrid({
  groups, cols, selectedIds, indexOffset, onSelect, onContextMenu, onDownload, colTemplate,
}: {
  groups:       DrugGroup[];
  cols:         number;
  selectedIds:  Set<string>;
  indexOffset:  number;
  onSelect:     (id: string) => void;
  onContextMenu:(id: string, x: number, y: number) => void;
  onDownload:   (group: DrugGroup) => void;
  colTemplate:  Record<number, string>;
}) {
  return (
    <div
      style={{
        display:             "grid",
        gridTemplateColumns: colTemplate[cols] ?? colTemplate[3],
        gap:                 "12px",
      }}
    >
      {groups.map((group, i) => (
        <PolicyCard
          key={group.drug_generic}
          group={group}
          index={indexOffset + i}
          isSelected={selectedIds.has(group.drug_generic)}
          onSelect={onSelect}
          onContextMenu={onContextMenu}
          onDownload={onDownload}
        />
      ))}
    </div>
  );
}

function SectionLabel({ label, style }: { label: string; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        fontFamily:    "var(--font-dm-mono), 'DM Mono', monospace",
        fontSize:      "11px",
        color:         "#9AA3BB",
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        marginBottom:  "10px",
        ...style,
      }}
    >
      {label}
    </div>
  );
}

function EmptyState({ loading }: { loading: boolean }) {
  return (
    <div
      style={{
        textAlign:  "center",
        padding:    "60px 0",
        fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
        fontSize:   "13px",
        color:      "#9AA3BB",
      }}
    >
      {loading
        ? "Loading policies…"
        : "No policies yet. Ingest a policy document to get started."}
    </div>
  );
}
