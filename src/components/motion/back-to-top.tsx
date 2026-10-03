"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { smoothScrollToTop } from "@/components/motion/smooth-scroll";

/**
 * BackToTop — appears after 600px, smooth-scrolls to top.
 *
 * `src/components/motion/back-to-top.tsx`, rendered in `layout.tsx` after
 * `<main>`. 44px minimum tap target, safe-area aware, keyboard-focusable.
 */
export function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let frame: number | null = null;
    const read = () => {
      frame = null;
      setVisible(window.scrollY > 600);
    };
    const onScroll = () => {
      if (frame !== null) return;
      frame = requestAnimationFrame(read);
    };
    read();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame !== null) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <button
      type="button"
      aria-label="Back to top"
      aria-hidden={!visible}
      tabIndex={visible ? 0 : -1}
      onClick={smoothScrollToTop}
      className={cn(
        "fixed right-4 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-[80] flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-ink-900/90 text-bone-50 shadow-float backdrop-blur-md transition-[transform,opacity] duration-300 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flame-500 sm:right-6 sm:bottom-[calc(1.5rem+env(safe-area-inset-bottom))]",
        visible
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-4 opacity-0",
      )}
    >
      <ArrowUp className="h-5 w-5" aria-hidden="true" />
    </button>
  );
}
