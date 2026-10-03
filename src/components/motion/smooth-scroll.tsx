"use client";

import Lenis from "lenis";
import { usePathname } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * SmoothScroll — Lenis + GSAP ScrollTrigger provider.
 *
 * Lives in `src/components/motion/smooth-scroll.tsx`, mounted once in
 * `src/app/layout.tsx` around the whole page chrome.
 *
 * - duration 1.1, expo easing, `smoothWheel` on / `smoothTouch` off so
 *   mobile keeps fast native scrolling.
 * - Lenis feeds ScrollTrigger via `gsap.ticker` with `lagSmoothing(0)`.
 * - Route changes scroll to top; browser back/forward restores position
 *   (`history.scrollRestoration = "manual"` would break that, so we leave
 *   the browser default and only force top on fresh navigations).
 * - `prefers-reduced-motion` disables Lenis and every animation entirely.
 */

gsap.registerPlugin(ScrollTrigger);

/** Last scroll position per pathname, for back/forward restoration. */
const savedPositions = new Map<string, number>();
/** Set by the `popstate` listener so the next pathname effect restores. */
const restoredBackNav = { current: false };
/**
 * Module-level Lenis handle. Guards against React Strict Mode double-mount
 * creating two instances (two drivers fighting over `window.scrollY` was one
 * source of scroll flicker) and lets route changes drive the live instance.
 */
let lenisInstance: Lenis | null = null;

/** Scroll to top through Lenis when live, native instant jump otherwise. */
export function smoothScrollToTop(): void {
  if (lenisInstance) lenisInstance.scrollTo(0);
  else window.scrollTo({ top: 0, behavior: "auto" });
}

export function SmoothScroll({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  /* Route change: drop stale triggers, jump via Lenis (never native
     `window.scrollTo`, which fights the smooth driver and flashes), then
     refresh measurements once the new page has laid out. */
  useEffect(() => {
    ScrollTrigger.getAll().forEach((trigger) => trigger.kill());

    if (restoredBackNav.current) {
      restoredBackNav.current = false;
      const top = savedPositions.get(pathname) ?? 0;
      if (lenisInstance) lenisInstance.scrollTo(top, { immediate: true });
      else window.scrollTo({ top, behavior: "instant" as ScrollBehavior });
    } else if (lenisInstance) {
      lenisInstance.scrollTo(0, { immediate: true });
    } else {
      window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
    }

    const refresh = requestAnimationFrame(() => ScrollTrigger.refresh());
    const onLoad = () => ScrollTrigger.refresh();
    window.addEventListener("load", onLoad);
    // Late webfont swaps shift trigger positions — one debounced re-measure
    // (150ms) instead of repeated refreshes.
    let fontTimer: ReturnType<typeof setTimeout> | null = null;
    document.fonts?.ready.then(() => {
      if (fontTimer) clearTimeout(fontTimer);
      fontTimer = setTimeout(() => ScrollTrigger.refresh(), 150);
    });
    return () => {
      cancelAnimationFrame(refresh);
      window.removeEventListener("load", onLoad);
      if (fontTimer) clearTimeout(fontTimer);
    };
  }, [pathname]);

  /* Remember positions and flag back/forward traversals. */
  useEffect(() => {
    const onPopState = () => {
      restoredBackNav.current = true;
    };
    const save = () => savedPositions.set(pathname, window.scrollY);
    window.addEventListener("popstate", onPopState);
    window.addEventListener("pagehide", save);
    return () => {
      save();
      window.removeEventListener("popstate", onPopState);
      window.removeEventListener("pagehide", save);
    };
  }, [pathname]);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // Strict Mode remount: reuse the live instance instead of doubling it.
    if (lenisInstance) return;

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      // @ts-expect-error — supported by Lenis, missing from its types.
      smoothTouch: false,
      wheelMultiplier: 0.9,
    });
    lenisInstance = lenis;

    lenis.on("scroll", ScrollTrigger.update);
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(tick);
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
      lenis.destroy();
      if (lenisInstance === lenis) lenisInstance = null;
    };
  }, []);

  return <>{children}</>;
}
