"use client";

import Link from "next/link";
import { Component, type ReactNode } from "react";
import { ROUTES } from "@/lib/routes";

/**
 * CategoryErrorBoundary — never show a blank band.
 *
 * If the animated category section throws (bad data, failed image, JS
 * error), render a plain fallback grid of category-name links instead of
 * an empty light section. Real `<a>` elements, keyboard-accessible.
 */
export class CategoryErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError(): { failed: boolean } {
    return { failed: true };
  }

  render() {
    if (!this.state.failed) return this.props.children;

    const fallback = [
      { slug: "helmets", label: "Helmets" },
      { slug: "jackets", label: "Jackets" },
      { slug: "gloves", label: "Gloves" },
      { slug: "boots", label: "Boots" },
      { slug: "riding-pants", label: "Riding Pants" },
      { slug: "protection", label: "Protection" },
      { slug: "accessories", label: "Accessories" },
      { slug: "offers", label: "Offers" },
    ];

    return (
      <section
        aria-labelledby="categories-title"
        className="relative z-10 -mt-8 rounded-t-[32px] bg-[#F2F0EB] py-20 text-ink-950 lg:py-32"
      >
        <div className="mx-auto w-full max-w-[1280px] px-5 sm:px-8">
          <p className="label-caps text-flame-600">Shop by category</p>
          <h2
            id="categories-title"
            className="mt-4 font-display text-[32px] font-extrabold lg:text-[48px]"
          >
            Everything you ride with
          </h2>
          <ul className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
            {fallback.map((item) => (
              <li key={item.slug}>
                <Link
                  href={ROUTES.category(item.slug)}
                  className="flex min-h-11 items-center justify-center rounded-sm bg-[#111214] px-4 py-4 font-display text-lg font-extrabold text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-flame-600"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    );
  }
}
