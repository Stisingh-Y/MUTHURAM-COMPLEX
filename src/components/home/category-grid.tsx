"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { ArrowUpRight } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CategoryCard } from "@/components/home/category-card";
import { ROUTES } from "@/lib/routes";
import type { CategoryView } from "@/lib/data/products";

/**
 * CategorySection — "Shop by category" on `#F2F0EB`.
 *
 * `src/components/home/category-grid.tsx` (client: owns its GSAP reveals).
 * 128px desktop / 80px mobile padding, 4 equal 4/5 cards per row (2 on
 * tablet/mobile), 24px gaps (16px on mobile). Rounded 32px top overlap
 * eases the dark→light transition from the band above.
 *
 * Visibility safety (the section must NEVER depend on JS to appear):
 * - Default CSS is fully visible (`opacity: 1`, no transform). The hidden
 *   "from" state is applied only inside `gsap.context()` after mount, via
 *   `fromTo` with `immediateRender: false` — nothing is hidden before the
 *   trigger is armed.
 * - `toggleActions: "play none none none"` + `start: "top 90%"` (no
 *   `once: true` on a trigger that could be missed), `clearProps` on
 *   complete, and a 2s safety timer that force-shows everything if a
 *   trigger never fires (stale measurements, missed start, Strict Mode
 *   remount). Elements already in view on mount play immediately.
 * - Transform/opacity only (60fps); touch devices get plain fade-ups, no
 *   clip-path wipe.
 */

gsap.registerPlugin(ScrollTrigger);

export function CategoryGrid({ categories }: { categories: CategoryView[] }) {
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // Safety net: if any trigger has not fired 2s after mount, force
    // everything visible. Cleared on unmount / Strict Mode cleanup.
    const safety = window.setTimeout(() => {
      gsap.set(root.querySelectorAll(".cat-header-item,.category-card,.category-photo"), {
        clearProps: "opacity,transform,clipPath,willChange",
      });
    }, 2000);

    const ctx = gsap.context(() => {
      const coarse = window.matchMedia("(hover: none)").matches;
      const items = gsap.utils.toArray<HTMLElement>(".cat-header-item", root);
      const cards = gsap.utils.toArray<HTMLElement>(".category-card", root);
      const photos = gsap.utils.toArray<HTMLElement>(".category-photo", root);

      const reveal = (
        targets: HTMLElement[],
        vars: gsap.TweenVars,
        trigger: HTMLElement | string,
      ) => {
        if (targets.length === 0) return;
        gsap.fromTo(
          targets,
          { y: 32, opacity: 0 },
          {
            ...vars,
            y: 0,
            opacity: 1,
            duration: 0.8,
            ease: "power3.out",
            immediateRender: false,
            clearProps: "opacity,transform,willChange",
            scrollTrigger: {
              trigger,
              start: "top 90%",
              toggleActions: "play none none none",
            },
          },
        );
      };

      // Header: eyebrow → heading → subtext, 0.1 stagger.
      reveal(items, { stagger: 0.1, willChange: "transform" }, root);
      // Cards: 0.08 stagger.
      reveal(cards, { stagger: 0.08, willChange: "transform" }, ".cat-grid");

      // Clip-path wipe on the photo (desktop pointers only).
      if (!coarse && photos.length > 0) {
        gsap.fromTo(
          photos,
          { clipPath: "inset(100% 0 0 0)" },
          {
            clipPath: "inset(0% 0 0 0)",
            duration: 0.9,
            ease: "power3.out",
            stagger: 0.08,
            immediateRender: false,
            clearProps: "clipPath",
            scrollTrigger: {
              trigger: ".cat-grid",
              start: "top 90%",
              toggleActions: "play none none none",
            },
          },
        );
      }

      // Elements already in view on first paint (reload mid-page, back
      // navigation) may sit past their start — refresh so they play at once.
      ScrollTrigger.refresh();
    }, root);

    // Re-measure after fonts/images settle (late layout shifts move triggers).
    let cancelled = false;
    const refresh = () => {
      if (!cancelled) ScrollTrigger.refresh();
    };
    document.fonts?.ready.then(refresh);
    window.addEventListener("load", refresh);

    // Prevent leaks when navigating away (Strict Mode safe: revert
    // restores the visible-by-default CSS, never opacity 0).
    return () => {
      cancelled = true;
      window.clearTimeout(safety);
      window.removeEventListener("load", refresh);
      ctx.revert();
    };
  }, []);

  if (categories.length === 0) return null;

  return (
    <section
      ref={rootRef}
      aria-labelledby="categories-title"
      className="relative z-10 -mt-8 rounded-t-[32px] bg-[#F2F0EB] py-20 text-ink-950 lg:py-32"
    >
      <div className="mx-auto w-full max-w-[1280px] px-5 sm:px-8">
        {/* Section header */}
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-xl">
            <p className="cat-header-item label-caps text-flame-600">Shop by category</p>
            <h2
              id="categories-title"
              className="cat-header-item mt-4 font-display text-[32px] leading-[1.05] font-extrabold tracking-[-0.02em] lg:text-[48px]"
            >
              Everything you ride with
            </h2>
            <p className="cat-header-item mt-4 text-base leading-relaxed text-ink-950/60">
              Eight departments, one standard — start where your next trip needs it most.
            </p>
          </div>
          <Link
            href={ROUTES.shop}
            className="group relative inline-flex min-h-11 items-center gap-2 pb-1 text-[13px] font-bold tracking-[0.08em] text-ink-950 uppercase transition-colors duration-200 hover:text-flame-600 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-flame-600"
          >
            All Products
            <ArrowUpRight
              aria-hidden="true"
              className="h-4 w-4 transition-transform duration-200 ease-out group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            />
            {/* Sliding underline, draws in from the left. */}
            <span
              aria-hidden="true"
              className="absolute inset-x-0 bottom-0 h-0.5 origin-left scale-x-0 bg-flame-600 transition-transform duration-200 ease-out group-hover:scale-x-100 motion-reduce:transition-none"
            />
          </Link>
        </div>

        {/* 4 cols desktop / 2 tablet + mobile, 24px gaps (16px mobile). */}
        <ul className="cat-grid mt-10 grid grid-cols-2 gap-4 sm:mt-12 lg:grid-cols-4 lg:gap-6">
          {categories.slice(0, 8).map((category, index) => (
            <li key={category.id}>
              <CategoryCard category={category} index={index} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
