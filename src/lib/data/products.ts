import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { isSortOption, type SortOption } from "@/lib/enums";
import {
  CARD_INCLUDE,
  mapProductCard,
  mapProductVariant,
  type ProductBadge,
  type ProductCardView,
  type ProductImageView,
  type ProductVariantView,
} from "@/lib/data/mappers";
import {
  parseFeatures,
  parseJsonArray,
  parseSpecs,
  parseTags,
  type SpecPair,
} from "@/lib/data/json";
import { categoryImageFor, collectionImageFor, realEntryFor } from "@/lib/data/image-map";
import type { ProductFilterState } from "@/lib/data/filter-state";

/**
 * Storefront read models.
 *
 * Prisma rows are converted to plain view models by `mappers.ts` before they
 * reach a component, so JSON columns are parsed once, prices and variants are
 * already aggregated, and no component depends on the database schema.
 */

export type { ProductBadge, ProductCardView, ProductImageView, ProductVariantView };

export type ReviewView = {
  id: string;
  authorName: string;
  rating: number;
  title: string | null;
  body: string;
  isVerifiedPurchase: boolean;
  createdAt: Date;
};

export type CollectionView = {
  id: string;
  name: string;
  slug: string;
  tagline: string | null;
  description: string | null;
  image: string;
  productCount: number;
};

export type CategoryView = {
  id: string;
  name: string;
  slug: string;
  shortDescription: string | null;
  description: string | null;
  image: string;
  productCount: number;
  children: { id: string; name: string; slug: string; productCount: number }[];
};

export type BrandView = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  logo: string | null;
  logoLight: string;
  logoDark: string;
  banner: string;
  tile: string;
  alt: string;
  productCount: number;
};

export type FacetValue = { value: string; label: string; count: number };

export type { ProductFilterState, RawSearchParams } from "@/lib/data/filter-state";

export type AppliedFilter = { label: string; key: string; value: string };

export type ProductDetailView = ProductCardView & {
  sku: string;
  description: string;
  material: string | null;
  careInstructions: string | null;
  warrantyMonths: number;
  returnDays: number;
  features: string[];
  specs: SpecPair[];
  tags: string[];
  variants: ProductVariantView[];
  gallery: ProductImageView[];
  seoTitle: string | null;
  seoDescription: string | null;
  publishedAt: Date | null;
  ratingBreakdown: { rating: number; count: number }[];
  reviewCount: number;
  reviews: ReviewView[];
};

