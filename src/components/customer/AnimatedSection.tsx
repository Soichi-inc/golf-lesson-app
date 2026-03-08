"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

type Props = {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  direction?: "up" | "left" | "right" | "none";
};

export function AnimatedSection({ children, className, delay = 0, direction = "up" }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  const initial = direction === "up"
    ? { opacity: 0, y: 40 }
    : direction === "left"
    ? { opacity: 0, x: -40 }
    : direction === "right"
    ? { opacity: 0, x: 40 }
    : { opacity: 0 };

  return (
    <motion.div
      ref={ref}
      initial={initial}
      animate={isInView ? { opacity: 1, y: 0, x: 0 } : initial}
      transition={{ duration: 0.8, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
