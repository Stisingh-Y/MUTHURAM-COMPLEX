import "server-only";

import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { CARD_INCLUDE, mapProductCard, type ProductCardView } from "@/lib/data/mappers";

/**
 * Wishlist
 * --------
 * Signed-in riders get a database wishlist. Guests get the same UX backed by a
 * cookie holding product ids, so "add to wishlist" is never a dead button before
 * sign-in — it is promoted into the account on sign-in, mirroring the cart.
 */

const WISHLIST_COOKIE = "mc_wishlist";
const MAX_COOKIE_IDS = 60;

export type WishlistEntry = ProductCardView & { wishlistItemId: string | null };

function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 24 * 60 * 60,
  };
}

async function readGuestIds(): Promise<string[]> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(WISHLIST_COOKIE)?.value;
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
}

async function writeGuestIds(ids: string[]): Promise<void> {
  const cookieStore = await cookies();
  const trimmed = ids.slice(0, MAX_COOKIE_IDS);
  if (trimmed.length === 0) {
    cookieStore.delete(WISHLIST_COOKIE);
    return;
  }
  cookieStore.set(WISHLIST_COOKIE, JSON.stringify(trimmed), cookieOptions());
}

export async function getWishlist(userId: string | null): Promise<WishlistEntry[]> {
  if (!userId) {
    const ids = await readGuestIds();
    if (ids.length === 0) return [];
    const products = await prisma.product.findMany({
      where: { id: { in: ids }, isPublished: true },
      include: CARD_INCLUDE,
    });
    const byId = new Map(products.map((product) => [product.id, product]));
    return ids
      .map((id) => byId.get(id))
      .filter((product): product is NonNullable<typeof product> => Boolean(product))
      .map((product) => ({ ...mapProductCard(product), wishlistItemId: null }));
  }

  const wishlist = await prisma.wishlist.findUnique({
    where: { userId },
    include: {
      items: {
        orderBy: { createdAt: "desc" },
        include: { product: { include: CARD_INCLUDE } },
      },
    },
  });

  if (!wishlist) return [];

  return wishlist.items
    .filter((item) => item.product.isPublished)
    .map((item) => ({ ...mapProductCard(item.product), wishlistItemId: item.id }));
}

export async function getWishlistIds(userId: string | null): Promise<string[]> {
  const entries = await getWishlist(userId);
  return entries.map((entry) => entry.id);
}

export type WishlistToggleResult = { ok: boolean; added: boolean; count: number; error?: string };

export async function toggleWishlist(
  userId: string | null,
  productId: string,
): Promise<WishlistToggleResult> {
  const product = await prisma.product.findFirst({
    where: { id: productId, isPublished: true },
    select: { id: true },
  });
  if (!product) {
    return { ok: false, added: false, count: 0, error: "This product is no longer available." };
  }

  if (!userId) {
    const ids = await readGuestIds();
    const exists = ids.includes(productId);
    const next = exists ? ids.filter((id) => id !== productId) : [...ids, productId];
    await writeGuestIds(next);
    return { ok: true, added: !exists, count: next.length };
  }

  const wishlist = await prisma.wishlist.upsert({
    where: { userId },
    update: {},
    create: { userId },
    select: { id: true },
  });

  const existing = await prisma.wishlistItem.findUnique({
    where: { wishlistId_productId: { wishlistId: wishlist.id, productId } },
    select: { id: true },
  });

  if (existing) {
    await prisma.wishlistItem.delete({ where: { id: existing.id } });
    const count = await prisma.wishlistItem.count({ where: { wishlistId: wishlist.id } });
    return { ok: true, added: false, count };
  }

  await prisma.wishlistItem.create({ data: { wishlistId: wishlist.id, productId } });
  const count = await prisma.wishlistItem.count({ where: { wishlistId: wishlist.id } });
  return { ok: true, added: true, count };
}

