import Link from "next/link";
import { X } from "lucide-react";
import {
  clearFiltersHref,
  removeFilterHref,
  type RawSearchParams,
} from "@/lib/data/filter-state";
import type { AppliedFilter } from "@/lib/data/products";

/**
 * Applied-filter chips.
 *
 * The most important control on a filtered catalogue page: it is how a rider
 * narrows too far and then backs out of one specific constraint without
 * resetting everything else. Each chip is a real link to the URL with exactly
 * that one filter removed.
 */
export function ActiveFilterChips({
  basePath,
  searchParams,
  appliedFilters,
}: {
  basePath: string;
  searchParams: RawSearchParams;
  appliedFilters: AppliedFilter[];
}) {
  if (appliedFilters.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <h2 className="label-caps text-ink-400">Filtered by</h2>

      <ul className="flex flex-wrap items-center gap-2">
        {appliedFilters.map((filter) => (
          <li key={`${filter.key}:${filter.value}`}>
            <Link
              href={removeFilterHref(basePath, searchParams, filter.key, filter.value)}
              scroll={false}
              className="group inline-flex items-center gap-1.5 border border-ink-700 bg-ink-850 py-1.5 pr-2 pl-3 text-2xs text-ink-200 transition-colors duration-200 hover:border-danger-500/60 hover:text-bone-50"
            >
              <span className="text-ink-500 group-hover:text-ink-400">{filter.label}</span>
              <span className="font-semibold text-bone-50">{filter.value}</span>
              <span
                aria-hidden="true"
                className="flex h-4 w-4 items-center justify-center bg-ink-800 text-ink-400 transition-colors duration-200 group-hover:bg-danger-500/20 group-hover:text-danger-400"
              >
                <X className="h-2.5 w-2.5" />
              </span>
              <span className="sr-only">Remove this filter</span>
            </Link>
          </li>
        ))}
      </ul>

      {appliedFilters.length > 1 ? (
        <Link
          href={clearFiltersHref(basePath, searchParams)}
          scroll={false}
          className="text-2xs font-semibold uppercase tracking-[0.08em] text-ink-400 underline-offset-4 transition-colors hover:text-flame-400 hover:underline"
        >
          Clear all
        </Link>
      ) : null}

      </div>
  );
}