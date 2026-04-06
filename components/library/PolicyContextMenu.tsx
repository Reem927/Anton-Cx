"use client";

import { useEffect, useRef } from "react";

interface Props {
  x: number;
  y: number;
  onClose: () => void;
  onAction: (action: string) => void;
}

const MENU_ITEMS: ({ id: string; label: string; danger?: boolean } | null)[] = [
  { id: "download", label: "Download PDF" },
  { id: "open",     label: "Open policy" },
  { id: "compare",  label: "Add to compare" },
  null,
  { id: "remove",   label: "Remove", danger: true },
];

export function PolicyContextMenu({ x, y, onClose, onAction }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  const left = Math.min(x, (typeof window !== "undefined" ? window.innerWidth : 1200) - 164);
  const top  = Math.min(y, (typeof window !== "undefined" ? window.innerHeight : 800) - 228);

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [onClose]);

  return (
    <div
      ref={ref}
      style={{
        position:     "fixed",
        left,
        top,
        background:   "#FFFFFF",
        borderWidth:  "0.5px",
        borderStyle:  "solid",
        borderColor:  "#E8EBF2",
        borderRadius: "8px",
        padding:      "4px",
        minWidth:     "156px",
        boxShadow:    "0 4px 16px rgba(0,0,0,0.09)",
        zIndex:       100,
      }}
    >
      {MENU_ITEMS.map((item, i) =>
        item === null ? (
          <div
            key={`divider-${i}`}
            style={{ height: "0.5px", background: "#E8EBF2", margin: "4px 0" }}
          />
        ) : (
          <MenuButton
            key={item.id}
            label={item.label}
            danger={!!item.danger}
            icon={<MenuIcon id={item.id} danger={!!item.danger} />}
            onClick={() => { onAction(item.id); onClose(); }}
          />
        )
      )}
    </div>
  );
}

function MenuButton({
  label, danger, icon, onClick,
}: {
  label: string; danger: boolean; icon: React.ReactNode; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display:     "flex",
        alignItems:  "center",
        gap:         "8px",
        width:       "100%",
        padding:     "7px 12px",
        borderRadius:"5px",
        border:      "none",
        background:  "transparent",
        cursor:      "pointer",
        fontFamily:  "var(--font-dm-sans), Lato, sans-serif",
        fontSize:    "12px",
        color:       danger ? "#B02020" : "#1B3A6B",
        textAlign:   "left",
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#F3F5FA"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
    >
      <span style={{ display: "flex", color: danger ? "#B02020" : "#9AA3BB" }}>{icon}</span>
      {label}
    </button>
  );
}

function MenuIcon({ id, danger }: { id: string; danger: boolean }) {
  const color = danger ? "#B02020" : "#9AA3BB";
  switch (id) {
    case "download":
      return (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M7 2v7M4 6l3 3 3-3" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M2 11h10" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      );
    case "open":
      return (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M2 2h4M2 2v10h10V8" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M8 2h4v4" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M6 8l6-6" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      );
    case "diff":
      return (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M2 4h10M2 7h7M2 10h5" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
          <path d="M10 9l2 2-2 2" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "compare":
      return (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M2 3h4M2 7h4M2 11h4M8 3h4M8 7h4M8 11h4" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      );
    case "remove":
      return (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M3 3l8 8M11 3l-8 8" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      );
    default:
      return null;
  }
}
