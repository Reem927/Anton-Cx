"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { StatusPill } from "@/components/ui/StatusPill";
import { PAYER_ABBR, PAYER_DISPLAY } from "./utils";
import type { DrugGroup } from "@/app/(app)/policy-lib/page";

const STATUS_STRIPE: Record<string, string> = {
  covered:          "#0F7A40",
  not_covered:      "#B02020",
  no_policy_found:  "#6B7BA4",
  pharmacy_only:    "#D4880A",
};

const STATUS_ICON_BG: Record<string, string> = {
  covered:          "#EDFAF3",
  not_covered:      "#FEE8E8",
  no_policy_found:  "#F0F2FA",
  pharmacy_only:    "#FFF4E0",
};

const STATUS_ICON_COLOR: Record<string, string> = {
  covered:          "#0F7A40",
  not_covered:      "#B02020",
  no_policy_found:  "#6B7BA4",
  pharmacy_only:    "#D4880A",
};

const STATUS_LINE_ACCENT: Record<string, string> = {
  covered:          "#B8EDD0",
  not_covered:      "#F5C0C0",
  no_policy_found:  "#D0D6E8",
  pharmacy_only:    "#F5D898",
};


interface Props {
  group:       DrugGroup;
  index:       number;
  isSelected:  boolean;
  onSelect:    (id: string) => void;
  onContextMenu: (id: string, x: number, y: number) => void;
  onDownload?: (group: DrugGroup) => void;
}

