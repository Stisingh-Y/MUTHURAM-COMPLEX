import { Suspense } from "react";
import { getAllBanners } from "@/lib/data/banners";
import {
  getBrands,
  getCollections,
  getCuratedRail,
  getFeaturedCategories,
  getHomepageReviews,
} from "@/lib/data/products";
import { getStoreSettings } from "@/lib/data/site-settings";
import { ROUTES } from "@/lib/routes";
import { Hero } from "@/components/home/hero";
import { TrustStrip } from "@/components/home/trust-strip";
import { CategoryGrid } from "@/components/home/category-grid";
import { CategoryErrorBoundary } from "@/components/home/category-error-boundary";
import { CollectionGrid } from "@/components/home/collection-grid";

import { BrandStrip } from "@/components/home/brand-strip";
import { RiderLifestyle } from "@/components/home/rider-lifestyle";
import { ReviewGrid } from "@/components/home/review-grid";
import { ValueProps, NewsletterBand } from "@/components/home/value-props";
import { ProductRail, RailFooterLink } from "@/components/product/product-rail";
import { SectionHeading } from "@/components/ui/section-heading";
import { ProductCardSkeleton } from "@/components/product/product-card";

/**
 * Homepage.
 *
 * Order is deliberate and follows the brief's hierarchy:
 *
 *   Hero → Trust → Categories → Featured → Editorial → Best sellers →
 *   Brands → Rider lifestyle → Why → Reviews → Newsletter
 *
 * Two principles drive the sequence. First, evidence before commerce: the trust
 * strip answers "is this a real shop" before any price is shown. Second, the
 * page alternates dark and light bands so that scrolling is paced by colour
 * rather than only by content — hero/trust (dark) → categories (warm) →
 * featured (white) → editorial (warm) → bestsellers (white) → brands (warm) →
 * lifestyle (charcoal) → why (warm) → reviews (white) → newsletter (dark).
 *
 * Rail queries are wrapped in `Suspense` so a slow product query never blocks
 * the static sections above it from streaming.
 */

export default async function HomePage() {
  const [banners, settings] = await Promise.all([getAllBanners(), getStoreSettings()]);

  const [categories, collections, brands, reviews] = await Promise.all([
    getFeaturedCategories(),
    getCollections(4),
    getBrands(),
    getHomepageReviews(6),
  ]);

  const promoBanners = banners.PROMO ?? [];
  const hero = (banners.HERO ?? [])[0];

  return (
    <>
      <Hero
        banner={hero}
        trustBar={<TrustStrip freeShippingPaise={settings.freeShippingThresholdPaise} overlay />}
      />

      <CategoryErrorBoundary>
        <CategoryGrid categories={categories} />
      </CategoryErrorBoundary>

      {/* Featured. White band: the product-dense section needs the maximum
          contrast against the warm band above it. */}
      <section aria-labelledby="featured-title" className="bg-paper py-section text-ink-950">
        <div className="container-page">
          <SectionHeading
            id="featured-title"
            tone="light"
            index="03"
            divider
            eyebrow="Riders' Picks"
            title={<>Gear we would fit to a <span className="sh-hl">customer today</span></>}
            description={<>Not an algorithm — the pieces we keep reaching for when someone walks in and says <strong>&lsquo;protect me for the next year&rsquo;</strong>.</>}
            action={
              <RailFooterLink href={`${ROUTES.shop}?sort=featured`} label="Shop all" tone="light" />
            }
          />

          <div className="mt-10">
            <Suspense fallback={<FeaturedRailSkeleton />}>
              <FeaturedRail />
            </Suspense>
          </div>
        </div>
      </section>

      <CollectionGrid collections={collections} />

      <section aria-labelledby="bestsellers-title" className="bg-paper py-section text-ink-950">
        <div className="container-page">
          <SectionHeading
            id="bestsellers-title"
            tone="light"
            index="05"
            divider
            eyebrow="Rider favourites"
            title={<>What <span className="sh-hl">leaves the shop fastest</span></>}
            description="Ranked by what riders keep coming back for, including the second and third ones they buy later."
            action={
              <RailFooterLink
                href={`${ROUTES.shop}?sort=popular`}
                label="Shop bestsellers"
                tone="light"
              />
            }
          />

          <div className="mt-10">
            <Suspense fallback={<FeaturedRailSkeleton />}>
              <BestsellerRail />
            </Suspense>
          </div>
        </div>
      </section>

      <BrandStrip brands={brands} />

      <RiderLifestyle banners={promoBanners} />

      <ValueProps freeShippingPaise={settings.freeShippingThresholdPaise} />

      <ReviewGrid reviews={reviews} />

      <NewsletterBand freeShippingPaise={settings.freeShippingThresholdPaise} />
    </>
  );
}

/** Both product rails sit on the white band, so their cards are light-toned. */
async function FeaturedRail() {
  const products = await getCuratedRail("featured", 8);
  return <ProductRail products={products} tone="light" />;
}

async function BestsellerRail() {
  const products = await getCuratedRail("bestseller", 8);
  return <ProductRail products={products} tone="light" />;
}

/** Matches `ProductRail`'s track metrics so the swap does not shift anything. */
function FeaturedRailSkeleton() {
  return (
    <ul
      aria-hidden="true"
      className="no-scrollbar -mx-5 flex snap-x snap-mandatory gap-5 overflow-x-hidden px-5 md:mx-0 md:px-0"
    >
      {Array.from({ length: 5 }, (_, index) => (
        <li
          key={index}
          className="w-[70vw] shrink-0 sm:w-[43vw] md:w-[30vw] lg:w-[22vw] xl:w-[18rem]"
        >
          <ProductCardSkeleton tone="light" />
        </li>
      ))}
    </ul>
  );
}