export type ProductQueryResult = {
  products: ProductCardView[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
  facets: {
    categories: FacetValue[];
    brands: FacetValue[];
    sizes: FacetValue[];
    colors: FacetValue[];
    priceRange: { minPaise: number; maxPaise: number };
    maxDiscount: number;
  };
  appliedFilters: AppliedFilter[];
};

// ── Ordering ─────────────────────────────────────────────────────────────────

const orderByFor = (sort: SortOption): Prisma.ProductOrderByWithRelationInput[] => {
  switch (sort) {
    case "newest":
      return [{ publishedAt: "desc" }, { createdAt: "desc" }];
    case "popular":
      return [{ soldCount: "desc" }, { ratingAverage: "desc" }];
    case "price-asc":
      return [{ basePricePaise: "asc" }];
    case "price-desc":
      return [{ basePricePaise: "desc" }];
    case "rating":
      return [{ ratingAverage: "desc" }, { ratingCount: "desc" }];
    case "featured":
    default:
      return [{ isFeatured: "desc" }, { isBestSeller: "desc" }, { soldCount: "desc" }];
  }
};

function buildWhere(state: ProductFilterState): Prisma.ProductWhereInput {
  const and: Prisma.ProductWhereInput[] = [{ isPublished: true }];

  if (state.category) {
    and.push({
      OR: [{ category: { slug: state.category } }, { category: { parent: { slug: state.category } } }],
    });
  }

  if (state.brand && state.brand.length > 0) {
    and.push({ brand: { slug: { in: state.brand } } });
  }

  if (state.minPricePaise !== undefined) {
    and.push({ basePricePaise: { gte: state.minPricePaise } });
  }
  if (state.maxPricePaise !== undefined) {
    and.push({ basePricePaise: { lte: state.maxPricePaise } });
  }

  if (state.rating !== undefined && state.rating > 0) {
    and.push({ ratingAverage: { gte: state.rating } });
  }

  if (state.productIds !== undefined) {
    // Editorial membership (a collection). Constrained here rather than filtered
    // in the caller so that paging, the total and the result set all describe the
    // collection instead of the whole catalogue. An empty array is a collection
    // with no members and must match nothing, which `in: []` does.
    and.push({ id: { in: state.productIds } });
  }

  if (state.inStockOnly) {
    and.push({ inventory: { some: { quantity: { gt: 0 } } } });
  }

  const term = state.search?.trim();
  if (term) {
    and.push({
      OR: [
        { name: { contains: term } },
        { shortDescription: { contains: term } },
        { tagsJson: { contains: term } },
        { brand: { name: { contains: term } } },
        { category: { name: { contains: term } } },
      ],
    });
  }

  // Size, colour and sale state are per-variant concerns, so they are expressed
  // as relation filters rather than on the product row.
  const relationFilters: Prisma.ProductWhereInput[] = [];

  if (state.size && state.size.length > 0) {
    relationFilters.push({ variants: { some: { size: { in: state.size }, isActive: true } } });
  }
  if (state.color && state.color.length > 0) {
    relationFilters.push({ variants: { some: { color: { in: state.color }, isActive: true } } });
  }
  if (state.discountOnly) {
    relationFilters.push({
      OR: [
        { compareAtPricePaise: { not: null } },
        { variants: { some: { compareAtPricePaise: { not: null } } } },
      ],
    });
  }

  return { AND: [...and, ...relationFilters] };
}

// ── Queries ──────────────────────────────────────────────────────────────────

export async function queryProducts(state: ProductFilterState): Promise<ProductQueryResult> {
  const where = buildWhere(state);
  const perPage = Math.min(48, Math.max(1, state.perPage));
  const total = await prisma.product.count({ where });
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const page = Math.min(Math.max(1, state.page), totalPages);

  const [rows, categoryCounts, brandRows, variantRows, priceRange, discountRows] = await Promise.all([
    prisma.product.findMany({
      where,
      include: CARD_INCLUDE,
      orderBy: orderByFor(state.sort),
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.category.findMany({
      where: { isActive: true, products: { some: { isPublished: true } } },
      orderBy: { position: "asc" },
      select: {
        name: true,
        slug: true,
        _count: { select: { products: { where: { isPublished: true } } } },
      },
    }),
    prisma.brand.findMany({
      where: { isActive: true, products: { some: { isPublished: true } } },
      orderBy: { position: "asc" },
      select: {
        name: true,
        slug: true,
        _count: { select: { products: { where: { isPublished: true } } } },
      },
    }),
    prisma.productVariant.findMany({
      where: { product: { isPublished: true } },
      select: { size: true, color: true },
    }),
    prisma.product.aggregate({
      where: { isPublished: true },
      _min: { basePricePaise: true },
      _max: { basePricePaise: true },
    }),
    prisma.product.findMany({
      where: { isPublished: true, compareAtPricePaise: { not: null } },
      select: { basePricePaise: true, compareAtPricePaise: true },
    }),
  ]);

  const sizeCounts = new Map<string, number>();
  const colorCounts = new Map<string, number>();
  for (const variant of variantRows) {
    sizeCounts.set(variant.size, (sizeCounts.get(variant.size) ?? 0) + 1);
    colorCounts.set(variant.color, (colorCounts.get(variant.color) ?? 0) + 1);
  }

  const maxDiscount = discountRows.reduce((max, row) => {
    if (!row.compareAtPricePaise || row.compareAtPricePaise <= row.basePricePaise) return max;
    return Math.max(
      max,
      Math.round(((row.compareAtPricePaise - row.basePricePaise) / row.compareAtPricePaise) * 100),
    );
  }, 0);

  const appliedFilters: AppliedFilter[] = [];
  if (state.search) appliedFilters.push({ label: "Search", key: "q", value: state.search });
  if (state.category) {
    const category = categoryCounts.find((entry) => entry.slug === state.category);
    appliedFilters.push({ label: "Category", key: "category", value: category?.name ?? state.category });
  }
  for (const slug of state.brand ?? []) {
    const brand = brandRows.find((entry) => entry.slug === slug);
    appliedFilters.push({ label: "Brand", key: "brand", value: brand?.name ?? slug });
  }
  for (const size of state.size ?? []) appliedFilters.push({ label: "Size", key: "size", value: size });
  for (const color of state.color ?? []) {
    appliedFilters.push({ label: "Colour", key: "color", value: color });
  }
  if (state.minPricePaise !== undefined || state.maxPricePaise !== undefined) {
    appliedFilters.push({
      label: "Price",
      key: "price",
      value: `${(state.minPricePaise ?? 0) / 100} – ${(state.maxPricePaise ?? 0) / 100}`,
    });
  }
  if (state.rating) appliedFilters.push({ label: "Rating", key: "rating", value: `${state.rating}★ & up` });
  if (state.inStockOnly) appliedFilters.push({ label: "Availability", key: "stock", value: "In stock" });
  if (state.discountOnly) appliedFilters.push({ label: "Offer", key: "discount", value: "On sale" });

  return {
    products: rows.map(mapProductCard),
    total,
    page,
    perPage,
    totalPages,
    facets: {
      categories: categoryCounts.map((entry) => ({
        value: entry.slug,
        label: entry.name,
        count: entry._count.products,
      })),
      brands: brandRows.map((entry) => ({
        value: entry.slug,
        label: entry.name,
        count: entry._count.products,
      })),
      sizes: [...sizeCounts.entries()]
        .map(([value, count]) => ({ value, label: value, count }))
        .sort((a, b) => a.label.localeCompare(b.label, "en", { numeric: true })),
      colors: [...colorCounts.entries()]
        .map(([value, count]) => ({ value, label: value, count }))
        .sort((a, b) => a.label.localeCompare(b.label)),
      priceRange: {
        minPaise: priceRange._min.basePricePaise ?? 0,
        maxPaise: priceRange._max.basePricePaise ?? 0,
      },
      maxDiscount,
    },
    appliedFilters,
  };
}

export async function getProductBySlug(slug: string): Promise<ProductDetailView | null> {
  const row = await prisma.product.findFirst({
    where: { slug, isPublished: true },
    include: {
      brand: { select: { name: true, slug: true } },
      category: { select: { name: true, slug: true } },
      images: { orderBy: { position: "asc" }, select: { url: true, alt: true } },
      variants: {
        where: { isActive: true },
        orderBy: { position: "asc" },
        select: {
          id: true,
          sku: true,
          size: true,
          color: true,
          colorHex: true,
          pricePaise: true,
          compareAtPricePaise: true,
          inventory: { select: { quantity: true, reserved: true } },
        },
      },
      reviews: {
        where: { isApproved: true },
        orderBy: { createdAt: "desc" },
        take: 8,
        select: {
          id: true,
          authorName: true,
          rating: true,
          title: true,
          body: true,
          isVerifiedPurchase: true,
          createdAt: true,
        },
      },
      _count: { select: { reviews: { where: { isApproved: true } } } },
    },
  });

  if (!row) return null;

  const variants = row.variants.map(mapProductVariant);
  const card = mapProductCard({ ...row, images: row.images.slice(0, 2) });

  // PDP gallery always shows real photography (see image-map.ts).
  const real = realEntryFor(card.slug);
  const gallery = real
    ? [
        { url: real.gallery[0]!, alt: real.imageAlt },
        { url: real.gallery[1]!, alt: `${card.name}, material and stitching detail close-up` },
        { url: real.gallery[2]!, alt: `${card.name}, secondary technical angle` },
      ]
    : row.images.map((image) => ({ url: image.url, alt: image.alt }));

  return {
    ...card,
    sku: row.sku,
    description: row.description ?? "",
    material: row.material,
    careInstructions: row.careInstructions,
    warrantyMonths: row.warrantyMonths,
    returnDays: row.returnDays,
    features: parseFeatures(row.featuresJson),
    specs: parseSpecs(row.specsJson),
    tags: parseTags(row.tagsJson),
    variants,
    gallery,
    seoTitle: row.seoTitle,
    seoDescription: row.seoDescription,
    publishedAt: row.publishedAt,
    ratingBreakdown: await getRatingBreakdown(row.id),
    reviewCount: row._count.reviews,
    reviews: row.reviews.map((review) => ({
      id: review.id,
      authorName: review.authorName,
      rating: review.rating,
      title: review.title,
      body: review.body,
      isVerifiedPurchase: review.isVerifiedPurchase,
      createdAt: review.createdAt,
    })),
  };
}

export async function getProductSlugs(): Promise<{ slug: string; updatedAt: Date }[]> {
  return prisma.product.findMany({
    where: { isPublished: true },
    select: { slug: true, updatedAt: true },
  });
}

export async function getProductsBySlugs(slugs: string[]): Promise<ProductCardView[]> {
  if (slugs.length === 0) return [];
  const rows = await prisma.product.findMany({
    where: { slug: { in: slugs }, isPublished: true },
    include: CARD_INCLUDE,
  });
  const bySlug = new Map(rows.map((row) => [row.slug, mapProductCard(row)]));
  return slugs
    .map((slug) => bySlug.get(slug))
    .filter((item): item is ProductCardView => Boolean(item));
}

export async function getCuratedRail(
  kind: "new" | "bestseller" | "featured",
  take = 8,
): Promise<ProductCardView[]> {
  const where: Prisma.ProductWhereInput =
    kind === "new"
      ? { isPublished: true, isNew: true }
      : kind === "bestseller"
        ? { isPublished: true, isBestSeller: true }
        : { isPublished: true, isFeatured: true };

  const rows = await prisma.product.findMany({
    where,
    include: CARD_INCLUDE,
    orderBy: orderByFor(kind === "new" ? "newest" : kind === "bestseller" ? "popular" : "featured"),
    take,
  });

  if (rows.length >= take) return rows.map(mapProductCard);

  // A rail should never render half-empty because a flag is thin, so top up from
  // the rest of the catalogue without duplicating what is already shown.
  const topUp = await prisma.product.findMany({
    where: { isPublished: true, id: { notIn: rows.map((row) => row.id) } },
    include: CARD_INCLUDE,
    orderBy: orderByFor("popular"),
    take: take - rows.length,
  });

  return [...rows, ...topUp].map(mapProductCard);
}

export async function getFeaturedCategories(): Promise<CategoryView[]> {
  const rows = await prisma.category.findMany({
    where: { isActive: true, isFeatured: true },
    orderBy: { position: "asc" },
    include: {
      _count: { select: { products: { where: { isPublished: true } } } },
      children: {
        where: { isActive: true },
        orderBy: { position: "asc" },
        select: {
          id: true,
          name: true,
          slug: true,
          _count: { select: { products: { where: { isPublished: true } } } },
        },
      },
    },
  });

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    shortDescription: row.shortDescription,
    description: row.description,
    image: categoryImageFor(row.slug, row.image),
    productCount: row._count.products,
    children: row.children.map((child) => ({
      id: child.id,
      name: child.name,
      slug: child.slug,
      productCount: child._count.products,
    })),
  }));
}

