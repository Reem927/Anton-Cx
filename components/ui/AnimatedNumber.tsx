"use client";

import { useEffect } from "react";
import { useSpring, useMotionValue, useTransform, motion } from "framer-motion";

interface AnimatedNumberProps {
  value:     number;
  suffix?:   string;
  prefix?:   string;
  decimals?: number;
  className?: string;
}

export function AnimatedNumber({
  value,
  suffix = "",
  prefix = "",
  decimals = 0,
  className = "",
}: AnimatedNumberProps) {
  const motionVal = useMotionValue(0);
  const spring    = useSpring(motionVal, {
    stiffness: 75,
    damping:   15,
    mass:      0.8,
  });
  const displayed = useTransform(spring, (v) =>
    `${prefix}${v.toFixed(decimals)}${suffix}`
  );

  useEffect(() => {
    motionVal.set(value);
  }, [value, motionVal]);

  return (
    <motion.span className={className}>
      {displayed}
    </motion.span>
  );
}
