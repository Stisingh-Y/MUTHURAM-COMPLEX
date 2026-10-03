"use client";

import { useEffect, useRef } from "react";

/**
 * ScrollProgress — 2px safety-orange bar pinned to the very top.
 *
 * `src/components/motion/scroll-progress.tsx`, rendered in `layout.tsx`
 * above the header. Transform-only (scaleX) for 60fps, rAF-throttled,
 * hidden entirely under `prefers-reduced-motion`.
 */
export function ScrollProgress() {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame: number | null = null;
    const read = () => {
      frame = null;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const progress = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      if (barRef.current) barRef.current.style.transform = `scaleX(${progress})`;
    };
    const onScroll = () => {
      if (frame !== null) return;
      frame = requestAnimationFrame(read);
    };

    read();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame !== null) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-0.5 bg-transparent"
    >
      <div
        ref={barRef}
        className="h-full w-full origin-left bg-flame-500"
        style={{ transform: "scaleX(0)" }}
      />
    </div>
  );
}