export async function getCategoryBySlug(slug: string): Promise<CategoryView | null> {
  const row = await prisma.category.findUnique({
    where: { slug },
    include: {
      _count: { select: { products: { where: { isPublished: true } } } },
      children: {
        where: { isActive: true },
        orderBy: { position: "asc" },
        select: {
          id: true,
          name: true,
          slug: true,
          _count: { select: { products: { where: { isPublished: true } } } },
        },
      },
    },
  });
  if (!row || !row.isActive) return null;

  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    shortDescription: row.shortDescription,
    description: row.description,
    image: categoryImageFor(row.slug, row.image),
    productCount: row._count.products,
    children: row.children.map((child) => ({
      id: child.id,
      name: child.name,
      slug: child.slug,
      productCount: child._count.products,
    })),
  };
}

export async function getCategorySlugs(): Promise<{ slug: string; updatedAt: Date }[]> {
  return prisma.category.findMany({
    where: { isActive: true },
    select: { slug: true, updatedAt: true },
  });
}

export async function getBrands(): Promise<BrandView[]> {
  const rows = await prisma.brand.findMany({
    where: { isActive: true },
    orderBy: { position: "asc" },
    include: { _count: { select: { products: { where: { isPublished: true } } } } },
  });

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    logo: row.logo ?? `/images/brands/${row.slug}/logo-dark.svg`,
    logoLight: `/images/brands/${row.slug}/logo-light.svg`,
    logoDark: `/images/brands/${row.slug}/logo-dark.svg`,
    banner: `/images/brands/${row.slug}/banner.webp`,
    tile: `/images/brands/${row.slug}/tile.webp`,
    alt: `${row.name} brand wordmark logo`,
    productCount: row._count.products,
  }));
}

