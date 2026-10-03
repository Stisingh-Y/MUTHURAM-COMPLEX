import { ProductCardSkeleton } from "@/components/product/product-card";

/**
 * Catalogue loading skeleton.
 *
 * Mirrors the real layout — breadcrumb, filter rail, results header, product
 * grid — so the swap to content does not move anything. Every block is
 * `aria-hidden` inside a `role="status"` tree, so a screen reader hears
 * "Loading" once instead of a list of empty boxes.
 *
 * Scoped to this segment rather than the app root on purpose: a root
 * `loading.tsx` would put a Suspense boundary in front of every route, which
 * starts the response streaming before a page can resolve and would turn every
 * `notFound()` into a soft 404.
 */
export default function Loading() {
  return (
    <div role="status" aria-live="polite" aria-label="Loading products">
      <span className="sr-only">Loading products…</span>

      <div className="container-page py-8 sm:py-10">
        <div aria-hidden="true" className="mb-6 h-3 w-56 animate-pulse rounded-xs bg-ink-900" />

        <div className="flex flex-col gap-6 lg:flex-row lg:gap-10">
          {/* Filter rail */}
          <div aria-hidden="true" className="hidden w-64 shrink-0 flex-col gap-6 lg:flex">
            {Array.from({ length: 4 }, (_, group) => (
              <div key={group} className="flex flex-col gap-2.5">
                <div className="h-3 w-20 animate-pulse rounded-xs bg-ink-900" />
                {Array.from({ length: 4 }, (_, row) => (
                  <div key={row} className="flex items-center gap-2.5">
                    <div className="h-4 w-4 animate-pulse rounded-xs bg-ink-900" />
                    <div className="h-3 flex-1 animate-pulse rounded-xs bg-ink-900" />
                  </div>
                ))}
              </div>
            ))}
          </div>

          <div className="min-w-0 flex-1">
            {/* Results header */}
            <div
              aria-hidden="true"
              className="flex items-center justify-between gap-4 border-b border-ink-850 py-5"
            >
              <div className="h-6 w-40 animate-pulse rounded-xs bg-ink-900" />
              <div className="h-10 w-full animate-pulse rounded-sm bg-ink-900 sm:w-56" />
            </div>

            {/* Product grid */}
            <div
              aria-hidden="true"
              className="mt-8 grid grid-cols-2 gap-x-4 gap-y-9 sm:gap-x-5 sm:gap-y-11 lg:grid-cols-3 lg:gap-x-6 xl:grid-cols-4"
            >
              {Array.from({ length: 8 }, (_, index) => (
                <ProductCardSkeleton key={index} tone="dark" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}