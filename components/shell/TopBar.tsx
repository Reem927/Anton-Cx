"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PersonaSwitcher } from "./PersonaSwitcher";
import type { Persona } from "@/lib/types";

interface TopBarProps {
  onSidebarToggle: () => void;
  sidebarExpanded: boolean;
  persona:         Persona;
  onPersonaChange: (p: Persona) => void;
  quarter?:        string;
}

export function TopBar({
  onSidebarToggle,
  sidebarExpanded,
  persona,
  onPersonaChange,
  quarter = "Q1 2026",
}: TopBarProps) {
  const pathname = usePathname();
  const crumb    = pathToCrumb(pathname);

  return (
    <header
      className="flex items-center gap-4 px-4 flex-shrink-0"
      style={{
        height:      "48px",
        background:  "#FFFFFF",
        borderBottom: "0.5px solid #E8EBF2",
        position:    "sticky",
        top:         0,
        zIndex:      50,
      }}
    >
      {/* Hamburger + Logo zone */}
      <div
        className="flex items-center gap-3 flex-shrink-0"
        style={{ width: sidebarExpanded ? 176 : 28 }}
      >
        <button
          onClick={onSidebarToggle}
          className="flex-shrink-0 flex flex-col gap-[4px] p-1 rounded hover:bg-[#F7F8FC] transition-colors"
          style={{ outline: "none" }}
          aria-label="Toggle sidebar"
        >
          <span
            style={{
              display:    "block",
              width:      "14px",
              height:     "1.5px",
              background: "#6A7590",
              borderRadius: "1px",
            }}
          />
          <span
            style={{
              display:    "block",
              width:      "14px",
              height:     "1.5px",
              background: "#6A7590",
              borderRadius: "1px",
            }}
          />
          <span
            style={{
              display:    "block",
              width:      "10px",
              height:     "1.5px",
              background: "#6A7590",
              borderRadius: "1px",
            }}
          />
        </button>

        {sidebarExpanded && (
          <Link
            href="/dashboard"
            style={{ textDecoration: "none" }}
            className="flex items-center gap-[6px]"
          >
            <span
              style={{
                fontFamily: "var(--font-syne), Lato, sans-serif",
                fontSize:   "15px",
                fontWeight: 800,
                color:      "#1B3A6B",
                letterSpacing: "-0.01em",
              }}
            >
              Anton Cx
            </span>
          </Link>
        )}
      </div>

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <span
          style={{
            fontFamily: "var(--font-dm-sans), Lato, sans-serif",
            fontSize:   "13px",
            color:      "#A0AABB",
          }}
        >
          /
        </span>
        <span
          style={{
            fontFamily: "var(--font-dm-sans), Lato, sans-serif",
            fontSize:   "13px",
            color:      "#0D1C3A",
            fontWeight: 500,
          }}
        >
          {crumb}
        </span>
      </div>

      {/* Right zone */}
      <div className="flex items-center gap-3 flex-shrink-0">
        {/* Quarter chip */}
        <span
          style={{
            fontFamily:    "var(--font-dm-mono), Lato, sans-serif",
            fontSize:      "10px",
            fontWeight:    500,
            color:         "#6A7590",
            background:    "#F7F8FC",
            borderWidth:   "0.5px",
            borderStyle:   "solid",
            borderColor:   "#E8EBF2",
            borderRadius:  "4px",
            padding:       "3px 8px",
            letterSpacing: "0.05em",
          }}
        >
          {quarter}
        </span>

        {/* Persona switcher */}
        <PersonaSwitcher current={persona} onChange={onPersonaChange} />
      </div>
    </header>
  );
}

function pathToCrumb(pathname: string): string {
  const map: Record<string, string> = {
    "/dashboard": "Dashboard",
    "/search":    "Policy Search",
    "/compare":   "Comparison Engine",
    "/upload":    "Upload & Extract",
    "/diff":      "Quarterly Diff",
    "/alerts":    "Alerts",
  };
  return map[pathname] ?? map[pathname.split("/").slice(0, 2).join("/")] ?? "Anton Cx";
}