export async function getBrandBySlug(slug: string): Promise<BrandView | null> {
  const row = await prisma.brand.findUnique({
    where: { slug },
    include: { _count: { select: { products: { where: { isPublished: true } } } } },
  });
  if (!row || !row.isActive) return null;

  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    logo: row.logo ?? `/images/brands/${row.slug}/logo-dark.svg`,
    logoLight: `/images/brands/${row.slug}/logo-light.svg`,
    logoDark: `/images/brands/${row.slug}/logo-dark.svg`,
    banner: `/images/brands/${row.slug}/banner.webp`,
    tile: `/images/brands/${row.slug}/tile.webp`,
    alt: `${row.name} brand wordmark logo`,
    productCount: row._count.products,
  };
}

export async function getCollections(take = 4): Promise<CollectionView[]> {
  const rows = await prisma.collection.findMany({
    where: { isActive: true },
    orderBy: { position: "asc" },
    take,
    include: { _count: { select: { products: true } } },
  });

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    tagline: row.tagline,
    description: row.description,
    image: collectionImageFor(row.slug, row.image),
    productCount: row._count.products,
  }));
}

export async function getCollectionBySlug(slug: string): Promise<CollectionView | null> {
  const row = await prisma.collection.findUnique({
    where: { slug },
    include: { _count: { select: { products: true } } },
  });
  if (!row || !row.isActive) return null;
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    tagline: row.tagline,
    description: row.description,
    image: collectionImageFor(row.slug, row.image),
    productCount: row._count.products,
  };
}

