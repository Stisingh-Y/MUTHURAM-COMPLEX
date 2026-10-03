"use client";

import Link from "next/link";
import { useRef } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { ProductCard } from "@/components/product/product-card";
import { cn } from "@/lib/utils";
import type { ProductCardView } from "@/lib/data/products";

/**
 * Horizontal product rail.
 *
 * The cards themselves stay Server Components — only this scroller is a client
 * component, and it receives fully-mapped card views as serialisable props. So a
 * rail of eight products still ships no card code to the browser.
 *
 * Buttons scroll by one "page" (card width + gap) rather than to an index, which
 * keeps the scroll distance correct regardless of how many cards are visible.
 * `scroll-snap` makes the snap point match what the button just did.
 */
export function ProductRail({
  products,
  tone,
}: {
  products: ProductCardView[];
  /** Surface the rail sits on. Forwarded to every card. */
  tone: "dark" | "light";
}) {
  const trackRef = useRef<HTMLUListElement>(null);

  if (products.length === 0) return null;

  const scrollByPage = (direction: 1 | -1) => {
    const track = trackRef.current;
    if (!track) return;

    const first = track.firstElementChild as HTMLElement | null;
    const step = first ? first.offsetWidth + 16 : track.clientWidth * 0.8;
    track.scrollBy({ left: step * direction, behavior: "smooth" });
  };

  return (
    <div className="relative">
      <ul
        ref={trackRef}
        className="no-scrollbar -mx-5 flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth px-5 pb-2 md:mx-0 md:px-0"
      >
        {products.map((product, index) => (
          <li
            key={product.id}
            className="w-[70vw] shrink-0 snap-start sm:w-[43vw] md:w-[30vw] lg:w-[22vw] xl:w-[18rem]"
          >
            <ProductCard product={product} tone={tone} priority={index < 2} />
          </li>
        ))}
      </ul>

      <div className="mt-8 flex items-center justify-end gap-3">
        <RailButton label="Previous products" direction={-1} onClick={scrollByPage} tone={tone} />
        <RailButton label="Next products" direction={1} onClick={scrollByPage} tone={tone} />
      </div>
    </div>
  );
}

function RailButton({
  label,
  direction,
  onClick,
  tone,
}: {
  label: string;
  direction: 1 | -1;
  onClick: (direction: 1 | -1) => void;
  tone: "dark" | "light";
}) {
  const Icon = direction === 1 ? ArrowRight : ArrowLeft;
  const dark = tone === "dark";

  return (
    <button
      type="button"
      onClick={() => onClick(direction)}
      aria-label={label}
      className={cn(
        "inline-flex h-11 w-11 items-center justify-center border transition-colors duration-200",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flame-500",
        dark
          ? "border-ink-700 text-ink-300 hover:border-flame-500 hover:bg-ink-850 hover:text-flame-300"
          : "border-ink-950/15 text-ink-600 hover:border-flame-600 hover:text-flame-600",
      )}
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
    </button>
  );
}

/**
 * Rail fallback.
 *
 * Rendered on narrow viewports where a rail would just be a horizontally
 * scrolling grid with hidden affordances — a plain stacked grid is easier and
 * more honest there.
 */
export function ProductRailStackFallback({
  products,
  tone,
}: {
  products: ProductCardView[];
  tone: "dark" | "light";
}) {
  return (
    <ul className="grid grid-cols-2 gap-x-4 gap-y-9 sm:gap-x-5 sm:gap-y-11">
      {products.map((product) => (
        <li key={product.id}>
          <ProductCard product={product} tone={tone} />
        </li>
      ))}
    </ul>
  );
}

/**
 * "View all" link used under a rail.
 *
 * `tone` is explicit because the rails now sit on both white and dark bands:
 * safety orange is legible on graphite but fails contrast on warm white, where
 * a darker orange is needed. Passing it here avoids overriding the colour at
 * every call site.
 */
export function RailFooterLink({
  href,
  label,
  tone = "dark",
}: {
  href: string;
  label: string;
  /** Which surface the link sits on. */
  tone?: "dark" | "light";
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group relative inline-flex min-h-[44px] items-center gap-2 pb-1 text-[13px] font-bold tracking-[0.14em] uppercase transition-colors duration-200",
        tone === "light"
          ? "text-flame-600 hover:text-ink-950"
          : "text-flame-400 hover:text-flame-300",
      )}
    >
      {label}
      <ArrowRight
        aria-hidden="true"
        className="h-3.5 w-3.5 transition-transform duration-300 ease-(--ease-out-expo) group-hover:translate-x-1 motion-reduce:group-hover:translate-x-0"
      />
      <span
        aria-hidden="true"
        className={cn(
          "absolute inset-x-0 bottom-0 h-0.5 origin-left scale-x-0 transition-transform duration-300 ease-(--ease-out-expo) group-hover:scale-x-100 motion-reduce:transition-none",
          tone === "light" ? "bg-flame-600" : "bg-flame-400",
        )}
      />
    </Link>
  );
}