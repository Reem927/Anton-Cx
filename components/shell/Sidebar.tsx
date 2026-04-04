"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useRef } from "react";

const SIDEBAR_KEY = "anton-cx-sidebar";

interface NavItem {
  href:  string;
  label: string;
  icon:  React.ReactNode;
}

const CORE_NAV: NavItem[] = [
  {
    href:  "/dashboard",
    label: "Dashboard",
    icon:  <GridIcon />,
  },
  {
    href:  "/search",
    label: "Policy Search",
    icon:  <SearchIcon />,
  },
  {
    href:  "/compare",
    label: "Compare",
    icon:  <CompareIcon />,
  },
  {
    href:  "/upload",
    label: "Upload & Extract",
    icon:  <UploadIcon />,
  },
];

const REPORTS_NAV: NavItem[] = [
  {
    href:  "/diff",
    label: "Quarterly Diff",
    icon:  <DiffIcon />,
  },
  {
    href:  "/alerts",
    label: "Alerts",
    icon:  <AlertIcon />,
  },
];

const SETTINGS_NAV: NavItem[] = [
  {
    href:  "/settings/payer-config",
    label: "Payer Config",
    icon:  <SettingsIcon />,
  },
  {
    href:  "/settings/workspace",
    label: "Workspace",
    icon:  <WorkspaceIcon />,
  },
];

export function Sidebar() {
  const [expanded, setExpanded] = useState(true);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const pathname   = usePathname();

  // Persist state in localStorage
  useEffect(() => {
    const stored = localStorage.getItem(SIDEBAR_KEY);
    if (stored !== null) setExpanded(stored === "true");
  }, []);

  useEffect(() => {
    localStorage.setItem(SIDEBAR_KEY, String(expanded));
  }, [expanded]);

  // GSAP stagger on mount
  useGSAP(() => {
    if (!sidebarRef.current) return;
    gsap.fromTo(
      sidebarRef.current.querySelectorAll(".nav-item"),
      { opacity: 0, x: -8 },
      {
        opacity:  1,
        x:        0,
        duration: 0.2,
        stagger:  0.04,
        ease:     "power2.out",
      }
    );
  }, { scope: sidebarRef });

  return (
    <motion.aside
      ref={sidebarRef}
      layout
      animate={{ width: expanded ? 200 : 44 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="flex-shrink-0 flex flex-col overflow-hidden"
      style={{
        background:   "#FFFFFF",
        borderRight:  "0.5px solid #E8EBF2",
        minHeight:    "100%",
      }}
    >
      {/* Nav groups */}
      <nav className="flex-1 py-4 overflow-hidden">
        <NavGroup
          label="CORE"
          items={CORE_NAV}
          expanded={expanded}
          pathname={pathname}
        />
        <NavGroup
          label="REPORTS"
          items={REPORTS_NAV}
          expanded={expanded}
          pathname={pathname}
        />
        <NavGroup
          label="SETTINGS"
          items={SETTINGS_NAV}
          expanded={expanded}
          pathname={pathname}
        />
      </nav>
    </motion.aside>
  );
}

// Expose toggle so TopBar can call it
export function useSidebarState() {
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(SIDEBAR_KEY);
    if (stored !== null) setExpanded(stored === "true");
  }, []);

  const toggle = () => {
    setExpanded((prev) => {
      localStorage.setItem(SIDEBAR_KEY, String(!prev));
      return !prev;
    });
  };

  return { expanded, toggle };
}

function NavGroup({
  label,
  items,
  expanded,
  pathname,
}: {
  label:    string;
  items:    NavItem[];
  expanded: boolean;
  pathname: string;
}) {
  return (
    <div className="mb-4">
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
            className="px-[14px] mb-1"
            style={{
              fontFamily:    "var(--font-dm-mono), 'DM Mono', monospace",
              fontSize:      "9px",
              fontWeight:    500,
              letterSpacing: "0.08em",
              color:         "#A0AABB",
            }}
          >
            {label}
          </motion.div>
        )}
      </AnimatePresence>
      {items.map((item) => (
        <NavItem
          key={item.href}
          item={item}
          expanded={expanded}
          active={pathname === item.href || pathname.startsWith(item.href + "/")}
        />
      ))}
    </div>
  );
}

function NavItem({
  item,
  expanded,
  active,
}: {
  item:     NavItem;
  expanded: boolean;
  active:   boolean;
}) {
  return (
    <Link
      href={item.href}
      title={!expanded ? item.label : undefined}
      className="nav-item flex items-center gap-[10px] transition-colors"
      style={{
        padding:     "7px 14px",
        background:  active ? "#EBF0FC" : "transparent",
        borderRadius: "0",
        color:       active ? "#1B3A6B" : "#6A7590",
        textDecoration: "none",
        position:    "relative",
        minWidth:    0,
      }}
    >
      {/* Active indicator bar */}
      {active && (
        <motion.div
          layoutId="active-indicator"
          className="absolute left-0 top-1 bottom-1 rounded-r"
          style={{ width: "3px", background: "#2E6BE6" }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />
      )}

      <span
        className="flex-shrink-0"
        style={{
          color:    active ? "#1B3A6B" : "#A0AABB",
          display:  "flex",
          alignItems: "center",
        }}
      >
        {item.icon}
      </span>

      <AnimatePresence>
        {expanded && (
          <motion.span
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
            style={{
              fontFamily:  "var(--font-syne), Syne, sans-serif",
              fontSize:    "13px",
              fontWeight:  active ? 700 : 400,
              whiteSpace:  "nowrap",
              overflow:    "hidden",
            }}
          >
            {item.label}
          </motion.span>
        )}
      </AnimatePresence>
    </Link>
  );
}

// ─── Icons (16×16 inline SVGs) ───────────────────────────────────────────────

function GridIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="1" y="1" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.25" />
      <rect x="9" y="1" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.25" />
      <rect x="1" y="9" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.25" />
      <rect x="9" y="9" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.25" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.25" />
      <path d="M11 11L14 14" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
    </svg>
  );
}

function CompareIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M2 4h5M2 8h5M2 12h5M9 4h5M9 8h5M9 12h5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M8 10V3M5 6L8 3L11 6" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3 12h10" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
    </svg>
  );
}

function DiffIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M3 5h10M3 8h7M3 11h9" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
      <circle cx="13" cy="11" r="2" fill="#D4880A" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M8 2L14 13H2L8 2Z" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round" />
      <path d="M8 7v3" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
      <circle cx="8" cy="11.5" r="0.75" fill="currentColor" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.25" />
      <path d="M8 1v2M8 13v2M1 8h2M13 8h2M2.93 2.93l1.41 1.41M11.66 11.66l1.41 1.41M2.93 13.07l1.41-1.41M11.66 4.34l1.41-1.41" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
    </svg>
  );
}

function WorkspaceIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="1" y="3" width="14" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.25" />
      <path d="M5 13v2M11 13v2M3 15h10" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
    </svg>
  );
}
