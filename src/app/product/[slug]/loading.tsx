/**
 * Product page skeleton.
 *
 * Mirrors the PDP layout — breadcrumbs, gallery stage + thumb rail, info
 * column — so the shell appears instantly and the swap to content does not
 * move anything.
 */
export default function Loading() {
  return (
    <div role="status" aria-live="polite" aria-label="Loading product">
      <span className="sr-only">Loading product…</span>

      <div className="container-page py-8 sm:py-10">
        <div aria-hidden="true" className="mb-6 h-3 w-56 animate-pulse rounded-xs bg-ink-900" />

        <div className="flex flex-col gap-8 lg:flex-row lg:gap-12">
          {/* Gallery: stage + thumbs */}
          <div aria-hidden="true" className="flex min-w-0 flex-1 flex-col-reverse gap-3 sm:flex-row">
            <div className="flex gap-2 sm:flex-col">
              {Array.from({ length: 3 }, (_, i) => (
                <div key={i} className="h-16 w-14 animate-pulse rounded-sm bg-ink-900" />
              ))}
            </div>
            <div className="aspect-[4/5] w-full flex-1 animate-pulse rounded-sm bg-ink-900" />
          </div>

          {/* Info column */}
          <div aria-hidden="true" className="flex w-full flex-col gap-3 lg:max-w-md">
            <div className="h-3 w-24 animate-pulse rounded-xs bg-ink-900" />
            <div className="h-7 w-4/5 animate-pulse rounded-xs bg-ink-900" />
            <div className="h-3 w-2/5 animate-pulse rounded-xs bg-ink-900" />
            <div className="h-6 w-1/3 animate-pulse rounded-xs bg-ink-900" />
            <div className="mt-2 h-11 w-full animate-pulse rounded-xs bg-ink-900" />
            <div className="h-11 w-full animate-pulse rounded-xs bg-ink-900" />
          </div>
        </div>
      </div>
    </div>
  );
}
