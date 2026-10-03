import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Pagination.
 *
 * Every page is a real link with an `href`, so it works with middle-click,
 * keyboard paging and crawlers — no JavaScript required. `rel="prev"`/`rel="next"`
 * is set for crawlers that follow link relations.
 *
 * `buildPageHref` receives the live search params so filter state survives a page
 * change; dropping it is the classic bug where clicking "next" silently clears
 * every selected filter.
 */

export function buildPageHref(
  basePath: string,
  searchParams: Record<string, string | string[] | undefined>,
  page: number,
): string {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(searchParams)) {
    if (key === "page" || value === undefined) continue;
    if (Array.isArray(value)) {
      for (const entry of value) if (entry) params.append(key, entry);
    } else if (value) {
      params.set(key, value);
    }
  }

  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
}

/** Condensed page list: 1 … 4 [5] 6 … 12 */
function pageWindow(current: number, total: number): (number | "gap")[] {
  if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1);

  const pages: (number | "gap")[] = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  if (start > 2) pages.push("gap");
  for (let page = start; page <= end; page += 1) pages.push(page);
  if (end < total - 1) pages.push("gap");
  pages.push(total);

  return pages;
}

export function Pagination({
  basePath,
  searchParams,
  page,
  totalPages,
  className,
}: {
  basePath: string;
  searchParams: Record<string, string | string[] | undefined>;
  page: number;
  totalPages: number;
  className?: string;
}) {
  if (totalPages <= 1) return null;

  const previousHref = buildPageHref(basePath, searchParams, page - 1);
  const nextHref = buildPageHref(basePath, searchParams, page + 1);
  const linkClass =
    "inline-flex h-9 min-w-9 items-center justify-center rounded-sm border border-ink-700 px-2.5 text-2xs font-semibold uppercase tracking-[0.08em] transition-colors duration-200 hover:border-ink-500 hover:bg-ink-800 hover:text-bone-50";

  return (
    <nav aria-label="Pagination" className={cn("flex items-center justify-center gap-2", className)}>
      {page > 1 ? (
        <Link href={previousHref} rel="prev" prefetch={false} className={linkClass}>
          <ChevronLeft aria-hidden="true" className="h-3.5 w-3.5" />
          <span className="ml-1 hidden sm:inline">Prev</span>
          <span className="sr-only">Previous page</span>
        </Link>
      ) : (
        <span aria-disabled="true" className={cn(linkClass, "pointer-events-none opacity-40")}>
          <ChevronLeft aria-hidden="true" className="h-3.5 w-3.5" />
          <span className="sr-only">Previous page</span>
        </span>
      )}

      <ul className="flex items-center gap-1.5">
        {pageWindow(page, totalPages).map((entry, index) =>
          entry === "gap" ? (
            <li
              key={`gap-${index}`}
              aria-hidden="true"
              className="px-1 text-2xs text-ink-600"
            >
              …
            </li>
          ) : (
            <li key={entry}>
              {entry === page ? (
                <span
                  aria-current="page"
                  className="inline-flex h-9 min-w-9 items-center justify-center rounded-sm border border-flame-500 bg-flame-500 px-2.5 text-2xs font-bold tabular-nums text-ink-950"
                >
                  {entry}
                  <span className="sr-only">(current page)</span>
                </span>
              ) : (
                <Link
                  href={buildPageHref(basePath, searchParams, entry)}
                  prefetch={false}
                  className={linkClass}
                >
                  <span className="tabular-nums">{entry}</span>
                  <span className="sr-only">, page {entry}</span>
                </Link>
              )}
            </li>
          ),
        )}
      </ul>

      {page < totalPages ? (
        <Link href={nextHref} rel="next" prefetch={false} className={linkClass}>
          <span className="mr-1 hidden sm:inline">Next</span>
          <ChevronRight aria-hidden="true" className="h-3.5 w-3.5" />
          <span className="sr-only">Next page</span>
        </Link>
      ) : (
        <span aria-disabled="true" className={cn(linkClass, "pointer-events-none opacity-40")}>
          <ChevronRight aria-hidden="true" className="h-3.5 w-3.5" />
          <span className="sr-only">Next page</span>
        </span>
      )}
    </nav>
  );
}