"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";

const MOCK_USER = {
  name:     "Anton Rx",
  email:    "admin@antonrx.com",
  role:     "Admin",
  initials: "A",
};

interface Props {
  expanded: boolean;
}

export function UserMenu({ expanded }: Props) {
  const [open, setOpen] = useState(false);
  const ref             = useRef<HTMLDivElement>(null);
  const router          = useRouter();

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      {/* Trigger — mirrors the sidebar profile row */}
      <button
        onClick={() => setOpen(prev => !prev)}
        style={{
          display:     "flex",
          alignItems:  "center",
          gap:         "10px",
          width:       "100%",
          padding:     "10px 6px",
          justifyContent: "center",
          border:      "none",
          background:  open ? "#F0F4FB" : "transparent",
          cursor:      "pointer",
          textAlign:   "left",
          borderRadius:"0",
          transition:  "background 80ms",
        }}
        onMouseEnter={e => { if (!open) (e.currentTarget as HTMLElement).style.background = "#F7F8FC"; }}
        onMouseLeave={e => { if (!open) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
      >
        <div
          style={{
            width:          "32px",
            height:         "32px",
            borderRadius:   "50%",
            background:     "linear-gradient(135deg, #1B3A6B 0%, #2E6BE6 100%)",
            display:        "flex",
            alignItems:     "center",
            justifyContent: "center",
            flexShrink:     0,
            fontFamily:     "var(--font-syne), Syne, sans-serif",
            fontSize:       "12px",
            fontWeight:     700,
            color:          "#FFFFFF",
          }}
        >
          {MOCK_USER.initials}
        </div>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.12 }}
              style={{ flex: 1, minWidth: 0, overflow: "hidden" }}
            >
              <p style={{
                fontFamily:   "var(--font-syne), Syne, sans-serif",
                fontSize:     "12px",
                fontWeight:   700,
                color:        "#0D1C3A",
                margin:       0,
                whiteSpace:   "nowrap",
                overflow:     "hidden",
                textOverflow: "ellipsis",
              }}>
                {MOCK_USER.name}
              </p>
              <p style={{
                fontFamily: "var(--font-dm-mono), 'DM Mono', monospace",
                fontSize:   "9px",
                color:      "#A0AABB",
                margin:     0,
              }}>
                {MOCK_USER.role}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </button>

      {/* Dropdown — opens upward; shifts right when sidebar is collapsed */}
      {open && (
        <div
          style={{
            position:    "absolute",
            bottom:      "calc(100% + 8px)",
            left:        expanded ? "8px" : "0px",
            ...(expanded ? { right: "8px" } : {}),
            background:  "#FFFFFF",
            borderWidth: "0.5px",
            borderStyle: "solid",
            borderColor: "#E8EBF2",
            borderRadius:"12px",
            padding:     "6px",
            minWidth:    "200px",
            boxShadow:   "0 -4px 20px rgba(0,0,0,0.10)",
            zIndex:      200,
          }}
        >
          {/* User identity */}
          <div style={{
            padding:      "8px 10px 10px",
            borderBottom: "0.5px solid #E8EBF2",
            marginBottom: "4px",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
              <div style={{
                width:          "30px",
                height:         "30px",
                borderRadius:   "50%",
                background:     "linear-gradient(135deg, #1B3A6B 0%, #2E6BE6 100%)",
                display:        "flex",
                alignItems:     "center",
                justifyContent: "center",
                flexShrink:     0,
                fontFamily:     "var(--font-syne), Syne, sans-serif",
                fontSize:       "12px",
                fontWeight:     700,
                color:          "#FFFFFF",
              }}>
                {MOCK_USER.initials}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{
                  fontFamily:   "var(--font-dm-sans), 'DM Sans', sans-serif",
                  fontSize:     "13px",
                  fontWeight:   600,
                  color:        "#0D1C3A",
                  overflow:     "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace:   "nowrap",
                }}>
                  {MOCK_USER.name}
                </div>
                <div style={{
                  fontFamily:   "var(--font-dm-sans), 'DM Sans', sans-serif",
                  fontSize:     "11px",
                  color:        "#9AA3BB",
                  overflow:     "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace:   "nowrap",
                }}>
                  {MOCK_USER.email}
                </div>
              </div>
            </div>
          </div>

          <DropdownItem label="Account Profile" href="/settings?section=profile" onClose={() => setOpen(false)}>
            <ProfileIcon />
          </DropdownItem>
          <DropdownItem label="Settings" href="/settings?section=account" onClose={() => setOpen(false)}>
            <SettingsIcon />
          </DropdownItem>

          <div style={{ height: "0.5px", background: "#E8EBF2", margin: "4px 0" }} />

          <DropdownItem
            label="Log out"
            danger
            onClose={() => setOpen(false)}
            onClick={() => router.push("/")}
          >
            <LogOutIcon />
          </DropdownItem>
        </div>
      )}
    </div>
  );
}

function DropdownItem({
  label, href, danger, children, onClose, onClick,
}: {
  label:    string;
  href?:    string;
  danger?:  boolean;
  children: React.ReactNode;
  onClose:  () => void;
  onClick?: () => void;
}) {
  const sharedStyle: React.CSSProperties = {
    display:      "flex",
    alignItems:   "center",
    gap:          "9px",
    width:        "100%",
    padding:      "8px 10px",
    borderRadius: "7px",
    border:       "none",
    background:   "transparent",
    cursor:       "pointer",
    fontFamily:   "var(--font-dm-sans), 'DM Sans', sans-serif",
    fontSize:     "13px",
    color:        danger ? "#B02020" : "#0D1C3A",
    textAlign:    "left",
    textDecoration:"none",
  };

  const iconColor = danger ? "#B02020" : "#9AA3BB";

  const inner = (
    <>
      <span style={{ display: "flex", color: iconColor }}>{children}</span>
      {label}
    </>
  );

  const hoverOn  = (e: React.MouseEvent) => { (e.currentTarget as HTMLElement).style.background = "#F3F5FA"; };
  const hoverOff = (e: React.MouseEvent) => { (e.currentTarget as HTMLElement).style.background = "transparent"; };

  if (href) {
    return (
      <Link href={href} onClick={onClose} style={sharedStyle} onMouseEnter={hoverOn} onMouseLeave={hoverOff}>
        {inner}
      </Link>
    );
  }

  return (
    <button
      onClick={() => { onClose(); onClick?.(); }}
      style={sharedStyle}
      onMouseEnter={hoverOn}
      onMouseLeave={hoverOff}
    >
      {inner}
    </button>
  );
}

function ProfileIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <circle cx="7" cy="4.5" r="2.5" stroke="currentColor" strokeWidth="1.2" />
      <path d="M1.5 12c0-3 2.5-4.5 5.5-4.5s5.5 1.5 5.5 4.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <circle cx="7" cy="7" r="2" stroke="currentColor" strokeWidth="1.2" />
      <path d="M7 1.5v1M7 11.5v1M1.5 7h1M11.5 7h1M3.2 3.2l.7.7M10.1 10.1l.7.7M10.1 3.2l-.7.7M3.2 10.1l.7-.7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function LogOutIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M5.5 2H3a1 1 0 00-1 1v8a1 1 0 001 1h2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M9.5 9.5l2.5-2.5L9.5 4.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5.5 7h7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}