export async function removeFromWishlist(userId: string | null, productId: string): Promise<number> {
  if (!userId) {
    const ids = await readGuestIds();
    const next = ids.filter((id) => id !== productId);
    await writeGuestIds(next);
    return next.length;
  }

  const wishlist = await prisma.wishlist.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!wishlist) return 0;

  await prisma.wishlistItem.deleteMany({ where: { wishlistId: wishlist.id, productId } });
  return prisma.wishlistItem.count({ where: { wishlistId: wishlist.id } });
}

/** Promotes a guest wishlist into the account when the rider signs in. */
export async function mergeGuestWishlist(userId: string): Promise<void> {
  const guestIds = await readGuestIds();
  if (guestIds.length === 0) return;

  const wishlist = await prisma.wishlist.upsert({
    where: { userId },
    update: {},
    create: { userId },
    select: { id: true },
  });

  for (const productId of guestIds) {
    const product = await prisma.product.findFirst({
      where: { id: productId, isPublished: true },
      select: { id: true },
    });
    if (!product) continue;
    await prisma.wishlistItem
      .create({ data: { wishlistId: wishlist.id, productId } })
      .catch(() => undefined);
  }

  await writeGuestIds([]);
}

// ── Recently viewed ──────────────────────────────────────────────────────────

const RECENT_COOKIE = "mc_recent";
const RECENT_LIMIT = 12;

export async function recordRecentlyViewed(userId: string | null, productId: string): Promise<void> {
  if (userId) {
    // The composite unique key is (userId, sessionToken, productId) and
    // sessionToken is null here, so match on the fields we know rather than
    // relying on a null-containing unique lookup.
    const existing = await prisma.recentlyViewed.findFirst({
      where: { userId, productId },
      select: { id: true },
    });

    if (existing) {
      await prisma.recentlyViewed.update({
        where: { id: existing.id },
        data: { viewedAt: new Date() },
      });
    } else {
      await prisma.recentlyViewed
        .create({ data: { userId, productId } })
        .catch(() => undefined);
    }

    // Keep only the most recent RECENT_LIMIT entries per user.
    const stale = await prisma.recentlyViewed.findMany({
      where: { userId },
      orderBy: { viewedAt: "desc" },
      skip: RECENT_LIMIT,
      select: { id: true },
    });
    if (stale.length > 0) {
      await prisma.recentlyViewed.deleteMany({
        where: { id: { in: stale.map((row) => row.id) } },
      });
    }
    return;
  }

  const cookieStore = await cookies();
  const raw = cookieStore.get(RECENT_COOKIE)?.value;
  let ids: string[] = [];
  if (raw) {
    try {
      const parsed: unknown = JSON.parse(raw);
      if (Array.isArray(parsed)) ids = parsed.filter((id): id is string => typeof id === "string");
    } catch {
      ids = [];
    }
  }
  const next = [productId, ...ids.filter((id) => id !== productId)].slice(0, RECENT_LIMIT);
  cookieStore.set(RECENT_COOKIE, JSON.stringify(next), cookieOptions());
}

export async function getRecentlyViewed(userId: string | null, excludeProductId?: string): Promise<ProductCardView[]> {
  let ids: string[] = [];

  if (userId) {
    const rows = await prisma.recentlyViewed.findMany({
      where: { userId },
      orderBy: { viewedAt: "desc" },
      take: RECENT_LIMIT,
      select: { productId: true },
    });
    ids = rows.map((row) => row.productId);
  } else {
    const cookieStore = await cookies();
    const raw = cookieStore.get(RECENT_COOKIE)?.value;
    if (raw) {
      try {
        const parsed: unknown = JSON.parse(raw);
        if (Array.isArray(parsed)) ids = parsed.filter((id): id is string => typeof id === "string");
      } catch {
        ids = [];
      }
    }
  }

  const filtered = excludeProductId ? ids.filter((id) => id !== excludeProductId) : ids;
  if (filtered.length === 0) return [];

  const products = await prisma.product.findMany({
    where: { id: { in: filtered }, isPublished: true },
    include: CARD_INCLUDE,
  });
  const byId = new Map(products.map((product) => [product.id, product]));
  return filtered
    .map((id) => byId.get(id))
    .filter((product): product is NonNullable<typeof product> => Boolean(product))
    .map((product) => mapProductCard(product));
}

