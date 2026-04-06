"use client";

import { motion, AnimatePresence } from "framer-motion";

export type IngestionStage =
  | "idle"
  | "fetching"
  | "extracting"
  | "saving"
  | "success"
  | "error";

interface IngestionProgressProps {
  stage: IngestionStage;
  error?: string;
  policyCount?: number;
  onDismiss: () => void;
}

const STEPS = [
  { key: "fetching", label: "Fetching policy document" },
  { key: "extracting", label: "Extracting with Claude AI" },
  { key: "saving", label: "Saving to policy library" },
] as const;

const STAGE_ORDER: Record<string, number> = {
  fetching: 0,
  extracting: 1,
  saving: 2,
  success: 3,
};

export function IngestionProgress({
  stage,
  error,
  policyCount = 1,
  onDismiss,
}: IngestionProgressProps) {
  if (stage === "idle") return null;

  const currentIndex = STAGE_ORDER[stage] ?? -1;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="rounded-lg p-5 mt-6"
        style={{
          background: "#FFFFFF",
          borderWidth: "0.5px",
          borderStyle: "solid",
          borderColor: stage === "error" ? "#F5C0C0" : stage === "success" ? "#B8EDD0" : "#C4D4F8",
        }}
      >
        {/* Error state */}
        {stage === "error" && (
          <div className="flex items-start gap-3">
            <div
              className="flex-shrink-0 flex items-center justify-center rounded-full"
              style={{ width: 28, height: 28, background: "#FEE8E8" }}
            >
              <XIcon />
            </div>
            <div className="flex-1 min-w-0">
              <p
                style={{
                  fontFamily: "var(--font-dm-sans), Lato, sans-serif",
                  fontSize: "14px",
                  fontWeight: 500,
                  color: "#B02020",
                  margin: 0,
                  marginBottom: 4,
                }}
              >
                Extraction failed
              </p>
              <p
                style={{
                  fontFamily: "var(--font-dm-mono), Lato, sans-serif",
                  fontSize: "11px",
                  color: "#6A7590",
                  margin: 0,
                }}
              >
                {error ?? "Unknown error occurred"}
              </p>
            </div>
            <button
              onClick={onDismiss}
              style={{ color: "#A0AABB", cursor: "pointer", fontSize: 18, lineHeight: 1 }}
            >
              x
            </button>
          </div>
        )}

        {/* Success state */}
        {stage === "success" && (
          <div className="flex items-start gap-3">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="flex-shrink-0 flex items-center justify-center rounded-full"
              style={{ width: 28, height: 28, background: "#EDFAF3" }}
            >
              <CheckIcon />
            </motion.div>
            <div className="flex-1 min-w-0">
              <p
                style={{
                  fontFamily: "var(--font-dm-sans), Lato, sans-serif",
                  fontSize: "14px",
                  fontWeight: 500,
                  color: "#0F7A40",
                  margin: 0,
                  marginBottom: 4,
                }}
              >
                {policyCount === 1
                  ? "Policy added to library"
                  : `${policyCount} policies added to library`}
              </p>
              <p
                style={{
                  fontFamily: "var(--font-dm-mono), Lato, sans-serif",
                  fontSize: "11px",
                  color: "#6A7590",
                  margin: 0,
                }}
              >
                You can view and compare this policy in the Policy Library.
              </p>
            </div>
            <button
              onClick={onDismiss}
              style={{ color: "#A0AABB", cursor: "pointer", fontSize: 18, lineHeight: 1 }}
            >
              x
            </button>
          </div>
        )}

        {/* Loading steps */}
        {stage !== "error" && stage !== "success" && (
          <div className="flex flex-col gap-3">
            <p
              style={{
                fontFamily: "var(--font-dm-sans), Lato, sans-serif",
                fontSize: "13px",
                fontWeight: 500,
                color: "#0D1C3A",
                margin: 0,
                marginBottom: 4,
              }}
            >
              Processing policy...
            </p>
            {STEPS.map((step, i) => {
              const isActive = i === currentIndex;
              const isDone = i < currentIndex;
              const isPending = i > currentIndex;

              return (
                <div key={step.key} className="flex items-center gap-3">
                  {/* Step indicator */}
                  <div
                    className="flex-shrink-0 flex items-center justify-center rounded-full"
                    style={{
                      width: 22,
                      height: 22,
                      background: isDone ? "#EDFAF3" : isActive ? "#EBF0FC" : "#F7F8FC",
                      borderWidth: "0.5px",
                      borderStyle: "solid",
                      borderColor: isDone ? "#B8EDD0" : isActive ? "#C4D4F8" : "#E8EBF2",
                    }}
                  >
                    {isDone && <MiniCheck />}
                    {isActive && (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: "50%",
                          border: "1.5px solid #C4D4F8",
                          borderTopColor: "#2E6BE6",
                        }}
                      />
                    )}
                  </div>
                  <span
                    style={{
                      fontFamily: "var(--font-dm-sans), Lato, sans-serif",
                      fontSize: "13px",
                      color: isPending ? "#A0AABB" : isDone ? "#0F7A40" : "#0D1C3A",
                      fontWeight: isActive ? 500 : 400,
                    }}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M3 7l3 3 5-6" stroke="#0F7A40" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MiniCheck() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
      <path d="M2 5l2.5 2.5L8 3" stroke="#0F7A40" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M4 4l6 6M10 4l-6 6" stroke="#B02020" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
