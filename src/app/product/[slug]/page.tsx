import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Badge } from "@/components/ui/badge";
import { StarRating } from "@/components/ui/star-rating";
import { ProductGallery } from "@/components/product/product-gallery";
import { AddToCartForm } from "@/components/product/add-to-cart-form";
import { ProductReviews } from "@/components/product/product-reviews";
import { RelatedProducts } from "@/components/product/related-products";
import {
  getProductBySlug,
  getProductSlugs,
  getRelatedProducts,
} from "@/lib/data/products";
import { getStoreSettings } from "@/lib/data/site-settings";
import { formatMoney } from "@/lib/utils";
import { ROUTES } from "@/lib/routes";

/**
 * Product detail.
 *
 * Static params come from the slug index, but the page still resolves the slug at
 * request time and 404s on a miss — a stale prerender must never turn a
 * discontinued product into a 500.
 *
 * The rating average is intentionally omitted from the slug list query and taken
 * from the full product instead, so the stars on the page can never disagree with
 * the review count shown underneath them.
 */
/**
 * Only slugs known at build time are reachable.
 *
 * `notFound()` alone would render the correct page but, because the root layout
 * streams a static shell before the page resolves, the response has already
 * started as a 200 — a soft 404 that crawlers are entitled to index.
 * `dynamicParams = false` rejects unknown slugs before anything streams, so an
 * unknown product returns a real 404.
 *
 * The trade-off is that a product added to the database needs a rebuild before
 * its page exists. For a seeded catalogue deployed with a build that is the
 * correct behaviour.
 */
export const dynamicParams = false;

/** Catalogue content changes slowly — revalidate hourly (ISR). */
export const revalidate = 3600;

