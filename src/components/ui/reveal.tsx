"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import {
  MOTION_DURATION,
  MOTION_EASE,
  VIEWPORT_ONCE,
  fadeUp,
} from "@/components/motion/motion-variants";

/**
 * Scroll reveal — the single viewport primitive.
 *
 * Container fades and lifts 24px once on entry (600ms expo-out); parents
 * stagger children by passing increasing `delay` (0.08s steps). Never
 * replays. Reduced-motion renders opacity-only with no movement.
 */
export function Reveal({
  children,
  className,
  delay = 0,
  y = 24,
  as = "div",
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  as?: "div" | "section" | "li" | "article" | "header";
}) {
  const reduceMotion = useReducedMotion();
  const Component = motion[as];

  return (
    <Component
      className={cn(className)}
      initial={reduceMotion ? { opacity: 0 } : { ...fadeUp.initial, y }}
      whileInView={fadeUp.inView}
      viewport={VIEWPORT_ONCE}
      transition={{ duration: MOTION_DURATION.reveal, delay, ease: [...MOTION_EASE] }}
    >
      {children}
    </Component>
  );
}
