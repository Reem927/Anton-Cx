"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const MOCK_USER = {
  name:  "Anton Rx",
  email: "admin@antonrx.com",
  initials: "A",
};

export function UserMenu() {
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
      <button
        onClick={() => setOpen(prev => !prev)}
        style={{
          width:        "28px",
          height:       "28px",
          borderRadius: "50%",
          background:   "#1B3A6B",
          border:       "none",
          fontFamily:   "var(--font-syne), Syne, sans-serif",
          fontSize:     "11px",
          fontWeight:   700,
          color:        "#FFFFFF",
          cursor:       "pointer",
          flexShrink:   0,
        }}
      >
        {MOCK_USER.initials}
      </button>

      {open && (
        <div
          style={{
            position:    "absolute",
            top:         "calc(100% + 8px)",
            right:       0,
            background:  "#FFFFFF",
            borderWidth: "0.5px",
            borderStyle: "solid",
            borderColor: "#E8EBF2",
            borderRadius:"10px",
            padding:     "6px",
            minWidth:    "220px",
            boxShadow:   "0 8px 24px rgba(0,0,0,0.10)",
            zIndex:      200,
          }}
        >
          {/* User identity */}
          <div style={{ padding: "8px 10px 10px", borderBottom: "0.5px solid #E8EBF2", marginBottom: "4px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div
                style={{
                  width:        "32px",
                  height:       "32px",
                  borderRadius: "50%",
                  background:   "linear-gradient(135deg, #1B3A6B 0%, #2E6BE6 100%)",
                  display:      "flex",
                  alignItems:   "center",
                  justifyContent: "center",
                  flexShrink:   0,
                  fontFamily:   "var(--font-syne), Syne, sans-serif",
                  fontSize:     "13px",
                  fontWeight:   700,
                  color:        "#FFFFFF",
                }}
              >
                {MOCK_USER.initials}
              </div>
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontFamily:   "var(--font-dm-sans), 'DM Sans', sans-serif",
                    fontSize:     "13px",
                    fontWeight:   600,
                    color:        "#0D1C3A",
                    overflow:     "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace:   "nowrap",
                  }}
                >
                  {MOCK_USER.name}
                </div>
                <div
                  style={{
                    fontFamily:   "var(--font-dm-sans), 'DM Sans', sans-serif",
                    fontSize:     "11px",
                    color:        "#9AA3BB",
                    overflow:     "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace:   "nowrap",
                  }}
                >
                  {MOCK_USER.email}
                </div>
              </div>
            </div>
          </div>

          <MenuItem
            label="Account Profile"
            icon={<ProfileIcon />}
            href="/settings?section=profile"
            onClick={() => setOpen(false)}
          />
          <MenuItem
            label="Settings"
            icon={<SettingsIcon />}
            href="/settings"
            onClick={() => setOpen(false)}
          />

          <div style={{ height: "0.5px", background: "#E8EBF2", margin: "4px 0" }} />

          <MenuItem
            label="Log out"
            icon={<LogOutIcon />}
            danger
            onClick={() => {
              setOpen(false);
              router.push("/login");
            }}
          />
        </div>
      )}
    </div>
  );
}

function MenuItem({
  label, icon, href, danger, onClick,
}: {
  label:    string;
  icon:     React.ReactNode;
  href?:    string;
  danger?:  boolean;
  onClick?: () => void;
}) {
  const style: React.CSSProperties = {
    display:      "flex",
    alignItems:   "center",
    gap:          "9px",
    width:        "100%",
    padding:      "7px 10px",
    borderRadius: "6px",
    border:       "none",
    background:   "transparent",
    cursor:       "pointer",
    fontFamily:   "var(--font-dm-sans), 'DM Sans', sans-serif",
    fontSize:     "13px",
    color:        danger ? "#B02020" : "#0D1C3A",
    textAlign:    "left",
    textDecoration: "none",
  };

  const iconColor = danger ? "#B02020" : "#9AA3BB";

  const inner = (
    <>
      <span style={{ display: "flex", color: iconColor }}>{icon}</span>
      {label}
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        onClick={onClick}
        style={style}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#F3F5FA"; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
      >
        {inner}
      </Link>
    );
  }

  return (
    <button
      onClick={onClick}
      style={style}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#F3F5FA"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
    >
      {inner}
    </button>
  );
}

function ProfileIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
      <circle cx="7.5" cy="5" r="3" stroke="currentColor" strokeWidth="1.2" />
      <path d="M2 13c0-3 2.5-5 5.5-5s5.5 2 5.5 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
      <circle cx="7.5" cy="7.5" r="2" stroke="currentColor" strokeWidth="1.2" />
      <path
        d="M7.5 1.5v1M7.5 12.5v1M1.5 7.5h1M12.5 7.5h1M3.4 3.4l.7.7M10.9 10.9l.7.7M10.9 3.4l-.7.7M3.4 10.9l.7-.7"
        stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"
      />
    </svg>
  );
}

function LogOutIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
      <path d="M6 2H3a1 1 0 00-1 1v9a1 1 0 001 1h3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M10 10l3-2.5L10 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5.5 7.5h7.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}
