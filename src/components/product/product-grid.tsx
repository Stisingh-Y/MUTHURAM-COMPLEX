"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ProductCard } from "@/components/product/product-card";
import type { ProductCardView } from "@/lib/data/products";

gsap.registerPlugin(ScrollTrigger);

/**
 * Responsive product grid.
 *
 * 4 columns on desktop, 3 on tablet, 2 on mobile (`grid-cols-2
 * md:grid-cols-3 xl:grid-cols-4`), equal-height cards, 24px gaps (16px on
 * mobile). Kept as a plain server component so a 24-card results page ships
 * no grid JavaScript — the entrance stagger comes from `Reveal` list items.
 *
 * Row gap is larger than column gap on purpose: cards are borderless, so vertical
 * separation is what stops adjacent products reading as one block.
 *
 * Entrance uses ONE `ScrollTrigger.batch` per grid (not one timeline per
 * card): opacity 0→1, y 24→0, stagger 0.06, 0.7s `power3.out`, starting at
 * "top 90%". Transform + opacity only; `will-change` is applied for the
 * animation and cleared on complete. Cards already in the viewport play
 * immediately via the batch's initial refresh.
 *
 * Visibility safety: default CSS is fully visible — the hidden "from" state
 * is set only inside the effect after mount, and a 2s timer force-clears any
 * stuck state. `prefers-reduced-motion` skips the animation entirely.
 */
export function ProductGrid({
  products,
  tone,
  priorityCount = 0,
  className,
  label = "Products",
}: {
  products: ProductCardView[];
  /** Surface the grid sits on. Forwarded to every card — see `ProductCard`. */
  tone: "dark" | "light";
  /** Number of leading cards to load eagerly — set for above-the-fold grids. */
  priorityCount?: number;
  className?: string;
  label?: string;
}) {
  const rootRef = useRef<HTMLUListElement>(null);
  const idsKey = products.map((p) => p.id).join(",");
  const firstRender = useRef(true);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const items = Array.from(root.querySelectorAll<HTMLElement>(".product-card-item"));
    if (items.length === 0) return;

    // Filter/sort swap (same mounted grid, new items): short 200ms
    // fade/stagger, no re-mount, no layout jump.
    if (!firstRender.current) {
      gsap.fromTo(
        items,
        { opacity: 0, y: 12 },
        {
          opacity: 1,
          y: 0,
          duration: 0.2,
          stagger: 0.02,
          ease: "power2.out",
          overwrite: true,
          clearProps: "opacity,transform,willChange",
        },
      );
      return;
    }
    firstRender.current = false;

    const safety = window.setTimeout(() => {
      gsap.set(items, { clearProps: "opacity,transform,willChange" });
    }, 2000);

    gsap.set(items, { opacity: 0, y: 24, willChange: "transform, opacity" });
    const triggers = ScrollTrigger.batch(items, {
      start: "top 90%",
      once: true,
      onEnter: (batch) =>
        gsap.to(batch, {
          opacity: 1,
          y: 0,
          duration: 0.7,
          stagger: 0.06,
          ease: "power3.out",
          overwrite: true,
          clearProps: "opacity,transform,willChange",
        }),
    });

    return () => {
      window.clearTimeout(safety);
      triggers.forEach((t) => t.kill());
      gsap.set(items, { clearProps: "opacity,transform,willChange" });
    };
  }, [idsKey]);

  return (
    <ul
      ref={rootRef}
      aria-label={label}
      className={[
        "grid grid-cols-2 gap-x-4 gap-y-9",
        "md:grid-cols-3 md:gap-x-5 md:gap-y-11",
        "xl:grid-cols-4 xl:gap-x-6",
        className ?? "",
      ].join(" ")}
    >
      {products.map((product, index) => (
        <li key={product.id} className="flex">
          <ProductCard
            product={product}
            tone={tone}
            priority={index < priorityCount}
            className="product-card-item w-full"
          />
        </li>
      ))}
    </ul>
  );
}
