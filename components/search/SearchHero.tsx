"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { getPersonaConfig } from "@/lib/persona";
import type { Persona } from "@/lib/types";

interface SearchHeroProps {
  persona:    Persona;
  onSearch:   (q: string) => void;
  activeFilter: string;
  onFilter:   (f: string) => void;
}

export function SearchHero({ persona, onSearch, activeFilter, onFilter }: SearchHeroProps) {
  const [query, setQuery]   = useState("");
  const config              = getPersonaConfig(persona);
  const containerRef        = useRef<HTMLDivElement>(null);

  // GSAP entrance for filter chips
  useGSAP(() => {
    if (!containerRef.current) return;
    gsap.fromTo(
      containerRef.current.querySelectorAll(".filter-chip"),
      { opacity: 0, y: 6 },
      { opacity: 1, y: 0, duration: 0.2, stagger: 0.04, ease: "power2.out" }
    );
  }, { scope: containerRef, dependencies: [persona] });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query);
  };

  return (
    <div ref={containerRef}>
      <form onSubmit={handleSubmit} className="mb-4">
        <div
          className="flex items-center gap-3 rounded-lg px-4"
          style={{
            background:   "#FFFFFF",
            borderWidth:  "0.5px",
            borderStyle:  "solid",
            borderColor:  "#E8EBF2",
            height:       "44px",
            transition:   "border-color 0.1s",
          }}
          onFocusCapture={(e) => (e.currentTarget.style.borderColor = "#C4D4F8")}
          onBlurCapture={(e) => (e.currentTarget.style.borderColor = "#E8EBF2")}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0">
            <circle cx="7" cy="7" r="5" stroke="#A0AABB" strokeWidth="1.25" />
            <path d="M11 11L14 14" stroke="#A0AABB" strokeWidth="1.25" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={config.searchLabel}
            className="flex-1 bg-transparent outline-none"
            style={{
              fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
              fontSize:   "14px",
              color:      "#0D1C3A",
            }}
          />
          {query && (
            <button
              type="button"
              onClick={() => { setQuery(""); onSearch(""); }}
              style={{ color: "#A0AABB", cursor: "pointer", fontSize: "18px", lineHeight: 1 }}
            >
              ×
            </button>
          )}
        </div>
      </form>

      {/* Filter chips */}
      <div className="flex items-center gap-2 flex-wrap">
        {config.filters.map((filter) => {
          const active = filter === activeFilter;
          return (
            <button
              key={filter}
              onClick={() => onFilter(filter)}
              className="filter-chip rounded px-3 py-[5px] transition-colors"
              style={{
                fontFamily:    "var(--font-dm-mono), 'DM Mono', monospace",
                fontSize:      "10px",
                fontWeight:    500,
                letterSpacing: "0.05em",
                background:    active ? "#EBF0FC" : "#FFFFFF",
                color:         active ? "#1B3A6B" : "#6A7590",
                borderWidth:   "0.5px",
                borderStyle:   "solid",
                borderColor:   active ? "#C4D4F8" : "#E8EBF2",
                cursor:        "pointer",
              }}
            >
              {filter}
            </button>
          );
        })}
      </div>
    </div>
  );
}
