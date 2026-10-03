"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/**
 * PageTransition — subtle route change choreography.
 *
 * `src/components/motion/page-transition.tsx`, wrapping `{children}` inside
 * `<main>` in `layout.tsx`.
 *
 * Uses the View Transitions API when the browser supports it (fade-out 200ms
 * + fade-in with 16px rise 400ms, defined in `globals.css`); otherwise falls
 * back to a pathname-keyed CSS enter animation. Skipped entirely under
 * `prefers-reduced-motion`.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div key={pathname} className="page-transition">
      {children}
    </div>
  );
}
