"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  ChevronDown,
  Heart,
  LogOut,
  Menu,
  Package,
  ShoppingBag,
  UserRound,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/lib/routes";
import { logoutAction } from "@/app/auth/actions";
import type { NavCategory, NavCollection } from "@/lib/data/navigation";

export type HeaderUser = { name: string; email: string; isStaff: boolean } | null;

/**
 * Mobile navigation drawer.
 *
 * Renders as a real dialog with `aria-modal`, closes on Escape, on backdrop tap,
 * and after navigation. Focus moves into the panel on open and the background
 * is marked `inert` so tabbing cannot wander behind the overlay.
 */
export function MobileNav({
  categories,
  collections,
  cartCount,
  wishlistCount,
  user,
}: {
  categories: NavCategory[];
  collections: NavCollection[];
  cartCount: number;
  wishlistCount: number;
  user: HeaderUser;
}) {
  const [open, setOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();

  // Close on navigation. Adjusted during render rather than in an effect: this is
  // a state reset driven by a value that already changed, so there is nothing to
  // synchronise with an external system.
  const [lastPathname, setLastPathname] = useState(pathname);
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setOpen(false);
    setCategoriesOpen(false);
  }

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.querySelector<HTMLElement>("a, button")?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      triggerRef.current?.focus();
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-expanded={open}
        aria-controls="mobile-nav"
        aria-label="Open menu"
        className="inline-flex h-10 w-10 items-center justify-center rounded-sm border border-ink-800 text-ink-200 transition-colors duration-200 hover:border-ink-600 hover:text-bone-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flame-500 xl:hidden"
      >
        <Menu className="h-5 w-5" aria-hidden="true" />
      </button>

      {open ? (
        <div className="fixed inset-0 z-[100] xl:hidden">
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className="absolute inset-0 animate-[fade-in_160ms_ease-out] cursor-default bg-ink-950/85 backdrop-blur-sm"
          />

          <div
            id="mobile-nav"
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="Site menu"
            className="relative flex h-full w-full animate-[slide-in_280ms_var(--ease-out-expo)] flex-col bg-[#111214]"
          >
            <div className="flex items-center justify-between border-b border-ink-800 px-4 py-3.5">
              <span className="label-caps text-ink-500">Menu</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="rounded-xs p-1 text-ink-400 transition-colors hover:text-bone-50"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto overscroll-contain">
              {/* Account actions */}
              <div className="border-b border-ink-800 p-4">
                {user ? (
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-col">
                      <p className="text-sm font-semibold text-bone-50">{user.name}</p>
                      <p className="truncate text-2xs text-ink-500">{user.email}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={ROUTES.account.overview}
                        className="inline-flex h-9 items-center gap-2 rounded-sm border border-ink-700 px-3 text-2xs font-semibold uppercase tracking-[0.08em] text-bone-50 transition-colors hover:bg-ink-800"
                      >
                        <UserRound className="h-3.5 w-3.5" aria-hidden="true" />
                        Account
                      </Link>
                      {user.isStaff ? (
                        <Link
                          href={ROUTES.admin.dashboard}
                          className="inline-flex h-9 items-center gap-2 rounded-sm border border-ink-700 px-3 text-2xs font-semibold uppercase tracking-[0.08em] text-bone-50 transition-colors hover:bg-ink-800"
                        >
                          <Package className="h-3.5 w-3.5" aria-hidden="true" />
                          Dashboard
                        </Link>
                      ) : null}
                      <form action={logoutAction}>
                        <button
                          type="submit"
                          className="inline-flex h-9 items-center gap-2 rounded-sm border border-ink-700 px-3 text-2xs font-semibold uppercase tracking-[0.08em] text-bone-50 transition-colors hover:bg-ink-800"
                        >
                          <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                          Sign out
                        </button>
                      </form>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    <p className="text-2xs leading-relaxed text-ink-400">
                      Sign in to track orders, save your wishlist across devices and check out faster.
                    </p>
                    <div className="flex gap-2">
                      <Link
                        href={ROUTES.auth.login}
                        className="inline-flex h-10 flex-1 items-center justify-center rounded-sm bg-flame-500 px-3 text-2xs font-semibold uppercase tracking-[0.08em] text-ink-950 transition-colors hover:bg-flame-400"
                      >
                        Sign in
                      </Link>
                      <Link
                        href={ROUTES.auth.register}
                        className="inline-flex h-10 flex-1 items-center justify-center rounded-sm border border-ink-600 px-3 text-2xs font-semibold uppercase tracking-[0.08em] text-bone-50 transition-colors hover:bg-ink-800"
                      >
                        Register
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/*
                Primary destinations, mirroring the desktop bar one-for-one.
                The accordion below is the same information again, but it is
                collapsed and labelled "browsing"; these are the direct routes a
                returning rider actually taps.
              */}
              {/* Six core destinations — large type, arrow right,
                  staggered entrance at 60ms steps. */}
              <ul className="border-b border-ink-800 px-4 py-4">
                {[
                  { href: ROUTES.shop, label: "Shop" },
                  { href: ROUTES.category("helmets"), label: "Helmets" },
                  { href: ROUTES.category("jackets"), label: "Jackets" },
                  { href: ROUTES.category("gloves"), label: "Gloves" },
                  { href: ROUTES.category("boots"), label: "Boots" },
                  { href: ROUTES.brands, label: "Brands" },
                ].map((item, i) => (
                  <li
                    key={item.href + item.label}
                    className="motion-safe:animate-[hero-rise_400ms_var(--ease-out-expo)_both]"
                    style={{ animationDelay: `${i * 60}ms` }}
                  >
                    <Link
                      href={item.href}
                      className="group flex items-center gap-4 py-3 transition-colors duration-200 hover:bg-ink-850"
                    >
                      <span className="flex-1 font-display text-[28px] leading-tight font-extrabold tracking-tight text-bone-50">
                        {item.label}
                      </span>
                      <ArrowRight
                        aria-hidden="true"
                        className="h-5 w-5 text-ink-600 transition-all duration-200 group-hover:translate-x-1 group-hover:text-flame-500"
                      />
                    </Link>
                  </li>
                ))}
              </ul>

              {/* Categories accordion */}
              <div className="border-b border-ink-800">
                <button
                  type="button"
                  onClick={() => setCategoriesOpen((value) => !value)}
                  aria-expanded={categoriesOpen}
                  aria-controls="mobile-nav-categories"
                  className="flex w-full items-center justify-between px-4 py-4 text-left"
                >
                  <span className="label-caps text-bone-50">Shop by category</span>
                  <ChevronDown
                    aria-hidden="true"
                    className={cn(
                      "h-4 w-4 text-ink-500 transition-transform duration-300 ease-(--ease-out-expo)",
                      categoriesOpen && "rotate-180 text-flame-400",
                    )}
                  />
                </button>

                <ul id="mobile-nav-categories" hidden={!categoriesOpen} className="pb-2">
                  {categories.map((category) => (
                    <li key={category.id}>
                      <Link
                        href={ROUTES.category(category.slug)}
                        className="flex items-center justify-between gap-3 py-2.5 pl-4 pr-4 text-sm text-ink-200 transition-colors hover:bg-ink-850 hover:text-flame-300"
                      >
                        {category.name}
                        <span className="text-2xs tabular-nums text-ink-600">{category.productCount}</span>
                      </Link>
                    </li>
                  ))}
<li>
                  <Link
                    href={ROUTES.shop}
                    className="flex items-center gap-2 py-2.5 pl-4 pr-4 text-2xs font-semibold uppercase tracking-[0.1em] text-flame-400"
                  >
                    View all products
                  </Link>
                </li>
                </ul>
              </div>

              {/* Brands directory, kept separate from the category accordion
                  because it is a store-level destination rather than a
                  department. */}
              <div className="border-b border-ink-800">
                <p className="label-caps px-4 pt-4 pb-1 text-ink-500">Brands</p>
                <Link
                  href={ROUTES.brands}
                  className="flex items-center justify-between px-4 py-3.5 text-sm text-bone-50 transition-colors hover:bg-ink-850"
                >
                  All brands
                  <ArrowRight aria-hidden="true" className="h-4 w-4 text-ink-600" />
                </Link>
              </div>

              {/* Shop by edit */}
              {collections.length > 0 ? (
                <div className="border-b border-ink-800 px-4 py-4">
                  <p className="label-caps mb-3 text-ink-500">Shop by edit</p>
                  <ul className="flex flex-wrap gap-2">
                    {collections.map((collection) => (
                      <li key={collection.slug}>
<Link
                        href={ROUTES.collection(collection.slug)}
                        className="inline-flex border border-ink-700 px-3 py-1.5 text-2xs font-semibold uppercase tracking-[0.08em] text-ink-200 transition-colors hover:border-flame-500 hover:text-flame-300"
                      >
                          {collection.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {/* Shortcuts */}
              <ul className="border-b border-ink-800">
                <li>
                  <Link
                    href={ROUTES.cart}
                    className="flex items-center justify-between px-4 py-3.5 text-sm text-ink-200 transition-colors hover:bg-ink-850 hover:text-bone-50"
                  >
                    <span className="inline-flex items-center gap-3">
                      <ShoppingBag className="h-4 w-4 text-ink-500" aria-hidden="true" />
                      Cart
                    </span>
                    {cartCount > 0 ? (
                      <span className="bg-flame-500 px-2 py-0.5 text-2xs font-bold tabular-nums text-ink-950">
                        {cartCount}
                      </span>
                    ) : null}
                  </Link>
                </li>
                <li>
                  <Link
                    href={ROUTES.wishlist}
                    className="flex items-center justify-between px-4 py-3.5 text-sm text-ink-200 transition-colors hover:bg-ink-850 hover:text-bone-50"
                  >
                    <span className="inline-flex items-center gap-3">
                      <Heart className="h-4 w-4 text-ink-500" aria-hidden="true" />
                      Wishlist
                    </span>
                    {wishlistCount > 0 ? (
                      <span className="bg-ink-800 px-2 py-0.5 text-2xs font-bold tabular-nums text-ink-200">
                        {wishlistCount}
                      </span>
                    ) : null}
                  </Link>
                </li>
                {!user ? (
                  <li>
                    <Link
                      href={ROUTES.account.wishlist}
                      className="flex items-center gap-3 px-4 py-3.5 text-sm text-ink-200 transition-colors hover:bg-ink-850 hover:text-bone-50"
                    >
                      <UserRound className="h-4 w-4 text-ink-500" aria-hidden="true" />
                      My account
                    </Link>
                  </li>
                ) : null}
              </ul>

              {/* Help */}
              <ul className="py-2">
                {[
                  { href: ROUTES.content.about, label: "Our story" },
                  { href: ROUTES.content.contact, label: "Contact the shop" },
                  { href: ROUTES.content.shipping, label: "Shipping & delivery" },
                  { href: ROUTES.content.returns, label: "Returns & exchanges" },
                  { href: ROUTES.content.warranty, label: "Warranty" },
                  { href: ROUTES.content.faq, label: "FAQ" },
                ].map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="block px-4 py-2.5 text-sm text-ink-300 transition-colors hover:bg-ink-850 hover:text-bone-50"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}