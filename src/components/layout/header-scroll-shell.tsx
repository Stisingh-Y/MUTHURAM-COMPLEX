"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Sticky header shell.
 *
 * Owns two booleans — `scrolled` (past the threshold) and `hidden`
 * (scrolling down) — and applies them to a wrapper. Everything inside
 * arrives as `children`, so the logo, navigation and mega menu stay Server
 * Components and never enter the client bundle; only this shell does.
 *
 * Flicker-proofing (all deliberate):
 * - ONE passive scroll listener, rAF-throttled, reading `window.scrollY`
 *   once per frame (no layout-triggering reads).
 * - State updates only when the value actually changes (refs compared
 *   before `setState`), so React never re-renders mid-scroll.
 * - Hysteresis on `scrolled`: on above 24px, off below 8px — hovering at
 *   the threshold cannot thrash the styles.
 * - Hide-on-scroll-down ignores deltas under 8px and never hides below
 *   100px, so slow scrolls and the top of the page stay stable.
 * - Constant 72px bar height (see `SiteHeader`): no height animation, so
 *   the sticky anchor never shifts layout while scrolling.
 * - Explicit transition properties only (no `transition-all`, no animated
 *   blur or box-shadow); the blur value itself never changes, only the
 *   background-color opacity and border color toggle.
 * - Compositor hints (`translateZ(0)`, `will-change`, backface hidden) so
 *   the hide/show transform never repaints.
 *
 * Server and first client render both output `false/false`, so there is no
 * hydration mismatch — all `window` reads live inside `useEffect`.
 */
export function HeaderScrollShell({ children }: { children: ReactNode }) {
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const frame = useRef<number | null>(null);
  const lastY = useRef(0);
  const scrolledRef = useRef(false);
  const hiddenRef = useRef(false);

  useEffect(() => {
    lastY.current = window.scrollY;

    const read = () => {
      const y = window.scrollY;
      const delta = y - lastY.current;

      // Hysteresis: engage glass above 40px, release below 12px.
      if (!scrolledRef.current && y > 40) {
        scrolledRef.current = true;
        setScrolled(true);
      } else if (scrolledRef.current && y < 12) {
        scrolledRef.current = false;
        setScrolled(false);
      }

      // Hide only on a decisive downward scroll, well below the top.
      // Small deltas (< 8px) and scrollY < 100px never hide.
      if (y < 100 || Math.abs(delta) < 8) {
        if (hiddenRef.current && (y < 100 || delta < 0)) {
          hiddenRef.current = false;
          setHidden(false);
        }
      } else if (delta > 0) {
        if (!hiddenRef.current && y > 300) {
          hiddenRef.current = true;
          setHidden(true);
        }
      } else {
        if (hiddenRef.current) {
          hiddenRef.current = false;
          setHidden(false);
        }
      }

      lastY.current = y;
    };

    const onScroll = () => {
      if (frame.current !== null) return;
      frame.current = requestAnimationFrame(() => {
        frame.current = null;
        read();
      });
    };

    read();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame.current !== null) cancelAnimationFrame(frame.current);
    };
  }, []);

  return (
    <div
      data-scrolled={scrolled ? "true" : "false"}
      data-hidden={hidden ? "true" : "false"}
      className={cn(
        // `group` so descendants can react to the same state.
        // Transparent over the hero; blurred glass + hairline border after 40px.
        "group sticky top-0 z-50 w-full border-b border-transparent bg-transparent transition-[transform,background-color,border-color,backdrop-filter] duration-300 ease-out [backface-visibility:hidden] [transform:translateZ(0)] [will-change:transform]",
        "data-[scrolled=true]:border-white/[0.08]",
        "data-[scrolled=true]:bg-[rgb(18_19_22/0.6)]",
        "data-[scrolled=true]:backdrop-blur-[14px] data-[scrolled=true]:backdrop-saturate-[140%]",
        "data-[hidden=true]:-translate-y-full",
      )}
    >
      {children}
      {/* 1px orange glow line along the header bottom */}
      <div
        aria-hidden="true"
        className={cn(
          "h-px bg-gradient-to-r from-transparent via-flame-500/70 to-transparent opacity-0 transition-opacity duration-200",
          scrolled && "opacity-100",
        )}
      />
    </div>
  );
}