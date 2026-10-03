import Link from "next/link";
import { ProductGrid } from "@/components/product/product-grid";
import { ROUTES } from "@/lib/routes";
import type { ProductCardView } from "@/lib/data/products";

/**
 * Related products.
 *
 * Sits under the description panel in the right rail on a product page, which is
 * a deliberate choice: at the bottom of a product page a rider has already
 * decided, and the most useful thing to offer is the category they were browsing.
 * Rendered as a single column so it does not fight the two-column product grid
 * further down.
 */
export function RelatedProducts({
  products,
  categorySlug,
}: {
  products: ProductCardView[];
  categorySlug: string | null;
}) {
  if (products.length === 0) return null;

  return (
    <section
      aria-labelledby="related-heading"
        className="border border-ink-850 bg-ink-900/50 p-5"
    >
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <h2
          id="related-heading"
          className="font-display text-base font-extrabold tracking-[-0.01em] text-bone-50"
        >
          Riders also bought
        </h2>
        {categorySlug ? (
          <Link
            href={ROUTES.category(categorySlug)}
            className="text-2xs font-semibold tracking-[0.08em] text-ink-400 uppercase transition-colors hover:text-flame-400"
          >
            All
          </Link>
        ) : null}
      </div>

      <ProductGrid
        products={products}
        tone="dark"
        label="Related products"
        className="grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3"
      />
    </section>
  );
}