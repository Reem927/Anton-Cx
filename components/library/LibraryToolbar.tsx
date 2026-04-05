"use client";

export type SortOption = "recent" | "drug" | "payer" | "changed";
export type ViewMode   = "card" | "list";

interface Props {
  search:        string;
  payerFilter:   string;
  coverageFilter:string;
  tierFilter:    string;
  sort:          SortOption;
  view:          ViewMode;
  cols:          number;
  resultCount:   number;
  allPayers:     { id: string; label: string }[];
  onSearch:      (v: string) => void;
  onPayer:       (v: string) => void;
  onCoverage:    (v: string) => void;
  onTier:        (v: string) => void;
  onSort:        (v: SortOption) => void;
  onView:        (v: ViewMode) => void;
  onCols:        (v: number) => void;
}

const COVERAGE_OPTIONS = [
  { value: "",                 label: "All Coverage" },
  { value: "covered",          label: "Covered" },
  { value: "not_covered",      label: "Not Covered" },
  { value: "no_policy_found",  label: "No Policy Found" },
  { value: "pharmacy_only",    label: "Pharmacy Only" },
];

const TIER_OPTIONS = [
  { value: "",                    label: "All Tiers" },
  { value: "preferred_specialty", label: "Preferred Specialty" },
  { value: "non_specialty",       label: "Non-Specialty" },
  { value: "non_preferred",       label: "Non-Preferred" },
  { value: "not_covered",         label: "Not Covered" },
  { value: "none",                label: "No Tier Assigned" },
];

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "recent",  label: "Recent first" },
  { value: "drug",    label: "Drug name" },
  { value: "payer",   label: "Payer" },
  { value: "changed", label: "Changed first" },
];

const selectStyle: React.CSSProperties = {
  background:    "#FFFFFF",
  borderWidth:   "0.5px",
  borderStyle:   "solid",
  borderColor:   "#E8EBF2",
  borderRadius:  "7px",
  padding:       "5px 10px",
  fontFamily:    "var(--font-dm-sans), 'DM Sans', sans-serif",
  fontSize:      "12px",
  color:         "#1B3A6B",
  outline:       "none",
  cursor:        "pointer",
};

export function LibraryToolbar({
  search, payerFilter, coverageFilter, tierFilter, sort, view, cols, resultCount,
  allPayers, onSearch, onPayer, onCoverage, onTier, onSort, onView, onCols,
}: Props) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>

      <input
        type="text"
        value={search}
        onChange={e => onSearch(e.target.value)}
        placeholder="Drug, J-code, payer…"
        style={{
          background:   "#FFFFFF",
          borderWidth:  "0.5px",
          borderStyle:  "solid",
          borderColor:  "#E8EBF2",
          borderRadius: "7px",
          padding:      "5px 12px",
          fontFamily:   "var(--font-dm-sans), 'DM Sans', sans-serif",
          fontSize:     "12px",
          color:        "#1B3A6B",
          outline:      "none",
          maxWidth:     "240px",
          width:        "240px",
        }}
      />

      {/* Payer — built from actual data */}
      <select value={payerFilter} onChange={e => onPayer(e.target.value)} style={selectStyle}>
        <option value="">All Payers</option>
        {allPayers.map(p => (
          <option key={p.id} value={p.id}>{p.label}</option>
        ))}
      </select>

      {/* Coverage status */}
      <select value={coverageFilter} onChange={e => onCoverage(e.target.value)} style={selectStyle}>
        {COVERAGE_OPTIONS.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>

      {/* Formulary tier */}
      <select value={tierFilter} onChange={e => onTier(e.target.value)} style={selectStyle}>
        {TIER_OPTIONS.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>

      {/* Sort */}
      <select value={sort} onChange={e => onSort(e.target.value as SortOption)} style={selectStyle}>
        {SORT_OPTIONS.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>


      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "8px" }}>

        <span
          style={{
            fontFamily: "var(--font-dm-mono), 'DM Mono', monospace",
            fontSize:   "12px",
            color:      "#9AA3BB",
            whiteSpace: "nowrap",
          }}
        >
          {resultCount} {resultCount === 1 ? "policy" : "policies"}
        </span>


        {view === "card" && (
          <div style={{ display: "flex", gap: "2px" }}>
            {[2, 3, 4, 5].map(n => (
              <button
                key={n}
                onClick={() => onCols(n)}
                style={{
                  width:        "26px",
                  height:       "26px",
                  display:      "flex",
                  alignItems:   "center",
                  justifyContent: "center",
                  borderRadius: "5px",
                  border:       cols === n ? "0.5px solid #C4D4F8" : "0.5px solid transparent",
                  background:   cols === n ? "#EBF0FC" : "transparent",
                  fontFamily:   "var(--font-dm-mono), 'DM Mono', monospace",
                  fontSize:     "11px",
                  fontWeight:   cols === n ? 700 : 400,
                  color:        cols === n ? "#1B3A6B" : "#9AA3BB",
                  cursor:       "pointer",
                  transition:   "all 80ms",
                }}
              >
                {n}
              </button>
            ))}
          </div>
        )}


        <div
          style={{
            display:      "flex",
            background:   "#F7F8FC",
            borderWidth:  "0.5px",
            borderStyle:  "solid",
            borderColor:  "#E8EBF2",
            borderRadius: "7px",
            padding:      "2px",
            gap:          "2px",
          }}
        >
          <ViewBtn active={view === "card"} onClick={() => onView("card")} title="Card view">
            <CardViewIcon />
          </ViewBtn>
          <ViewBtn active={view === "list"} onClick={() => onView("list")} title="List view">
            <ListViewIcon />
          </ViewBtn>
        </div>
      </div>
    </div>
  );
}

function ViewBtn({
  active, onClick, title, children,
}: {
  active: boolean; onClick: () => void; title: string; children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        width:        "28px",
        height:       "26px",
        display:      "flex",
        alignItems:   "center",
        justifyContent:"center",
        borderRadius: "5px",
        border:       active ? "0.5px solid #E8EBF2" : "none",
        background:   active ? "#FFFFFF" : "transparent",
        cursor:       "pointer",
        color:        active ? "#1B3A6B" : "#9AA3BB",
        transition:   "all 80ms",
        boxShadow:    active ? "0 1px 3px rgba(0,0,0,0.06)" : "none",
      }}
    >
      {children}
    </button>
  );
}

function CardViewIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <rect x="1" y="1" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2" />
      <rect x="8" y="1" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2" />
      <rect x="1" y="8" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2" />
      <rect x="8" y="8" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

function ListViewIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M2 4h10M2 7h10M2 10h10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}
