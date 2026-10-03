import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CatalogView } from "@/components/catalog/catalog-view";
import { getCategoryBySlug, getCategorySlugs } from "@/lib/data/products";
import { ROUTES } from "@/lib/routes";

/**
 * Category listing.
 *
 * The category is pinned as a filter override rather than trusted from the query
 * string, so `?category=` on this route cannot widen the scope, and filters
 * inside the page layer on top of it.
 */
/** See the note in `product/[slug]/page.tsx` for why this is false. */
export const dynamicParams = false;

/** Catalogue content changes slowly — revalidate hourly (ISR). */
export const revalidate = 3600;

export async function generateStaticParams() {
  const slugs = await getCategorySlugs();
  return slugs.map((entry) => ({ slug: entry.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);

  if (!category) {
    return { title: "Category not found" };
  }

  return {
    title: category.name,
    description:
      category.shortDescription ??
      category.description ??
      `Shop ${category.name.toLowerCase()} at Muthuram Complex — ${category.productCount} products, checked by hand.`,
    alternates: { canonical: ROUTES.category(category.slug) },
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const category = await getCategoryBySlug(slug);

  if (!category) notFound();

  return (
    <CatalogView
      basePath={ROUTES.category(category.slug)}
      searchParams={query}
      scope={{ kind: "category", slug: category.slug, label: category.name }}
      breadcrumbs={[
        { label: "Home", href: ROUTES.home },
        { label: "Shop", href: ROUTES.shop },
        { label: category.name },
      ]}
    />
  );
}