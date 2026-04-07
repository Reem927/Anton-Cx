"use client";

import { motion } from "framer-motion";

export type AlertSeverity = "high" | "medium" | "low";

export interface Alert {
  id:         string;
  severity:   AlertSeverity;
  drug_name:  string;
  payer_id:   string;
  message:    string;
  created_at: string;
}

interface AlertFeedProps {
  alerts: Alert[];
}

const SEVERITY_COLOR: Record<AlertSeverity, string> = {
  high:   "#B02020",
  medium: "#D4880A",
  low:    "#0F7A40",
};

export function AlertFeed({ alerts = [] }: Partial<AlertFeedProps>) {
  if (alerts.length === 0) {
    return (
      <div
        style={{
          textAlign:  "center",
          padding:    "32px 16px",
          fontFamily: "var(--font-dm-sans), Lato, sans-serif",
          fontSize:   "12px",
          color:      "#9AA3BB",
        }}
      >
        No alerts yet. Alerts appear when policy changes are detected.
      </div>
    );
  }

  return (
    <motion.ul
      className="flex flex-col"
      initial="hidden"
      animate="visible"
      variants={{
        hidden:  {},
        visible: { transition: { staggerChildren: 0.04 } },
      }}
      style={{ listStyle: "none", margin: 0, padding: 0 }}
    >
      {alerts.map((alert, i) => (
        <motion.li
          key={alert.id}
          variants={{
            hidden:  { opacity: 0, y: 8 },
            visible: {
              opacity:    1,
              y:          0,
              transition: {
                delay:     Math.min(i * 0.04, 0.2),
                type:      "spring",
                stiffness: 300,
                damping:   30,
              },
            },
          }}
          className="flex items-start gap-3 py-3 hover:bg-[#F3F5FA] transition-colors rounded px-2 -mx-2"
          style={{ borderBottom: "0.5px solid #E8EBF2" }}
        >
          {/* Severity dot */}
          <div
            className="flex-shrink-0 rounded-full mt-[5px]"
            style={{
              width:      "7px",
              height:     "7px",
              background: SEVERITY_COLOR[alert.severity],
            }}
          />

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-[2px]">
              <span
                style={{
                  fontFamily: "var(--font-syne), Lato, sans-serif",
                  fontSize:   "13px",
                  fontWeight: 700,
                  color:      "#0D1C3A",
                }}
              >
                {alert.drug_name}
              </span>
              <span
                style={{
                  fontFamily:    "var(--font-dm-mono), Lato, sans-serif",
                  fontSize:      "9px",
                  color:         "#A0AABB",
                  letterSpacing: "0.05em",
                }}
              >
                {alert.payer_id.toUpperCase()}
              </span>
            </div>
            <p
              style={{
                fontFamily: "var(--font-dm-sans), Lato, sans-serif",
                fontSize:   "12px",
                color:      "#6A7590",
                margin:     0,
              }}
            >
              {alert.message}
            </p>
          </div>

          <span
            style={{
              fontFamily:    "var(--font-dm-mono), Lato, sans-serif",
              fontSize:      "9px",
              color:         "#A0AABB",
              letterSpacing: "0.04em",
              flexShrink:    0,
              paddingTop:    "2px",
            }}
          >
            {formatDate(alert.created_at)}
          </span>
        </motion.li>
      ))}
    </motion.ul>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
