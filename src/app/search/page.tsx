import type { Metadata } from "next";
import Link from "next/link";
import { Search as SearchIcon } from "lucide-react";
import { CatalogView } from "@/components/catalog/catalog-view";
import { getPopularSearches } from "@/lib/data/products";
import { ROUTES } from "@/lib/routes";

/**
 * Search results.
 *
 * Renders the shared catalogue, so search results are filterable and pageable
 * exactly like `/shop`. An empty query shows popular searches rather than an
 * error — a blank search box should teach a rider what to type.
 */

export const metadata: Metadata = {
  title: "Search",
  description: "Search the full Muthuram Complex catalogue by product, brand or category.",
  robots: { index: false, follow: true },
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const raw = params.q;
  const term = (Array.isArray(raw) ? raw[0] : raw)?.trim() ?? "";

  if (term.length === 0) {
    return <SearchPrompt />;
  }

  return (
    <CatalogView
      basePath={ROUTES.search}
      searchParams={params}
      scope={{ kind: "search", label: term }}
      breadcrumbs={[
        { label: "Home", href: ROUTES.home },
        { label: "Search" },
      ]}
    />
  );
}

/** Shown when the rider has not typed anything yet. */
async function SearchPrompt() {
  const popular = await getPopularSearches(8);

  return (
    <div className="container-page py-16 sm:py-24">
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-6 text-center">
        <span
          aria-hidden="true"
          className="inline-flex h-14 w-14 items-center justify-center border border-ink-750 bg-ink-900 text-flame-500"
        >
          <SearchIcon className="h-6 w-6" />
        </span>

        <div className="flex flex-col gap-3">
          <h1 className="text-3xl text-bone-50 sm:text-4xl">What are you after?</h1>
          <p className="text-sm leading-relaxed text-ink-300 sm:text-base">
            Search by product name, brand or category. Full-face helmet, rain gear and studded boots
            all find something.
          </p>
        </div>

        {/* A real GET form, so search works without JavaScript. */}
        <form action={ROUTES.search} method="get" className="flex w-full max-w-md gap-2">
          <label htmlFor="search-page-input" className="sr-only">
            Search products
          </label>
          <input
            id="search-page-input"
            name="q"
            type="search"
            autoComplete="off"
            placeholder="Try: riding gloves"
            className="h-12 flex-1 rounded-sm border border-ink-700 bg-ink-900 px-4 text-sm text-bone-50 transition-colors duration-200 placeholder:text-ink-600 hover:border-ink-600 focus:border-flame-500 focus:outline-none focus:ring-2 focus:ring-flame-500/35"
          />
          <button
            type="submit"
            className="h-12 shrink-0 rounded-sm bg-flame-500 px-6 text-2xs font-bold tracking-[0.1em] text-ink-950 uppercase transition-colors duration-200 hover:bg-flame-400 active:translate-y-px"
          >
            Search
          </button>
        </form>

        {popular.length > 0 ? (
          <div className="w-full border border-ink-800 bg-ink-900/60 p-6">
            <h2 className="label-caps mb-3 text-bone-50">Popular searches</h2>
            <ul className="flex flex-wrap justify-center gap-2">
              {popular.map((entry) => (
                <li key={entry}>
                  <Link
                    href={`${ROUTES.search}?q=${encodeURIComponent(entry)}`}
                    className="inline-flex border border-ink-700 px-3.5 py-1.5 text-2xs font-semibold tracking-[0.08em] text-ink-200 uppercase transition-colors duration-200 hover:border-flame-500 hover:text-flame-300"
                  >
                    {entry}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </div>
  );
}