export async function generateStaticParams() {
  const slugs = await getProductSlugs();
  return slugs.map((entry) => ({ slug: entry.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return { title: "Product not found" };
  }

  const title = product.seoTitle ?? `${product.name} — ${product.brandName}`;
  const description =
    product.seoDescription ?? product.shortDescription ?? `${product.brandName} ${product.name}`;

  return {
    title,
    description,
    alternates: { canonical: ROUTES.product(product.slug) },
    openGraph: {
      title,
      description,
      type: "website",
      images: product.gallery[0] ? [{ url: product.gallery[0].url }] : undefined,
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) notFound();

  const [settings, related] = await Promise.all([
    getStoreSettings(),
    getRelatedProducts(product.categorySlug, product.id, 4),
  ]);

  const discount =
    product.compareAtPricePaise && product.compareAtPricePaise > product.pricePaise
      ? Math.round(
          ((product.compareAtPricePaise - product.pricePaise) / product.compareAtPricePaise) * 100,
        )
      : null;

  const soldOutEverywhere = product.variants.every((variant) => !variant.isAvailable);

  return (
    <div className="container-page py-8 sm:py-10">
      <Breadcrumbs
        className="mb-6"
        items={[
          { label: "Home", href: ROUTES.home },
          { label: "Shop", href: ROUTES.shop },
          ...(product.categorySlug
            ? [{ label: product.categoryName, href: ROUTES.category(product.categorySlug) }]
            : []),
          { label: product.name },
        ]}
      />

      <div className="product-layout grid gap-10 min-w-0 grid-cols-1 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:gap-[clamp(24px,4vw,64px)]">
        {/* LEFT — gallery */}
        <div className="min-w-0">
          <ProductGallery images={product.gallery} productName={product.name} />
        </div>

        {/* RIGHT — stacked info panel: brand -> badges -> H1 -> rating -> price -> selectors/cart -> accordion -> related */}
        <div className="relative z-[1] flex min-w-0 flex-col">
          <div className="flex min-w-0 flex-col gap-5">
            <div className="flex min-w-0 flex-col gap-3">
              {product.brandSlug ? (
                <a
                  href={ROUTES.brand(product.brandSlug)}
                  className="label-caps w-fit text-ink-400 transition-colors hover:text-flame-400"
                >
                  {product.brandName}
                </a>
              ) : (
                <span className="label-caps text-ink-400">{product.brandName}</span>
              )}
              <div className="flex flex-wrap items-center gap-2">
                {product.isNew ? <Badge tone="info">New</Badge> : null}
                {product.isBestSeller ? <Badge tone="warning">Bestseller</Badge> : null}
                {discount ? <Badge tone="accent">{discount}% off</Badge> : null}
                {soldOutEverywhere ? <Badge tone="neutral">Sold out</Badge> : null}
              </div>
            </div>

            <h1 className="product-title min-w-0 text-bone-50 [font-size:clamp(28px,3.2vw,48px)] leading-[1.1] font-extrabold tracking-[-0.02em] [overflow-wrap:anywhere]">
              {product.name}
            </h1>

                {product.ratingCount > 0 ? (
                  <a
                    href="#reviews"
                    className="inline-flex w-fit items-center gap-2 text-2xs text-ink-400 transition-colors hover:text-ink-200"
                  >
                    <StarRating value={product.ratingAverage} count={product.ratingCount} />
                    <span className="underline underline-offset-4">Read reviews</span>
                  </a>
                ) : null}

                <p className="max-w-xl text-sm leading-relaxed text-ink-300 sm:text-base">
                  {product.shortDescription}
                </p>

                <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 border-t border-ink-800 pt-5">
                  <span className="font-display text-3xl font-extrabold tracking-[-0.03em] text-bone-50 tabular-nums">
                    {formatMoney(product.pricePaise)}
                  </span>
                  {product.compareAtPricePaise && product.compareAtPricePaise > product.pricePaise ? (
                    <>
                      <span className="text-base text-ink-500 line-through tabular-nums">
                        {formatMoney(product.compareAtPricePaise)}
                      </span>
                      <span className="bg-flame-500/12 px-2 py-0.5 text-2xs font-bold text-flame-400">
                        Save {formatMoney(product.compareAtPricePaise - product.pricePaise)}
                      </span>
                    </>
                  ) : null}
                </div>

                <p className="text-2xs text-ink-500">Inclusive of all taxes</p>
              </div>

            <div className="mt-8">
              <AddToCartForm
                product={product}
                freeShippingPaise={settings.freeShippingThresholdPaise}
              />
            </div>

          {/* Accordion directly under cart in the same column — normal flow, no overlap */}
          <div className="relative z-[1] mt-8 min-w-0">
            <DescriptionPanel product={product} />
          </div>

          {/* Riders also bought — part of right column stack */}
          <div className="relative z-[1] mt-8 min-w-0">
            <RelatedProducts products={related} categorySlug={product.categorySlug} />
          </div>
        </div>
      </div>

      <div id="reviews" className="mt-12 scroll-mt-32 min-w-0">
        <ProductReviews
          reviews={product.reviews}
          ratingBreakdown={product.ratingBreakdown}
          ratingAverage={product.ratingAverage}
          reviewCount={product.reviewCount}
        />
      </div>
    </div>
  );
}

/**
 * Description, features, specs, materials and care.
 *
 * The long-form copy is plain paragraphs from the catalogue rather than
 * user-authored HTML, so it is rendered as text — there is no injection surface
 * and no reason to reach for `dangerouslySetInnerHTML`.
 */
function DescriptionPanel({ product }: { product: Awaited<ReturnType<typeof getProductBySlug>> & {} }) {
  if (!product) return null;

  const panels = [
    { id: "description", title: "Description", body: product.description },
    ...(product.features.length > 0
      ? [{ id: "features", title: "Features", body: product.features.join(" · ") }]
      : []),
    ...(product.specs.length > 0
      ? [
          {
            id: "specs",
            title: "Specifications",
            table: product.specs,
          },
        ]
      : []),
    ...(product.material || product.careInstructions
      ? [
          {
            id: "materials",
            title: "Materials & care",
            rows: [
              product.material ? { label: "Material", value: product.material } : null,
              product.careInstructions
                ? { label: "Care", value: product.careInstructions }
                : null,
            ].filter((row): row is { label: string; value: string } => row !== null),
          },
        ]
      : []),
  ].filter((panel): panel is NonNullable<typeof panel> => Boolean(panel));

  if (panels.length === 0) return null;

  return (
    <div className="flex flex-col divide-y divide-ink-850 border border-ink-850 bg-ink-900/50">
      {panels.map((panel) => (
        <details key={panel.id} name="product-info" className="group">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 text-2xs font-semibold tracking-[0.08em] text-bone-50 uppercase transition-colors hover:text-flame-300 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-flame-500">
            {panel.title}
            <span
              aria-hidden="true"
              className="border-ink-500 [border-width:0_1.5px_1.5px_0] [height:6px] [width:6px] -rotate-45 transition-transform duration-200 group-open:rotate-45"
            />
          </summary>

          <div className="px-5 pb-5">
            {"body" in panel && panel.body ? (
              <p className="text-sm leading-relaxed text-ink-300">{panel.body}</p>
            ) : null}

            {"table" in panel && panel.table ? (
              <dl className="flex flex-col gap-2">
                {panel.table.map((spec) => (
                  <div key={spec.label} className="flex gap-3 text-sm">
                    <dt className="w-32 shrink-0 text-ink-500">{spec.label}</dt>
                    <dd className="text-ink-200">{spec.value}</dd>
                  </div>
                ))}
              </dl>
            ) : null}

            {"rows" in panel && panel.rows ? (
              <dl className="flex flex-col gap-2">
                {panel.rows.map((row) => (
                  <div key={row.label} className="flex gap-3 text-sm">
                    <dt className="w-32 shrink-0 text-ink-500">{row.label}</dt>
                    <dd className="text-ink-200">{row.value}</dd>
                  </div>
                ))}
              </dl>
            ) : null}
          </div>
        </details>
      ))}
    </div>
  );
}