import type { Metadata } from "next";
import { CatalogView } from "@/components/catalog/catalog-view";
import { ROUTES } from "@/lib/routes";

/** Catalogue content changes slowly — revalidate hourly (ISR). */
export const revalidate = 3600;

/**
 * The full catalogue.
 *
 * `searchParams` is awaited (Next.js 15+ made it a Promise) and passed through
 * untouched, so the filter form owns the query string end to end.
 */

export const metadata: Metadata = {
  title: "All riding gear",
  description:
    "The full Muthuram Complex catalogue — helmets, armour, riding gear, boots, gloves and touring essentials from the brands we fit every day.",
  alternates: { canonical: ROUTES.shop },
};

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;

  return (
    <CatalogView
      basePath={ROUTES.shop}
      searchParams={params}
      scope={{ kind: "all" }}
      breadcrumbs={[
        { label: "Home", href: ROUTES.home },
        { label: "Shop all" },
      ]}
    />
  );
}