import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CatalogView } from "@/components/catalog/catalog-view";
import { getCollectionBySlug, getCollectionProductIds, getCollectionSlugs } from "@/lib/data/products";
import { ROUTES } from "@/lib/routes";

/**
 * Collection listing.
 *
 * A collection is an editorial membership rather than a product attribute, so the
 * member ids are resolved first and handed to the shared catalogue as a pinned
 * `productIds` scope. Doing it in the query (instead of filtering the result set
 * afterwards) keeps paging, the total and the empty state honest.
 */
/** See the note in `product/[slug]/page.tsx` for why this is false. */
export const dynamicParams = false;

/** Catalogue content changes slowly — revalidate hourly (ISR). */
export const revalidate = 3600;

export async function generateStaticParams() {
  const slugs = await getCollectionSlugs();
  return slugs.map((entry) => ({ slug: entry.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const collection = await getCollectionBySlug(slug);

  if (!collection) {
    return { title: "Collection not found" };
  }

  return {
    title: collection.name,
    description:
      collection.tagline ??
      collection.description ??
      `${collection.name} — ${collection.productCount} hand-picked pieces from Muthuram Complex.`,
    alternates: { canonical: ROUTES.collection(collection.slug) },
  };
}

export default async function CollectionPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const collection = await getCollectionBySlug(slug);

  if (!collection) notFound();

  const productIds = await getCollectionProductIds(collection.slug);

  return (
    <CatalogView
      basePath={ROUTES.collection(collection.slug)}
      searchParams={query}
      scope={{ kind: "collection", label: collection.name, productIds }}
      breadcrumbs={[
        { label: "Home", href: ROUTES.home },
        { label: "Shop", href: ROUTES.shop },
        { label: collection.name },
      ]}
    />
  );
}