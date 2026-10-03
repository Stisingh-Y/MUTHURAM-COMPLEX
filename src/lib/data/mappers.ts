import type { Prisma } from "@/generated/prisma/client";
import { getLqip } from "@/lib/image-placeholders";
import { realEntryFor } from "@/lib/data/image-map";

/**
 * The single place a product row becomes a `ProductCardView`.
 *
 * Every surface that shows a product — shop grid, rails, wishlist, cart drawer,
 * search suggestions, order history — maps through here, so a change to pricing
 * or badge logic can never produce two different truths.
 */

export type ProductImageView = { url: string; alt: string };

export type ProductVariantView = {
  id: string;
  sku: string;
  size: string;
  color: string;
  colorHex: string;
  pricePaise: number;
  compareAtPricePaise: number | null;
  availableQuantity: number;
  isAvailable: boolean;
};

export type ProductBadge = "NEW" | "BESTSELLER" | "SALE" | "LIMITED" | "OUT_OF_STOCK";

export type ProductCardView = {
  id: string;
  name: string;
  slug: string;
  brandName: string;
  brandSlug: string | null;
  categoryName: string;
  categorySlug: string | null;
  shortDescription: string;
  pricePaise: number;
  compareAtPricePaise: number | null;
  discountPercent: number | null;
  image: ProductImageView;
  secondaryImage: ProductImageView | null;
  images: ProductImageView[];
  imageAlt: string;
  blurDataURL?: string;
  ratingAverage: number;
  ratingCount: number;
  isNew: boolean;
  isBestSeller: boolean;
  isFeatured: boolean;
  badges: ProductBadge[];
  availableSizes: string[];
  colorOptions: { name: string; hex: string }[];
  isInStock: boolean;
  totalQuantity: number;
};

export const CARD_INCLUDE = {
  brand: { select: { name: true, slug: true } },
  category: { select: { name: true, slug: true } },
  images: { orderBy: { position: "asc" }, take: 3, select: { url: true, alt: true } },
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
} satisfies Prisma.ProductInclude;

export type ProductCardRow = Prisma.ProductGetPayload<{ include: typeof CARD_INCLUDE }>;

type VariantRow = ProductCardRow["variants"][number];

export function mapProductVariant(row: VariantRow): ProductVariantView {
  const availableQuantity = Math.max(
    0,
    (row.inventory?.quantity ?? 0) - (row.inventory?.reserved ?? 0),
  );
  return {
    id: row.id,
    sku: row.sku,
    size: row.size,
    color: row.color,
    colorHex: row.colorHex ?? "#22262A",
    pricePaise: row.pricePaise,
    compareAtPricePaise: row.compareAtPricePaise,
    availableQuantity,
    isAvailable: availableQuantity > 0,
  };
}

function resolveBadges(row: {
  isNew: boolean;
  isBestSeller: boolean;
  compareAtPricePaise: number | null;
  basePricePaise: number;
  totalQuantity: number;
}): ProductBadge[] {
  const badges: ProductBadge[] = [];
  if (row.isNew) badges.push("NEW");
  if (row.isBestSeller) badges.push("BESTSELLER");
  if (row.compareAtPricePaise && row.compareAtPricePaise > row.basePricePaise) badges.push("SALE");
  // "Limited" is deliberately tight: it should mean hurry up, not everything.
  if (row.totalQuantity > 0 && row.totalQuantity <= 8) badges.push("LIMITED");
  if (row.totalQuantity <= 0) badges.push("OUT_OF_STOCK");
  return badges;
}

export function mapProductCard(row: ProductCardRow): ProductCardView {
  const variants = row.variants.map(mapProductVariant);
  const totalQuantity = variants.reduce((sum, variant) => sum + variant.availableQuantity, 0);

  // Show the cheapest actually-purchasable variant. If everything is sold out,
  // fall back to the full range so the card can still state a price honestly.
  const purchasable = variants.filter((variant) => variant.isAvailable);
  const reference = purchasable.length > 0 ? purchasable : variants;
  const pricePaise =
    reference.length > 0
      ? Math.min(...reference.map((variant) => variant.pricePaise))
      : row.basePricePaise;

  const compareCandidates = reference
    .map((variant) => variant.compareAtPricePaise)
    .filter((value): value is number => value !== null && value > pricePaise);
  const compareAtPricePaise =
    compareCandidates.length > 0 ? Math.min(...compareCandidates) : null;

  const defaultMain = `/images/products/${row.slug}/main.webp`;
  const defaultDetail = `/images/products/${row.slug}/detail.webp`;
  const defaultAngle = `/images/products/${row.slug}/angle.webp`;

  // Real photography (src/lib/data/image-map.ts) always wins over stored or
  // generated paths: every slug resolves to an optimised WebP on disk.
  const real = realEntryFor(row.slug);

  const mainImage: ProductImageView =
    real
      ? { url: real.main, alt: real.imageAlt }
      : row.images[0] && !row.images[0].url.includes("coming-soon")
        ? row.images[0]
        : { url: defaultMain, alt: `${row.name}, studio front three-quarter view` };

  const detailImage: ProductImageView =
    real
      ? { url: real.gallery[1]!, alt: `${row.name}, material and stitching detail close-up` }
      : row.images[1] && !row.images[1].url.includes("coming-soon")
        ? row.images[1]
        : { url: defaultDetail, alt: `${row.name}, material and stitching detail close-up` };

  const angleImage: ProductImageView =
    real
      ? { url: real.gallery[2]!, alt: `${row.name}, secondary technical angle` }
      : row.images[2] && !row.images[2].url.includes("coming-soon")
        ? row.images[2]
        : { url: defaultAngle, alt: `${row.name}, secondary technical angle` };

  const allImages: ProductImageView[] = [mainImage, detailImage, angleImage];
  const secondaryImage: ProductImageView | null = angleImage;

  const colors = new Map<string, { name: string; hex: string }>();
  for (const variant of variants) {
    if (!colors.has(variant.color)) {
      colors.set(variant.color, { name: variant.color, hex: variant.colorHex });
    }
  }

  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    brandName: row.brand?.name ?? "Muthuram",
    brandSlug: row.brand?.slug ?? null,
    categoryName: row.category?.name ?? "Gear",
    categorySlug: row.category?.slug ?? null,
    shortDescription: row.shortDescription ?? "",
    pricePaise,
    compareAtPricePaise,
    discountPercent:
      compareAtPricePaise && compareAtPricePaise > pricePaise
        ? Math.round(((compareAtPricePaise - pricePaise) / compareAtPricePaise) * 100)
        : null,
    image: mainImage,
    secondaryImage,
    images: allImages,
    imageAlt: mainImage.alt,
    blurDataURL: real?.blurDataURL || getLqip(mainImage.url),
    ratingAverage: row.ratingAverage,
    ratingCount: row.ratingCount,
    isNew: row.isNew,
    isBestSeller: row.isBestSeller,
    isFeatured: row.isFeatured,
    badges: resolveBadges({ ...row, totalQuantity }),
    availableSizes: [...new Set(variants.map((variant) => variant.size))],
    colorOptions: [...colors.values()],
    isInStock: totalQuantity > 0,
    totalQuantity,
  };
}
