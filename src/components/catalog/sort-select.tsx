"use client";

import { useRouter } from "next/navigation";
import { SORT_OPTIONS } from "@/lib/enums";
import { cn } from "@/lib/utils";
import { setSortHref, type RawSearchParams } from "@/lib/data/filter-state";

/**
 * Sort control.
 *
 * Submits on change and pushes a real URL rather than re-sorting in place, so a
 * sorted view can be shared, bookmarked and reached with the back button like
 * any other state. `setSortHref` drops `page` for the same reason the filter
 * form does: page 3 of the new ordering is rarely what was wanted.
 *
 * Only this control is a Client Component — the catalogue page around it stays
 * server-rendered.
 */
export function SortSelect({
  basePath,
  searchParams,
  value,
  className,
}: {
  basePath: string;
  searchParams: RawSearchParams;
  value: string;
  className?: string;
}) {
  const router = useRouter();

  return (
    <div className={cn("relative", className)}>
      <label htmlFor="catalog-sort" className="sr-only">
        Sort products
      </label>
      <select
        id="catalog-sort"
        name="sort"
        // Controlled-by-default-value: React sets the initial value, and we
        // navigate on change rather than holding local state, so the select
        // always matches the URL even when the rider uses the back button.
        defaultValue={value}
        onChange={(event) => {
          const next = event.currentTarget.value;
          router.push(setSortHref(basePath, searchParams, next as (typeof SORT_OPTIONS)[number]["value"]));
        }}
        className="h-10 w-full cursor-pointer appearance-none rounded-sm border border-ink-700 bg-ink-900 pr-9 pl-3.5 text-2xs font-semibold tracking-[0.04em] text-bone-50 uppercase transition-colors duration-200 hover:border-ink-600 focus:border-flame-500 focus:outline-none focus:ring-2 focus:ring-flame-500/35"
      >
        {SORT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      {/* Chevron drawn with borders so it inherits the control's text colour. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 border-ink-400 [border-width:0_1.5px_1.5px_0] [height:6px] [width:6px] rotate-45"
      />
    </div>
  );
}