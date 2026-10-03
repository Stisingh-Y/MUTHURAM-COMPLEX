import { cn } from "@/lib/utils";
import { PER_PAGE } from "@/lib/data/filter-state";

/**
 * Results header.
 *
 * Purely presentational: shows how many products fell out of the query and
 * where the rider is in the page window. It never manipulates state.
 */
export function ResultsHeader({
  total,
  page,
  perPage = PER_PAGE,
  children,
  className,
}: {
  total: number;
  page: number;
  perPage?: number;
  children?: React.ReactNode;
  className?: string;
}) {
  const start = total === 0 ? 0 : (page - 1) * perPage + 1;
  const end = Math.min(total, page * perPage);

  return (
    <header
      className={cn(
        "flex flex-col gap-3 border-b border-ink-850 py-5 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <div className="flex flex-wrap items-center gap-2.5">
        <h2 className="font-display text-lg font-extrabold tracking-[-0.01em] text-bone-50 sm:text-xl">
          {total === 0 ? "No results" : `${total.toLocaleString("en-IN")} product${total === 1 ? "" : "s"}`}
        </h2>
        {total > 0 ? (
          <span className="text-2xs text-ink-500 tabular-nums">
            Showing {start.toLocaleString("en-IN")}–{end.toLocaleString("en-IN")}
          </span>
        ) : null}
        {children}
      </div>
    </header>
  );
}