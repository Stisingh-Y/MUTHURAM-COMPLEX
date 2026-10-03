"use client";

import { useState, type ReactNode } from "react";
import { X, SlidersHorizontal } from "lucide-react";

/**
 * Mobile filter drawer.
 *
 * `children` is the server-rendered `FilterPanel` passed straight through, so
 * the filter form is still rendered on the server and this client component
 * only owns the open/closed state and the overlay.
 *
 * The panel is unmounted when closed rather than hidden with CSS, so its
 * checkboxes are absent from the accessibility tree and the tab order until a
 * rider actually opens it.
 */
export function MobileFilterDrawer({
  children,
  activeCount,
  label = "Filters",
  formId = "catalog-filter-form",
}: {
  children: ReactNode;
  activeCount: number;
  label?: string;
  /** Id of the server-rendered form the footer's submit button targets. */
  formId?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-expanded={open}
        aria-haspopup="dialog"
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-sm border border-ink-600 text-2xs font-semibold tracking-[0.08em] text-bone-50 uppercase transition-colors duration-200 hover:border-ink-400 hover:bg-ink-800 active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flame-500 lg:hidden"
      >
        <SlidersHorizontal aria-hidden="true" className="h-4 w-4" />
        {label}
        {activeCount > 0 ? (
          <span className="ml-auto bg-flame-500 px-2 py-0.5 text-[0.625rem] font-bold text-ink-950 tabular-nums">
            {activeCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="fixed inset-0 z-[100] lg:hidden" role="dialog" aria-modal="true" aria-label={label}>
          <button
            type="button"
            aria-label="Close filters"
            onClick={() => setOpen(false)}
            className="absolute inset-0 animate-[fade-in_160ms_ease-out] cursor-default bg-ink-950/85 backdrop-blur-sm"
          />

          <div className="absolute inset-y-0 right-0 flex w-[min(23rem,90vw)] animate-[slide-in-right_240ms_ease-out] flex-col border-l border-ink-800 bg-ink-950">
            <header className="flex shrink-0 items-center justify-between border-b border-ink-850 px-5 py-4">
              <h2 className="font-display text-base font-extrabold text-bone-50">{label}</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center border border-ink-700 text-ink-300 transition-colors hover:border-ink-600 hover:text-bone-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flame-500"
              >
                <X aria-hidden="true" className="h-4 w-4" />
                <span className="sr-only">Close filters</span>
              </button>
            </header>

            <div className="flex-1 overflow-y-auto px-5 py-6">{children}</div>

            {/* The sidebar auto-submits on change; the drawer needs an explicit
                control because a filter change here should not navigate while
                the rider is still scrolling the facet list. */}
            <footer className="shrink-0 border-t border-ink-850 p-5">
              <button
                type="submit"
                form={formId}
                className="w-full rounded-sm bg-flame-500 px-5 py-3.5 text-2xs font-bold tracking-[0.1em] text-ink-950 uppercase transition-colors duration-200 hover:bg-flame-400 active:translate-y-px"
              >
                Show results
              </button>
            </footer>
          </div>
        </div>
      ) : null}
    </>
  );
}