"use client";

import { useEffect } from "react";
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
    label: "Comparison Engine",
    icon:  <CompareIcon />,
  },
  {
    href:  "/changes",
    label: "Change tracker",
    icon:  <ChangeIcon />,
  },
];

const PLAYGROUND_NAV: NavItem[] = [
  {
    href:  "/ingestion",
    label: "Policy Ingestion",
    icon:  <IngestionIcon />,
  },
  {
    href:  "/policy-lib",
    label: "Policy Library",
    icon:  <LibraryIcon />,
  },
];

interface SidebarProps {
  expanded: boolean;
  onToggle: () => void;
}

export function Sidebar({ expanded, onToggle }: SidebarProps) {
  const sidebarRef = useRef<HTMLDivElement>(null);
  const pathname   = usePathname();

  // Persist state in localStorage
  useEffect(() => {
    const stored = localStorage.getItem(SIDEBAR_KEY);
    if (stored !== null && stored !== String(expanded)) {
      onToggle();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        {/* Divider */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.12 }}
              className="mx-[14px] my-3"
              style={{
                height: "0.5px",
                background: "#E8EBF2",
              }}
            />
          )}
        </AnimatePresence>
        <NavGroup
          label="PLAYGROUND"
          items={PLAYGROUND_NAV}
          expanded={expanded}
          pathname={pathname}
        />
      </nav>

      {/* Profile section */}
      <div
        className="p-3 flex items-center gap-3"
        style={{
          borderTop: "0.5px solid #E8EBF2",
          cursor: "pointer",
        }}
      >
        <div
          className="flex-shrink-0 flex items-center justify-center rounded-full"
          style={{
            width: "32px",
            height: "32px",
            background: "linear-gradient(135deg, #1B3A6B 0%, #2E6BE6 100%)",
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-syne), Syne, sans-serif",
              fontSize: "12px",
              fontWeight: 700,
              color: "#FFFFFF",
            }}
          >
            A
          </span>
        </div>
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.12 }}
              className="flex-1 min-w-0"
            >
              <p
                style={{
                  fontFamily: "var(--font-syne), Syne, sans-serif",
                  fontSize: "12px",
                  fontWeight: 700,
                  color: "#0D1C3A",
                  margin: 0,
                }}
              >
                Anton Rx
              </p>
              <p
                style={{
                  fontFamily: "var(--font-dm-mono), 'DM Mono', monospace",
                  fontSize: "9px",
                  color: "#A0AABB",
                  margin: 0,
                }}
              >
                Admin
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.aside>
  );
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

function CompareIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M2 4h5M2 8h5M2 12h5M9 4h5M9 8h5M9 12h5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
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

function IngestionIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M8 3v8M4 7l4-4 4 4" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3 13h10" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
    </svg>
  );
}

function ChangeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M2 4l3-3 3 3" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 1h5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
      <path d="M14 12l-3 3-3-3" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M11 15H6" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
    </svg>
  );
}

function LibraryIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
      <path d="M6 4v8M10 4v8" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
    </svg>
  );
}