export function PolicyCard({ group, index, isSelected, onSelect, onContextMenu, onDownload }: Props) {
  const [isHovered, setIsHovered] = useState(false);

  // Use the "best" status for stripe color — covered > pharmacy_only > no_policy > not_covered
  const primaryStatus = group.policies.some(p => p.coverage_status === "covered")
    ? "covered"
    : group.policies.some(p => p.coverage_status === "pharmacy_only")
    ? "pharmacy_only"
    : group.policies.some(p => p.coverage_status === "no_policy_found")
    ? "no_policy_found"
    : "not_covered";

  const stripeColor  = STATUS_STRIPE[primaryStatus]  ?? "#9AA3BB";
  const iconBg       = STATUS_ICON_BG[primaryStatus]    ?? "#F0F2FA";
  const iconColor    = STATUS_ICON_COLOR[primaryStatus]  ?? "#6B7BA4";
  const accentLine   = STATUS_LINE_ACCENT[primaryStatus] ?? "#E2E6F0";

  const payerLabels = group.payer_ids.map(id =>
    PAYER_DISPLAY[id] ?? id.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase())
  );
  const payerAbbrs = group.payer_ids.map(id =>
    PAYER_ABBR[id] ?? id.slice(0, 3).toUpperCase()
  );
  const hasChanged = group.hasChanges;
  const groupId = group.drug_generic.toLowerCase();

  const borderWidth = isSelected ? "1.5px" : "0.5px";
  const borderColor = isSelected ? "#2E6BE6" : isHovered ? "#C4D4F8" : "#E8EBF2";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        type:      "spring",
        stiffness: 300,
        damping:   30,
        delay:     Math.min(index * 0.04, 0.2),
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        background:   "#FFFFFF",
        borderWidth,
        borderStyle:  "solid",
        borderColor,
        borderRadius: "10px",
        cursor:       "pointer",
        position:     "relative",
        transition:   "border-color 100ms",
        overflow:     "hidden",
      }}
    >
      <div
        style={{
          height:       "110px",
          background:   "#F7F8FC",
          borderBottom: "0.5px solid #E8EBF2",
          position:     "relative",
          overflow:     "hidden",
        }}
      >

        <div style={{ height: "3px", background: stripeColor, width: "100%" }} />


        <div
          style={{
            padding:       "10px 12px",
            pointerEvents: "none",
            display:       "flex",
            flexDirection: "column",
            gap:           "5px",
          }}
        >
          <div style={{ height: "9px", background: "#C4D4F8", width: "65%", borderRadius: "4px" }} />
          <div style={{ height: "6px", background: "#E2E6F0", width: "100%", borderRadius: "3px" }} />
          <div style={{ height: "6px", background: "#E2E6F0", width: "80%", borderRadius: "3px" }} />
          <div style={{ height: "6px", background: accentLine, width: "65%", borderRadius: "3px" }} />
          <div style={{ height: "6px", background: "#E2E6F0", width: "100%", borderRadius: "3px" }} />
          <div style={{ height: "6px", background: "#E2E6F0", width: "45%", borderRadius: "3px" }} />
        </div>


        <div
          style={{
            position:     "absolute",
            bottom:       "8px",
            right:        "8px",
            display:      "flex",
            gap:          "3px",
          }}
        >
          {payerAbbrs.map(abbr => (
            <span
              key={abbr}
              style={{
                background:   "#FFFFFF",
                borderWidth:  "0.5px",
                borderStyle:  "solid",
                borderColor:  "#E8EBF2",
                borderRadius: "4px",
                padding:      "2px 6px",
                fontFamily:   "var(--font-dm-mono), 'DM Mono', monospace",
                fontSize:     "10px",
                fontWeight:   700,
                color:        "#6B7BA4",
              }}
            >
              {abbr}
            </span>
          ))}
        </div>


        <button
          onClick={e => { e.stopPropagation(); onSelect(groupId); }}
          style={{
            position:     "absolute",
            top:          "8px",
            left:         "8px",
            width:        "18px",
            height:       "18px",
            borderRadius: "50%",
            border:       isSelected ? "1.5px solid #2E6BE6" : "1.5px solid #C4D4F8",
            background:   isSelected ? "#2E6BE6" : "#FFFFFF",
            display:      "flex",
            alignItems:   "center",
            justifyContent: "center",
            cursor:       "pointer",
            opacity:      isHovered || isSelected ? 1 : 0,
            transition:   "opacity 100ms",
            padding:      0,
          }}
        >
          {isSelected && (
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M2 5l2.5 2.5L8 3" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </button>


        {isHovered && (
          <div
            style={{
              position:   "absolute",
              top:        "8px",
              right:      "8px",
              display:    "flex",
              gap:        "4px",
            }}
          >
            <ActionBtn title="Download PDF" onClick={e => { e.stopPropagation(); onDownload?.(group); }}>
              <DownloadIcon />
            </ActionBtn>
            <ActionBtn title="View diff" onClick={e => e.stopPropagation()}>
              <DiffIcon />
            </ActionBtn>
          </div>
        )}
      </div>

      <div
        style={{
          padding:  "9px 11px 10px",
          display:  "flex",
          alignItems: "center",
          gap:      "8px",
        }}
      >

        <div
          style={{
            width:        "26px",
            height:       "26px",
            borderRadius: "5px",
            background:   iconBg,
            display:      "flex",
            alignItems:   "center",
            justifyContent: "center",
            flexShrink:   0,
          }}
        >
          <DocIcon color={iconColor} />
        </div>


        <div style={{ flex: 1, minWidth: 0, overflow: "hidden" }}>
          <div
            style={{
              fontFamily:  "var(--font-dm-sans), 'DM Sans', sans-serif",
              fontSize:    "12px",
              fontWeight:  600,
              color:       "#1B3A6B",
              whiteSpace:  "nowrap",
              overflow:    "hidden",
              textOverflow:"ellipsis",
            }}
          >
            {group.drug_name}
          </div>
          <div
            style={{
              fontFamily:  "var(--font-dm-mono), 'DM Mono', monospace",
              fontSize:    "10px",
              color:       "#9AA3BB",
              whiteSpace:  "nowrap",
              overflow:    "hidden",
              textOverflow:"ellipsis",
              marginTop:   "2px",
            }}
          >
            {group.j_code || "—"} · {payerLabels.join(" | ")}
          </div>
        </div>


        <div style={{ display: "flex", alignItems: "center", gap: "5px", flexShrink: 0 }}>
          {hasChanged && (
            <div
              title="Changed this quarter"
              style={{
                width:        "5px",
                height:       "5px",
                borderRadius: "50%",
                background:   "#2E6BE6",
                flexShrink:   0,
              }}
            />
          )}
          <StatusPill status={primaryStatus} />
          <button
            onClick={e => {
              e.stopPropagation();
              onContextMenu(groupId, e.clientX, e.clientY);
            }}
            style={{
              width:      "22px",
              height:     "22px",
              borderRadius:"50%",
              border:     "none",
              background: "transparent",
              display:    "flex",
              alignItems: "center",
              justifyContent:"center",
              cursor:     "pointer",
              opacity:    isHovered ? 1 : 0,
              transition: "opacity 100ms",
              padding:    0,
              color:      "#9AA3BB",
            }}
          >
            <KebabIcon />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function ActionBtn({
  title, onClick, children,
}: {
  title: string; onClick: React.MouseEventHandler; children: React.ReactNode;
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      style={{
        width:       "24px",
        height:      "24px",
        borderRadius:"50%",
        background:  "rgba(255,255,255,0.95)",
        borderWidth: "0.5px",
        borderStyle: "solid",
        borderColor: "#E8EBF2",
        display:     "flex",
        alignItems:  "center",
        justifyContent:"center",
        cursor:      "pointer",
        padding:     0,
        color:       "#6B7BA4",
      }}
    >
      {children}
    </button>
  );
}

function DocIcon({ color }: { color: string }) {
  return (
    <svg width="12" height="14" viewBox="0 0 12 14" fill="none">
      <path
        d="M2 1h6l3 3v9H2V1z"
        stroke={color} strokeWidth="1.2" strokeLinejoin="round"
      />
      <path d="M8 1v3h3" stroke={color} strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M3 7h6M3 9.5h6M3 12h3" stroke={color} strokeWidth="1" strokeLinecap="round" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path d="M6 2v6M3.5 6l2.5 2 2.5-2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M1.5 10h9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function DiffIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path d="M1.5 3h9M1.5 6h6M1.5 9h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function KebabIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <circle cx="7" cy="3.5" r="1" fill="currentColor" />
      <circle cx="7" cy="7"   r="1" fill="currentColor" />
      <circle cx="7" cy="10.5" r="1" fill="currentColor" />
    </svg>
  );
}
