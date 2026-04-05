"use client";

import { motion } from "framer-motion";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { getPersonaConfig } from "@/lib/persona";
import type { Persona } from "@/lib/types";

interface MetricData {
  payersTracked?:    number;
  policiesIndexed?:  number;
  changedThisQtr?:   number;
  paRequired?:       number;
  payersCovering?:   number;
  openAccess?:       number;
  biosimilarExposed?: number;
  drugsBenchmarked?: number;
  moreRestrictive?:  number;
  morePermissive?:   number;
  policyChanges?:    number;
}

interface MetricCardsProps {
  persona: Persona;
  data:    MetricData;
}

export function MetricCards({ persona, data }: MetricCardsProps) {
  const config = getPersonaConfig(persona);

  const VALUES: Record<string, number> = {
    payersTracked:    data.payersTracked    ?? 48,
    policiesIndexed:  data.policiesIndexed  ?? 1247,
    changedThisQtr:   data.changedThisQtr   ?? 83,
    paRequired:       data.paRequired       ?? 71,
    payersCovering:   data.payersCovering   ?? 36,
    openAccess:       data.openAccess       ?? 12,
    biosimilarExposed: data.biosimilarExposed ?? 8,
    drugsBenchmarked: data.drugsBenchmarked ?? 127,
    moreRestrictive:  data.moreRestrictive  ?? 14,
    morePermissive:   data.morePermissive   ?? 9,
    policyChanges:    data.policyChanges    ?? 83,
  };

  return (
    <motion.div
      className="grid gap-3"
      style={{ gridTemplateColumns: "repeat(4, 1fr)" }}
      initial="hidden"
      animate="visible"
      variants={{
        hidden:  {},
        visible: { transition: { staggerChildren: 0.06 } },
      }}
    >
      {config.metricCards.map((card, i) => (
        <motion.div
          key={card.key}
          variants={{
            hidden:  { opacity: 0, y: 12 },
            visible: {
              opacity:    1,
              y:          0,
              transition: {
                type:      "spring",
                stiffness: 300,
                damping:   30,
                delay:     Math.min(i * 0.06, 0.2),
              },
            },
          }}
          className="rounded-lg p-4"
          style={{
            background:   "#FFFFFF",
            borderWidth:  "0.5px",
            borderStyle:  "solid",
            borderColor:  "#E8EBF2",
          }}
        >
          <div
            style={{
              fontFamily:    "var(--font-dm-mono), Lato, sans-serif",
              fontSize:      "9px",
              fontWeight:    500,
              letterSpacing: "0.08em",
              color:         "#A0AABB",
              marginBottom:  "8px",
            }}
          >
            {card.label}
          </div>
          <div
            style={{
              fontFamily: "var(--font-syne), Lato, sans-serif",
              fontSize:   "28px",
              fontWeight: 800,
              color:      "#0D1C3A",
              lineHeight: 1,
            }}
          >
            <AnimatedNumber value={VALUES[card.key] ?? 0} />
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}
