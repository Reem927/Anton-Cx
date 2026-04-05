"use client";

import { useState, useCallback, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { SEED_POLICIES } from "@/lib/seed-data";
import { LibraryToolbar, type SortOption, type ViewMode } from "@/components/library/LibraryToolbar";
import { PolicyCard }        from "@/components/library/PolicyCard";
import { PolicyListTable }   from "@/components/library/PolicyListTable";
import { PolicyContextMenu } from "@/components/library/PolicyContextMenu";
import type { PolicyDocument } from "@/lib/types";

// ─── Derived constants ────────────────────────────────────────────────────────

const ALL_PAYERS = Array.from(new Set(SEED_POLICIES.map(p => p.payer_id))).sort();
const UNIQUE_PAYER_COUNT = ALL_PAYERS.length;
const TOTAL_COUNT = SEED_POLICIES.length;

const lastSynced = SEED_POLICIES.reduce(
  (acc, p) => (p.extracted_at > acc ? p.extracted_at : acc),
  ""
);
const LAST_SYNCED_LABEL = new Date(lastSynced).toLocaleDateString("en-US", {
  month: "short", day: "numeric", year: "numeric",
});

const COL_TEMPLATE: Record<number, string> = {
  2: "repeat(2, 1fr)",
  3: "repeat(3, 1fr)",
  4: "repeat(4, 1fr)",
  5: "repeat(5, 1fr)",
};

// ─── Filter + sort logic ──────────────────────────────────────────────────────

function applyFilters(
  policies:     PolicyDocument[],
  search:       string,
  payerFilter:  string,
  statusFilter: string,
  sort:         SortOption,
): PolicyDocument[] {
  const q = search.toLowerCase();
  const filtered = policies.filter(p => {
    if (q) {
      const matches =
        p.drug_name.toLowerCase().includes(q) ||
        p.drug_generic.toLowerCase().includes(q) ||
        p.j_code.toLowerCase().includes(q) ||
        p.payer_id.toLowerCase().includes(q);
      if (!matches) return false;
    }
    if (payerFilter  && p.payer_id         !== payerFilter)  return false;
    if (statusFilter && p.coverage_status  !== statusFilter) return false;
    return true;
  });

  return [...filtered].sort((a, b) => {
    switch (sort) {
      case "recent":
        return new Date(b.effective_date).getTime() - new Date(a.effective_date).getTime();
      case "drug":
        return a.drug_name.localeCompare(b.drug_name);
      case "payer":
        return a.payer_id.localeCompare(b.payer_id);
      case "changed":
        return b.changed_fields.length - a.changed_fields.length;
    }
  });
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PolicyLibraryPage() {
  const [view,         setView]         = useState<ViewMode>("card");
  const [cols,         setCols]         = useState(3);
  const [search,       setSearch]       = useState("");
  const [payerFilter,  setPayerFilter]  = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sort,         setSort]         = useState<SortOption>("recent");
  const [selectedIds,  setSelectedIds]  = useState<Set<string>>(new Set());
  const [contextMenu,  setContextMenu]  = useState<{
    policyId: string; x: number; y: number;
  } | null>(null);

  const filtered = useMemo(
    () => applyFilters(SEED_POLICIES, search, payerFilter, statusFilter, sort),
    [search, payerFilter, statusFilter, sort]
  );

  const changedPolicies   = useMemo(() => filtered.filter(p => p.changed_fields.length > 0), [filtered]);
  const unchangedPolicies = useMemo(() => filtered.filter(p => p.changed_fields.length === 0), [filtered]);
  const showSections =
    sort === "recent" && changedPolicies.length > 0 && unchangedPolicies.length > 0;

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
          {TOTAL_COUNT} policies · {UNIQUE_PAYER_COUNT} payers · Last synced {LAST_SYNCED_LABEL}
        </p>
      </div>

      <div style={{ marginBottom: "20px" }}>
        <LibraryToolbar
          search={search}
          payerFilter={payerFilter}
          statusFilter={statusFilter}
          sort={sort}
          view={view}
          cols={cols}
          resultCount={filtered.length}
          allPayers={ALL_PAYERS}
          onSearch={setSearch}
          onPayer={setPayerFilter}
          onStatus={setStatusFilter}
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
            {filtered.length === 0 ? (
              <EmptyState />
            ) : showSections ? (
              <>
                <SectionLabel label="Recently changed" />
                <PolicyGrid policies={changedPolicies} cols={cols} selectedIds={selectedIds} indexOffset={0} onSelect={toggleSelect} onContextMenu={openContextMenu} />
                <SectionLabel label="All policies" style={{ marginTop: "24px" }} />
                <PolicyGrid policies={unchangedPolicies} cols={cols} selectedIds={selectedIds} indexOffset={changedPolicies.length} onSelect={toggleSelect} onContextMenu={openContextMenu} />
              </>
            ) : (
              <>
                <SectionLabel label="All policies" />
                <PolicyGrid policies={filtered} cols={cols} selectedIds={selectedIds} indexOffset={0} onSelect={toggleSelect} onContextMenu={openContextMenu} />
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
            {filtered.length === 0 ? (
              <EmptyState />
            ) : (
              <PolicyListTable
                policies={filtered}
                selectedIds={selectedIds}
                onSelect={toggleSelect}
                onContextMenu={openContextMenu}
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
          onAction={() => {}}
        />
      )}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function PolicyGrid({
  policies, cols, selectedIds, indexOffset, onSelect, onContextMenu,
}: {
  policies:     PolicyDocument[];
  cols:         number;
  selectedIds:  Set<string>;
  indexOffset:  number;
  onSelect:     (id: string) => void;
  onContextMenu:(id: string, x: number, y: number) => void;
}) {
  return (
    <div
      style={{
        display:             "grid",
        gridTemplateColumns: COL_TEMPLATE[cols] ?? COL_TEMPLATE[3],
        gap:                 "12px",
      }}
    >
      {policies.map((policy, i) => (
        <PolicyCard
          key={policy.id}
          policy={policy}
          index={indexOffset + i}
          isSelected={selectedIds.has(policy.id)}
          onSelect={onSelect}
          onContextMenu={onContextMenu}
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

function EmptyState() {
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
      No policies match your filters.
    </div>
  );
}
