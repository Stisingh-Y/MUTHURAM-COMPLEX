"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/lib/routes";
import type { NavCategory, NavCollection } from "@/lib/data/navigation";

/**
 * "Shop" mega menu.
 *
 * Opens on hover for pointers and on click or Enter/Space for everyone else,
 * and stays open while focus is anywhere inside it — so a keyboard rider can
 * Tab from the trigger straight into the panel. Escape closes it and returns
 * focus to the trigger.
 *
 * `usePathname` closes the menu after a navigation so it never covers the page
 * the rider just asked for.
 */
export function MegaMenu({
  categories,
  collections,
}: {
  categories: NavCategory[];
  collections: NavCollection[];
}) {
  const bySlug = (slug: string) => categories.find((c) => c.slug === slug);
  const coreSlugs = ["helmets", "jackets", "gloves", "boots"];
  const extra = categories.filter((c) => !coreSlugs.includes(c.slug));
  const featured = collections[0];
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();

  // Close on navigation. Adjusted during render rather than in an effect: this is
  // a state reset driven by a value that already changed, so there is nothing to
  // synchronise with an external system.
  const [lastPathname, setLastPathname] = useState(pathname);
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      triggerRef.current?.focus();
    };

    const onPointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  return (
    <div
      ref={containerRef}
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-haspopup="true"
        aria-controls="mega-menu-panel"
        onClick={() => setOpen((value) => !value)}
        className={cn(
          "group relative inline-flex items-center gap-1 rounded-xs py-2",
          "text-[13px] font-bold whitespace-nowrap uppercase transition-colors duration-200",
          open ? "text-white" : "text-[#D9D9D9] hover:text-white",
        )}
        style={{ letterSpacing: "0.08em" }}
      >
        <span className="inline-flex items-center gap-1">
          Shop
          <ChevronDown
            aria-hidden="true"
            className={cn("h-3.5 w-3.5 transition-transform duration-200 ease-out", open && "rotate-180")}
          />
        </span>
        <span
          aria-hidden="true"
          className={cn(
            "absolute inset-x-0 bottom-0 h-0.5 origin-left bg-flame-500 transition-transform duration-200 ease-out motion-reduce:transition-none",
            open ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100",
          )}
        />
      </button>

      <div
        id="mega-menu-panel"
        hidden={!open}
        className="absolute left-1/2 top-full z-40 w-[min(56rem,calc(100vw-2rem))] -translate-x-1/2 pt-4"
      >
        <div className="animate-[fade-in_180ms_var(--ease-out-expo)] relative overflow-hidden border border-ink-750 bg-ink-900 shadow-float">
          {/* Faint outlined MUTHURAM wordmark behind the panel */}
          <p
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 -bottom-5 z-0 text-center font-display text-[96px] leading-none font-black tracking-tight whitespace-nowrap text-transparent select-none [-webkit-text-stroke:1px_rgb(255_255_255/0.03)]"
          >
            MUTHURAM
          </p>

          {/* 4 columns, 24px gaps, small orange headings */}
          <div className="relative z-[1] grid gap-6 p-6 sm:grid-cols-2 lg:grid-cols-4">
            <MegaColumn
              heading="Riding gear"
              links={coreSlugs
                .map(bySlug)
                .filter((c) => c !== undefined)
                .map((c) => ({
                  href: ROUTES.category(c.slug),
                  label: c.name,
                  meta:
                    c.productCount > 0
                      ? `${c.productCount} ${c.productCount === 1 ? "product" : "products"}`
                      : undefined,
                }))}
            />
            <MegaColumn
              heading="Protection"
              links={[
                ...extra.map((c) => ({
                  href: ROUTES.category(c.slug),
                  label: c.name,
                })),
                { href: `${ROUTES.shop}?sale=1`, label: "Offers", badge: "SALE" },
              ]}
            />
            <MegaColumn
              heading="Collections"
              links={collections.slice(0, 6).map((collection) => ({
                href: ROUTES.collection(collection.slug),
                label: collection.name,
              }))}
            />
            {/* Featured card */}
            <div>
              <p className="label-caps mb-4 text-flame-500">Featured</p>
              <Link
                href={featured ? ROUTES.collection(featured.slug) : ROUTES.shop}
                className="group block overflow-hidden rounded-sm border border-ink-750 bg-ink-950 transition-colors duration-200 hover:border-flame-500/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flame-500"
              >
                <span className="block bg-gradient-to-br from-ink-800 via-ink-900 to-ink-950 px-4 py-6">
                  <span className="label-caps text-flame-400">New season</span>
                  <span className="mt-2 block font-display text-lg font-extrabold text-bone-50">
                    {featured?.name ?? "Shop all gear"}
                  </span>
                  <span className="mt-1 block text-xs text-ink-400">
                    {featured?.tagline ?? "Certified protection, head to toe."}
                  </span>
                </span>
                <span className="flex items-center gap-2 px-4 py-3 text-2xs font-bold tracking-[0.1em] text-bone-50 uppercase">
                  Shop now
                  <ArrowRight
                    aria-hidden="true"
                    className="h-3 w-3 text-flame-500 transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:group-hover:translate-x-0"
                  />
                </span>
              </Link>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.08] bg-ink-950/60 px-5 py-3.5">
            <Link
              href={ROUTES.shop}
              className="group inline-flex items-center gap-2 text-2xs font-semibold uppercase tracking-[0.12em] text-flame-400 transition-colors duration-200 hover:text-flame-300"
            >
              View the full catalogue
              <ArrowRight
                aria-hidden="true"
                className="h-3 w-3 transition-transform duration-300 ease-(--ease-out-expo) group-hover:translate-x-0.5 motion-reduce:group-hover:translate-x-0"
              />
            </Link>
            <Link
              href={ROUTES.content.about}
              className="text-2xs text-ink-500 transition-colors duration-200 hover:text-ink-300"
            >
              Why buy from us
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

/** One headed column inside the mega menu. */
function MegaColumn({
  heading,
  links,
}: {
  heading: string;
  links: { href: string; label: string; meta?: string; badge?: string }[];
}) {
  if (links.length === 0) return null;
  return (
    <div>
      <p className="label-caps mb-4 text-flame-500">{heading}</p>
      <ul className="flex flex-col gap-1">
        {links.map((link) => (
          <li key={link.href + link.label}>
            <Link
              href={link.href}
              className="group flex items-center justify-between gap-3 rounded-xs px-2 py-2 transition-colors duration-200 hover:bg-ink-850 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flame-500"
            >
              <span className="inline-flex items-center gap-2 text-sm font-medium text-ink-200 transition-colors duration-200 group-hover:text-bone-50">
                {link.label}
                {link.badge ? (
                  <span className="rounded-xs bg-flame-500 px-1.5 py-0.5 text-[10px] font-bold tracking-[0.08em] text-ink-950">
                    {link.badge}
                  </span>
                ) : null}
              </span>
              {link.meta ? <span className="text-2xs text-ink-500">{link.meta}</span> : null}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}