export async function getCollectionSlugs(): Promise<{ slug: string; updatedAt: Date }[]> {
  return prisma.collection.findMany({
    where: { isActive: true },
    select: { slug: true, updatedAt: true },
  });
}

export async function getCollectionProductIds(slug: string): Promise<string[]> {
  const rows = await prisma.collectionProduct.findMany({
    where: { collection: { slug } },
    orderBy: { position: "asc" },
    select: { productId: true },
  });
  return rows.map((row) => row.productId);
}

export async function getProductsByIds(ids: string[]): Promise<ProductCardView[]> {
  if (ids.length === 0) return [];
  const rows = await prisma.product.findMany({
    where: { id: { in: ids }, isPublished: true },
    include: CARD_INCLUDE,
  });
  const byId = new Map(rows.map((row) => [row.id, mapProductCard(row)]));
  return ids
    .map((id) => byId.get(id))
    .filter((item): item is ProductCardView => Boolean(item));
}

export async function getRelatedProducts(
  categorySlug: string | null,
  excludeProductId: string,
  take = 4,
): Promise<ProductCardView[]> {
  if (!categorySlug) return [];
  const rows = await prisma.product.findMany({
    where: { isPublished: true, category: { slug: categorySlug }, id: { not: excludeProductId } },
    include: CARD_INCLUDE,
    orderBy: [{ isBestSeller: "desc" }, { soldCount: "desc" }],
    take,
  });
  return rows.map(mapProductCard);
}

export async function getHomepageReviews(take = 6): Promise<ReviewView[]> {
  const rows = await prisma.review.findMany({
    where: { isApproved: true, rating: { gte: 4 } },
    orderBy: [{ isVerifiedPurchase: "desc" }, { createdAt: "desc" }],
    take,
    select: {
      id: true,
      authorName: true,
      rating: true,
      title: true,
      body: true,
      isVerifiedPurchase: true,
      createdAt: true,
    },
  });

  return rows.map((row) => ({
    id: row.id,
    authorName: row.authorName,
    rating: row.rating,
    title: row.title,
    body: row.body,
    isVerifiedPurchase: row.isVerifiedPurchase,
    createdAt: row.createdAt,
  }));
}

export async function getRatingBreakdown(
  productId: string,
): Promise<{ rating: number; count: number }[]> {
  const grouped = await prisma.review.groupBy({
    by: ["rating"],
    where: { productId, isApproved: true },
    _count: { rating: true },
  });

  const counts = new Map(grouped.map((row) => [row.rating, row._count.rating]));
  return [5, 4, 3, 2, 1].map((rating) => ({ rating, count: counts.get(rating) ?? 0 }));
}

export async function searchProducts(term: string, take = 6): Promise<ProductCardView[]> {
  const trimmed = term.trim();
  if (trimmed.length < 2) return [];
  const rows = await prisma.product.findMany({
    where: {
      isPublished: true,
      OR: [
        { name: { contains: trimmed } },
        { shortDescription: { contains: trimmed } },
        { tagsJson: { contains: trimmed } },
        { brand: { name: { contains: trimmed } } },
      ],
    },
    include: CARD_INCLUDE,
    orderBy: [{ soldCount: "desc" }, { ratingAverage: "desc" }],
    take,
  });
  return rows.map(mapProductCard);
}

export async function getPopularSearches(take = 6): Promise<string[]> {
  const rows = await prisma.product.findMany({
    where: { isPublished: true, tagsJson: { not: null } },
    select: { tagsJson: true },
    take: 60,
  });

  const counts = new Map<string, number>();
  for (const row of rows) {
    for (const tag of parseJsonArray<string>(row.tagsJson)) {
      const label = tag.charAt(0).toUpperCase() + tag.slice(1);
      counts.set(label, (counts.get(label) ?? 0) + 1);
    }
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, take)
    .map(([tag]) => tag);
}

export { isSortOption };
