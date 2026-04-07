"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useProfile } from "@/lib/profile-context";

const SLIDES = [
  {
    title: "Welcome to Anton Cx",
    description:
      "Your centralized intelligence platform for medical benefit drug clinical policy documents. We currently cover 7 major payers — with more being added soon.",
    icon: <WelcomeIcon />,
  },
  {
    title: "Ingest policies in seconds",
    description:
      "Upload PDFs, paste URLs, or fetch by drug name. Our AI extracts coverage status, prior auth criteria, step therapy, and more — automatically.",
    icon: <IngestIcon />,
  },
  {
    title: "Compare across payers",
    description:
      "Side-by-side comparison grid highlights conflicts, changes, and agreements across payer policies for any drug.",
    icon: <CompareIcon />,
  },
  {
    title: "Search with natural language",
    description:
      'Ask questions like "Does Cigna cover Keytruda for lung cancer?" and get sourced, structured answers instantly.',
    icon: <SearchIcon />,
  },
  {
    title: "You're all set!",
    description:
      "Head to the Dashboard to get started. You can always revisit features from the sidebar.",
    icon: <ReadyIcon />,
  },
];

export function OnboardingOverlay() {
  const { profile, loading, updateProfile } = useProfile();
  const [show, setShow]   = useState(true);
  const [slide, setSlide] = useState(0);

  const complete = useCallback(async () => {
    setShow(false);
    await updateProfile({ onboarding_completed: true });
  }, [updateProfile]);

  // Don't render while loading, if no profile, or if onboarding is already done
  if (loading || !profile || profile.onboarding_completed || !show) return null;

  const isLast = slide === SLIDES.length - 1;
  const current = SLIDES[slide];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(11, 28, 55, 0.55)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        style={{
          width: "100%",
          maxWidth: "520px",
          background: "#FFFFFF",
          borderRadius: "20px",
          boxShadow: "0 32px 80px rgba(11, 28, 55, 0.20)",
          overflow: "hidden",
        }}
      >
        {/* Slide content */}
        <div style={{ padding: "40px 36px 24px", textAlign: "center" }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={slide}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <div
                style={{
                  width: "64px",
                  height: "64px",
                  borderRadius: "16px",
                  background: "#EBF0FC",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 20px",
                }}
              >
                {current.icon}
              </div>
              <h2
                style={{
                  fontFamily: "Lato, sans-serif",
                  fontSize: "22px",
                  fontWeight: 900,
                  color: "#1B3A6B",
                  marginBottom: "12px",
                }}
              >
                {current.title}
              </h2>
              <p
                style={{
                  fontFamily: "Lato, sans-serif",
                  fontSize: "14px",
                  lineHeight: 1.7,
                  color: "#6A7590",
                  maxWidth: "400px",
                  margin: "0 auto",
                }}
              >
                {current.description}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Progress dots */}
        <div style={{ display: "flex", justifyContent: "center", gap: "8px", padding: "0 0 24px" }}>
          {SLIDES.map((_, i) => (
            <div
              key={i}
              style={{
                width: i === slide ? "20px" : "8px",
                height: "8px",
                borderRadius: "4px",
                background: i === slide ? "#2E6BE6" : "#E8EBF2",
                transition: "all 200ms",
              }}
            />
          ))}
        </div>

        {/* Actions */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "16px 36px 28px",
            borderTop: "0.5px solid #E8EBF2",
          }}
        >
          <button
            onClick={complete}
            style={{
              background: "none",
              border: "none",
              fontFamily: "Lato, sans-serif",
              fontSize: "13px",
              color: "#A0AABB",
              cursor: "pointer",
              padding: "6px 0",
            }}
          >
            Skip tour
          </button>

          <div style={{ display: "flex", gap: "10px" }}>
            {slide > 0 && (
              <button
                onClick={() => setSlide((s) => s - 1)}
                style={{
                  padding: "10px 18px",
                  borderRadius: "8px",
                  border: "0.5px solid #E8EBF2",
                  background: "#FFFFFF",
                  fontFamily: "Lato, sans-serif",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#6A7590",
                  cursor: "pointer",
                }}
              >
                Back
              </button>
            )}
            <button
              onClick={isLast ? complete : () => setSlide((s) => s + 1)}
              style={{
                padding: "10px 22px",
                borderRadius: "8px",
                border: "none",
                background: "#2E6BE6",
                fontFamily: "Lato, sans-serif",
                fontSize: "13px",
                fontWeight: 700,
                color: "#FFFFFF",
                cursor: "pointer",
              }}
            >
              {isLast ? "Get started" : "Next"}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Slide icons ────────────────────────────────────────────────────────────

function WelcomeIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <path d="M14 3l3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z" stroke="#2E6BE6" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

function IngestIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <path d="M14 6v12M8 12l6-6 6 6" stroke="#2E6BE6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6 22h16" stroke="#2E6BE6" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function CompareIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <path d="M4 8h8M4 14h8M4 20h8M16 8h8M16 14h8M16 20h8" stroke="#2E6BE6" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <circle cx="12" cy="12" r="7" stroke="#2E6BE6" strokeWidth="1.5" />
      <path d="M18 18l5 5" stroke="#2E6BE6" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function ReadyIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <circle cx="14" cy="14" r="10" stroke="#2E6BE6" strokeWidth="1.5" />
      <path d="M9 14l3 3 7-7" stroke="#2E6BE6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
