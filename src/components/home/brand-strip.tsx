import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { ROUTES } from "@/lib/routes";
import type { BrandView } from "@/lib/data/products";

/**
 * Brand wall — "Brands we trust".
 *
 * `src/components/home/brand-strip.tsx` (server: zero JS).
 *
 * Renders the brand SVG wordmark on each tile with product count,
 * orange hover slide-in indicator, and links directly to each brand page.
 */
export function BrandStrip({ brands }: { brands: BrandView[] }) {
  if (brands.length === 0) return null;

  return (
    <section aria-labelledby="brands-title" className="bg-[#F2F0EB] py-16 text-[#111214] lg:py-24">
      <div className="mx-auto w-full max-w-[1280px] px-5 sm:px-8">
        {/* Section header — explicit light-surface colors, always visible. */}
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl">
            <p className="label-caps inline-flex items-center gap-2.5 text-flame-600">
              <span aria-hidden="true" className="h-px w-6 bg-flame-600" />
              The shelf
            </p>
            <h2
              id="brands-title"
              className="mt-4 font-display text-[32px] leading-[1.05] font-extrabold tracking-[-0.02em] text-[#111214] lg:text-[48px]"
            >
              Brands we trust
            </h2>
            <p className="mt-4 text-[18px] leading-relaxed text-[#5C5F66]">
              Every one of these we have fitted, worn or repaired ourselves.
            </p>
          </div>
          <Link
            href={ROUTES.brands}
            className="group relative inline-flex min-h-11 items-center gap-2 pb-1 text-[13px] font-bold tracking-[0.08em] text-[#111214] uppercase transition-colors duration-200 hover:text-flame-600 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-flame-600"
          >
            View all {brands.length}
            <ArrowUpRight
              aria-hidden="true"
              className="h-4 w-4 transition-transform duration-200 ease-out group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            />
            <span
              aria-hidden="true"
              className="absolute inset-x-0 bottom-0 h-0.5 origin-left scale-x-0 bg-flame-600 transition-transform duration-200 ease-out group-hover:scale-x-100 motion-reduce:transition-none"
            />
          </Link>
        </div>

        {/* Brand cells — hairline dividers, equal height. */}
        <ul className="mt-10 grid grid-cols-2 border-t border-[rgb(17_18_20/0.1)] sm:mt-12 lg:grid-cols-4">
          {brands.map((brand) => (
            <li
              key={brand.id}
              className="border-b border-l border-[rgb(17_18_20/0.1)] odd:border-l-0 lg:border-l lg:odd:border-l lg:[&:nth-child(4n+1)]:border-l-0"
            >
              <Link
                href={ROUTES.brand(brand.slug)}
                aria-label={`Shop ${brand.name}, ${brand.productCount} ${brand.productCount === 1 ? "product" : "products"}`}
                className="group relative flex min-h-32 flex-col items-start justify-between p-6 transition-all duration-200 hover:bg-[#111214]/[0.04] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-flame-600"
              >
                <div className="relative h-10 w-44">
                  <Image
                    src={brand.logoLight || `/images/brands/${brand.slug}/logo-light.svg`}
                    alt={brand.alt || `${brand.name} logo`}
                    fill
                    sizes="176px"
                    className="object-contain object-left transition-transform duration-300 ease-out group-hover:scale-105"
                  />
                </div>
                <div className="mt-4 flex w-full items-center justify-between border-t border-[rgb(17_18_20/0.08)] pt-2.5">
                  <span className="text-[12px] font-semibold tracking-[0.08em] text-[#5C5F66] uppercase tabular-nums">
                    {brand.productCount} {brand.productCount === 1 ? "Product" : "Products"}
                  </span>
                  <span className="text-2xs font-bold tracking-[0.1em] text-flame-600 uppercase opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                    Explore →
                  </span>
                </div>
                {/* 2px orange underline, slides in from the left */}
                <span
                  aria-hidden="true"
                  className="absolute inset-x-0 bottom-0 h-0.5 origin-left scale-x-0 bg-flame-600 transition-transform duration-200 ease-out group-hover:scale-x-100 motion-reduce:transition-none"
                />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
