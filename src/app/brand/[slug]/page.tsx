import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CatalogView } from "@/components/catalog/catalog-view";
import { getBrands } from "@/lib/data/products";
import { ROUTES } from "@/lib/routes";

/**
 * Brand listing.
 *
 * The brand set is read from the database rather than the seed file, so a brand
 * added later gets a working page without touching this file. An unknown slug is
 * a 404 rather than a filter that silently matches nothing.
 */
/** See the note in `product/[slug]/page.tsx` for why this is false. */
export const dynamicParams = false;

/** Catalogue content changes slowly — revalidate hourly (ISR). */
export const revalidate = 3600;

export async function generateStaticParams() {
  const brands = await getBrands();
  return brands.map((brand) => ({ slug: brand.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const brands = await getBrands();
  const brand = brands.find((entry) => entry.slug === slug);

  if (!brand) {
    return { title: "Brand not found" };
  }

  return {
    title: `${brand.name} gear`,
    description: `Everything we stock from ${brand.name} — ${brand.productCount} products, checked and fitted by hand at Muthuram Complex.`,
    alternates: { canonical: ROUTES.brand(brand.slug) },
  };
}

export default async function BrandPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const brands = await getBrands();
  const brand = brands.find((entry) => entry.slug === slug);

  if (!brand) notFound();

  return (
    <CatalogView
      basePath={ROUTES.brand(brand.slug)}
      searchParams={query}
      scope={{ kind: "brand", slug: brand.slug, label: brand.name }}
      breadcrumbs={[
        { label: "Home", href: ROUTES.home },
        { label: "Shop", href: ROUTES.shop },
        { label: brand.name },
      ]}
    />
  );
}