import "server-only";

import { prisma } from "@/lib/db";
import type { CategoryView } from "@/lib/data/products";

/**
 * Navigation data.
 *
 * Deliberately separate from `data/products.ts`: the chrome needs a shallow,
 * cache-friendly list of categories that is safe to read on every request, not
 * the full product query machinery.
 */

export type NavCategory = Pick<
  CategoryView,
  "id" | "name" | "slug" | "shortDescription" | "productCount"
>;

/** Every active top-level category, in display order. */
export async function getNavigationCategories(): Promise<NavCategory[]> {
  const rows = await prisma.category.findMany({
    where: { isActive: true, parentId: null },
    orderBy: { position: "asc" },
    select: { id: true, name: true, slug: true, shortDescription: true, _count: true },
  });

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    shortDescription: row.shortDescription,
    productCount: row._count.products,
  }));
}

export type NavCollection = { name: string; slug: string; tagline: string | null };

/** Active collections for the "Shop by edit" rail in the navigation. */
export async function getNavigationCollections(): Promise<NavCollection[]> {
  const rows = await prisma.collection.findMany({
    where: { isActive: true },
    orderBy: { position: "asc" },
    select: { name: true, slug: true, tagline: true },
  });
  return rows;
}