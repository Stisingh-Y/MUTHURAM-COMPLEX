import "server-only";

import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { isDiscountType, FREE_SHIPPING_THRESHOLD_PAISE } from "@/lib/enums";

/**
 * Cart
 * ----
 * One `Cart` row per signed-in user, or per guest browser token. The guest
 * token lives in an httpOnly cookie and is merged into the user's cart on sign-in
 * so nobody loses their basket by logging in.
 *
 * Every price used in a cart total is recomputed from the database at read time.
 * The client sends product/variant ids and quantities only — never prices.
 */

const CART_COOKIE = "mc_cart";
const CART_COOKIE_DAYS = 60;

export type CartLineView = {
  id: string;
  productId: string;
  variantId: string | null;
  name: string;
  slug: string;
  brandName: string;
  image: { url: string; alt: string };
  variantLabel: string | null;
  variantOptions: { name: string; hex: string }[];
  sku: string;
  unitPricePaise: number;
  compareAtPricePaise: number | null;
  quantity: number;
  lineTotalPaise: number;
  availableQuantity: number;
  isAvailable: boolean;
  maxQuantity: number;
  isSaved: boolean;
  categorySlug: string | null;
  categoryName: string;
};

export type CouponView = {
  code: string;
  description: string | null;
  discountPaise: number;
  label: string;
};

export type CartTotals = {
  subtotalPaise: number;
  discountPaise: number;
  shippingPaise: number;
  taxPaise: number;
  totalPaise: number;
  itemCount: number;
  freeShippingThresholdPaise: number;
  amountToFreeShippingPaise: number;
  qualifiesForFreeShipping: boolean;
};

export type CartView = {
  id: string | null;
  lines: CartLineView[];
  savedLines: CartLineView[];
  coupon: CouponView | null;
  totals: CartTotals;
  hasUnavailableLines: boolean;
};

const EMPTY_TOTALS: CartTotals = {
  subtotalPaise: 0,
  discountPaise: 0,
  shippingPaise: 0,
  taxPaise: 0,
  totalPaise: 0,
  itemCount: 0,
  freeShippingThresholdPaise: FREE_SHIPPING_THRESHOLD_PAISE,
  amountToFreeShippingPaise: 0,
  qualifiesForFreeShipping: false,
};

type CartRow = NonNullable<Awaited<ReturnType<typeof loadCartRow>>>;

async function loadCartRow(userId: string | null, sessionToken: string | null) {
  if (userId) {
    const byUser = await prisma.cart.findUnique({ where: { userId } });
    if (byUser) return byUser;
    return prisma.cart.create({ data: { userId } });
  }
  if (sessionToken) {
    const byToken = await prisma.cart.findUnique({ where: { sessionToken } });
    if (byToken) return byToken;
    return prisma.cart.create({ data: { sessionToken } });
  }
  return null;
}

/** Reads (or lazily creates) the guest cart token from the cookie. */
export async function getCartSessionToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(CART_COOKIE)?.value ?? null;
}

export async function ensureCartSessionToken(): Promise<string> {
  const cookieStore = await cookies();
  const existing = cookieStore.get(CART_COOKIE)?.value;
  if (existing) return existing;

  const token = crypto.randomUUID();
  cookieStore.set(CART_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: CART_COOKIE_DAYS * 24 * 60 * 60,
  });
  return token;
}

export async function clearCartSessionToken(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(CART_COOKIE);
}

export async function getCart(userId: string | null): Promise<CartView> {
  const sessionToken = userId ? null : await getCartSessionToken();
  const cart = await loadCartRow(userId, sessionToken);
  if (!cart) return { id: null, lines: [], savedLines: [], coupon: null, totals: EMPTY_TOTALS, hasUnavailableLines: false };

  return hydrateCart(cart);
}

const cartInclude = {
  items: {
    orderBy: { createdAt: "desc" },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          slug: true,
          isPublished: true,
          brand: { select: { name: true } },
          category: { select: { name: true, slug: true } },
          images: { orderBy: { position: "asc" }, take: 1, select: { url: true, alt: true } },
        },
      },
      variant: {
        select: {
          id: true,
          sku: true,
          size: true,
          color: true,
          colorHex: true,
          pricePaise: true,
          compareAtPricePaise: true,
          isActive: true,
          inventory: { select: { quantity: true, reserved: true } },
        },
      },
    },
  },
} as const;

async function hydrateCart(cart: CartRow): Promise<CartView> {
  if (!cart?.id) {
    return { id: null, lines: [], savedLines: [], coupon: null, totals: EMPTY_TOTALS, hasUnavailableLines: false };
  }

  const fresh = await prisma.cart.findUnique({
    where: { id: cart.id },
    include: cartInclude,
  });

  if (!fresh) {
    return { id: null, lines: [], savedLines: [], coupon: null, totals: EMPTY_TOTALS, hasUnavailableLines: false };
  }

  const lines: CartLineView[] = [];
  const savedLines: CartLineView[] = [];

  for (const item of fresh.items) {
    if (!item.product.isPublished) continue;

    const variant = item.variant && item.variant.isActive ? item.variant : null;
    const availableQuantity = variant
      ? Math.max(0, (variant.inventory?.quantity ?? 0) - (variant.inventory?.reserved ?? 0))
      : 0;
    // Price always comes from the variant row, never from the cart snapshot.
    const unitPricePaise = variant?.pricePaise ?? item.unitPricePaise;
    const defaultImg = `/images/products/${item.product.slug}/main.webp`;
    const image =
      item.product.images[0] && !item.product.images[0].url.includes("coming-soon")
        ? item.product.images[0]
        : { url: defaultImg, alt: item.product.name };
    const maxQuantity = Math.max(1, Math.min(10, availableQuantity || 1));

    const line: CartLineView = {
      id: item.id,
      productId: item.productId,
      variantId: item.variantId,
      name: item.product.name,
      slug: item.product.slug,
      brandName: item.product.brand?.name ?? "Muthuram",
      image,
      variantLabel: variant ? `${variant.size} · ${variant.color}` : null,
      variantOptions: variant ? [{ name: variant.color, hex: variant.colorHex ?? "#22262A" }] : [],
      sku: variant?.sku ?? item.product.name,
      unitPricePaise,
      compareAtPricePaise: variant?.compareAtPricePaise ?? null,
      quantity: item.quantity,
      lineTotalPaise: unitPricePaise * item.quantity,
      availableQuantity,
      isAvailable: availableQuantity > 0,
      maxQuantity,
      isSaved: Boolean(item.savedAt),
      categorySlug: item.product.category?.slug ?? null,
      categoryName: item.product.category?.name ?? "Gear",
    };

    if (item.savedAt) savedLines.push(line);
    else lines.push(line);
  }

  const subtotalPaise = lines.reduce((sum, line) => sum + line.lineTotalPaise, 0);
  const itemCount = lines.reduce((sum, line) => sum + line.quantity, 0);

  const coupon = fresh.couponCode ? await resolveCoupon(fresh.couponCode, subtotalPaise, userIdOf(cart)) : null;
  const discountPaise = coupon?.discountPaise ?? 0;

  const shippingBase = subtotalPaise - discountPaise;
  const qualifiesForFreeShipping = shippingBase >= FREE_SHIPPING_THRESHOLD_PAISE;
  const shippingPaise = lines.length === 0 ? 0 : qualifiesForFreeShipping ? 0 : 9900;

  return {
    id: fresh.id,
    lines,
    savedLines,
    coupon,
    totals: {
      subtotalPaise,
      discountPaise,
      shippingPaise,
      taxPaise: 0,
      totalPaise: Math.max(0, shippingBase + shippingPaise),
      itemCount,
      freeShippingThresholdPaise: FREE_SHIPPING_THRESHOLD_PAISE,
      amountToFreeShippingPaise: Math.max(0, FREE_SHIPPING_THRESHOLD_PAISE - shippingBase),
      qualifiesForFreeShipping,
    },
    hasUnavailableLines: lines.some((line) => !line.isAvailable),
  };
}

function userIdOf(cart: CartRow): string | null {
  return cart.userId;
}

export async function resolveCoupon(
  code: string,
  subtotalPaise: number,
  userId: string | null,
): Promise<CouponView | null> {
  const normalised = code.trim().toUpperCase();
  const coupon = await prisma.coupon.findUnique({
    where: { code: normalised },
    include: {
      usages: {
        where: userId ? { userId } : { userId: "__guest__" },
        select: { id: true },
      },
    },
  });

  if (!coupon || !coupon.isActive) return null;

  const now = new Date();
  if (coupon.startsAt && coupon.startsAt > now) return null;
  if (coupon.expiresAt && coupon.expiresAt < now) return null;
  if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) return null;
  if (coupon.perUserLimit !== null && coupon.usages.length >= coupon.perUserLimit) return null;
  if (subtotalPaise < coupon.minOrderPaise) return null;

  let discountPaise: number;
  if (isDiscountType(coupon.discountType) && coupon.discountType === "PERCENT") {
    discountPaise = Math.round((subtotalPaise * coupon.value) / 100);
    if (coupon.maxDiscountPaise !== null) {
      discountPaise = Math.min(discountPaise, coupon.maxDiscountPaise);
    }
  } else {
    discountPaise = coupon.value;
  }

  discountPaise = Math.min(discountPaise, subtotalPaise);
  if (discountPaise <= 0) return null;

  const label =
    coupon.discountType === "PERCENT"
      ? `${coupon.value}% off${coupon.maxDiscountPaise ? ` (up to ₹${(coupon.maxDiscountPaise / 100).toFixed(0)})` : ""}`
      : `₹${(coupon.value / 100).toFixed(0)} off`;

  return { code: coupon.code, description: coupon.description, discountPaise, label };
}

// ── Mutations ────────────────────────────────────────────────────────────────

export type AddToCartResult =
  | { ok: true; itemCount: number; lineTotalPaise: number }
  | { ok: false; error: string; code: "OUT_OF_STOCK" | "NOT_FOUND" | "MAX_QUANTITY" | "UNPUBLISHED" };

export async function addToCart(input: {
  userId: string | null;
  productId: string;
  variantId: string | null;
  quantity: number;
}): Promise<AddToCartResult> {
  const quantity = Math.max(1, Math.min(10, Math.floor(input.quantity)));
  const token = input.userId ? null : await ensureCartSessionToken();
  const cart = await loadCartRow(input.userId, token);
  if (!cart) return { ok: false, error: "Could not start a cart.", code: "NOT_FOUND" };

  const product = await prisma.product.findFirst({
    where: { id: input.productId, isPublished: true },
    select: { id: true, basePricePaise: true, isPublished: true },
  });
  if (!product) {
    return { ok: false, error: "This product is no longer available.", code: "UNPUBLISHED" };
  }

  let unitPricePaise = product.basePricePaise;
  let availableQuantity = 0;

  if (input.variantId) {
    const variant = await prisma.productVariant.findFirst({
      where: { id: input.variantId, productId: product.id, isActive: true },
      select: {
        id: true,
        pricePaise: true,
        inventory: { select: { quantity: true, reserved: true } },
      },
    });
    if (!variant) {
      return { ok: false, error: "That size is not available.", code: "NOT_FOUND" };
    }
    unitPricePaise = variant.pricePaise;
    availableQuantity = Math.max(0, (variant.inventory?.quantity ?? 0) - (variant.inventory?.reserved ?? 0));
  } else {
    // No variant selected: the product must be a one-size item.
    const variants = await prisma.productVariant.findMany({
      where: { productId: product.id, isActive: true },
      select: { pricePaise: true, inventory: { select: { quantity: true, reserved: true } } },
    });
    if (variants.length === 0) {
      return { ok: false, error: "This product has no purchasable sizes yet.", code: "NOT_FOUND" };
    }
    unitPricePaise = Math.min(...variants.map((variant) => variant.pricePaise));
    availableQuantity = variants.reduce(
      (sum, variant) => sum + Math.max(0, (variant.inventory?.quantity ?? 0) - (variant.inventory?.reserved ?? 0)),
      0,
    );
  }

  if (availableQuantity <= 0) {
    return { ok: false, error: "This option is out of stock.", code: "OUT_OF_STOCK" };
  }

  const existing = await prisma.cartItem.findFirst({
    where: { cartId: cart.id, productId: product.id, variantId: input.variantId },
    select: { id: true, quantity: true },
  });

  const desired = (existing?.quantity ?? 0) + quantity;
  const capped = Math.min(desired, availableQuantity, 10);

  if (capped <= (existing?.quantity ?? 0)) {
    return {
      ok: false,
      error: `Only ${availableQuantity} left in stock.`,
      code: "MAX_QUANTITY",
    };
  }

  if (existing) {
    await prisma.cartItem.update({
      where: { id: existing.id },
      data: { quantity: capped, unitPricePaise, savedAt: null },
    });
  } else {
    await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        productId: product.id,
        variantId: input.variantId,
        unitPricePaise,
        quantity: capped,
      },
    });
  }

  await touchCart(cart.id);

  const cart2 = await getCart(input.userId);
  return {
    ok: true,
    itemCount: cart2.totals.itemCount,
    lineTotalPaise: unitPricePaise * capped,
  };
}

export async function updateCartItemQuantity(
  userId: string | null,
  itemId: string,
  quantity: number,
): Promise<{ ok: boolean; error?: string }> {
  const cart = await getCartRowFor(userId);
  if (!cart) return { ok: false, error: "Cart not found." };

  const item = await prisma.cartItem.findFirst({
    where: { id: itemId, cartId: cart.id },
    select: {
      id: true,
      quantity: true,
      variant: {
        select: { inventory: { select: { quantity: true, reserved: true } } },
      },
    },
  });
  if (!item) return { ok: false, error: "That item is no longer in your cart." };

  if (quantity <= 0) {
    await prisma.cartItem.delete({ where: { id: item.id } });
    await touchCart(cart.id);
    return { ok: true };
  }

  const available = item.variant
    ? Math.max(0, (item.variant.inventory?.quantity ?? 0) - (item.variant.inventory?.reserved ?? 0))
    : 10;
  const capped = Math.min(quantity, Math.max(1, available), 10);

  await prisma.cartItem.update({ where: { id: item.id }, data: { quantity: capped } });
  await touchCart(cart.id);
  return { ok: true };
}

export async function removeCartItem(userId: string | null, itemId: string): Promise<{ ok: boolean }> {
  const cart = await getCartRowFor(userId);
  if (!cart) return { ok: false };
  await prisma.cartItem.deleteMany({ where: { id: itemId, cartId: cart.id } });
  if (cart) await touchCart(cart.id);
  return { ok: true };
}

export async function setCartItemSaved(
  userId: string | null,
  itemId: string,
  saved: boolean,
): Promise<{ ok: boolean }> {
  const cart = await getCartRowFor(userId);
  if (!cart) return { ok: false };
  await prisma.cartItem.updateMany({
    where: { id: itemId, cartId: cart.id },
    data: { savedAt: saved ? new Date() : null },
  });
  if (cart) await touchCart(cart.id);
  return { ok: true };
}

export async function moveSavedItemToCart(
  userId: string | null,
  itemId: string,
): Promise<{ ok: boolean; error?: string }> {
  const cart = await getCartRowFor(userId);
  if (!cart) return { ok: false, error: "Cart not found." };

  const item = await prisma.cartItem.findFirst({
    where: { id: itemId, cartId: cart.id },
    select: { id: true, productId: true, variantId: true, quantity: true },
  });
  if (!item) return { ok: false, error: "That item is no longer saved." };

  await prisma.cartItem.delete({ where: { id: item.id } });
  const result = await addToCart({
    userId,
    productId: item.productId,
    variantId: item.variantId,
    quantity: item.quantity,
  });
  return result.ok ? { ok: true } : { ok: false, error: result.error };
}

export async function applyCoupon(
  userId: string | null,
  code: string,
): Promise<{ ok: boolean; error?: string; label?: string; discountPaise?: number }> {
  const cart = await getCartRowFor(userId);
  if (!cart) return { ok: false, error: "Cart not found." };

  const items = await prisma.cartItem.findMany({
    where: { cartId: cart.id, savedAt: null },
    select: { quantity: true, variant: { select: { pricePaise: true } } },
  });
  const subtotal = items.reduce(
    (sum, item) => sum + (item.variant?.pricePaise ?? 0) * item.quantity,
    0,
  );

  const resolved = await resolveCoupon(code, subtotal, userId);
  if (!resolved) {
    await prisma.cart.update({ where: { id: cart.id }, data: { couponCode: null } });
    return {
      ok: false,
      error: "That code is not valid on this order. Check the minimum spend and expiry.",
    };
  }

  await prisma.cart.update({ where: { id: cart.id }, data: { couponCode: resolved.code } });
  return {
    ok: true,
    label: resolved.label,
    discountPaise: resolved.discountPaise,
  };
}

export async function removeCoupon(userId: string | null): Promise<void> {
  const cart = await getCartRowFor(userId);
  if (cart) await prisma.cart.update({ where: { id: cart.id }, data: { couponCode: null } });
}

export async function clearCart(userId: string | null): Promise<void> {
  const cart = await getCartRowFor(userId);
  if (cart) await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
}

async function getCartRowFor(userId: string | null): Promise<CartRow | null> {
  const sessionToken = userId ? null : await getCartSessionToken();
  if (!userId && !sessionToken) return null;
  return loadCartRow(userId, sessionToken);
}

async function touchCart(cartId: string): Promise<void> {
  await prisma.cart.update({ where: { id: cartId }, data: { updatedAt: new Date() } });
}

/**
 * Moves a guest cart onto the user's account after sign-in so the basket
 * survives logging in. Called once per session creation.
 */
export async function mergeGuestCartIntoUser(userId: string): Promise<void> {
  const sessionToken = await getCartSessionToken();
  if (!sessionToken) return;

  const guestCart = await prisma.cart.findUnique({
    where: { sessionToken },
    include: { items: true },
  });
  if (!guestCart) return;

  const userCart = await loadCartRow(userId, null);
  if (!userCart) return;

  for (const item of guestCart.items) {
    const existing = await prisma.cartItem.findFirst({
      where: { cartId: userCart.id, productId: item.productId, variantId: item.variantId },
      select: { id: true, quantity: true },
    });

    if (existing) {
      await prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: Math.min(10, existing.quantity + item.quantity) },
      });
    } else {
      await prisma.cartItem.create({
        data: {
          cartId: userCart.id,
          productId: item.productId,
          variantId: item.variantId,
          unitPricePaise: item.unitPricePaise,
          quantity: Math.min(10, item.quantity),
          savedAt: item.savedAt,
        },
      });
    }
  }

  // Keep the coupon only if it still applies to the merged subtotal.
  const merged = await prisma.cartItem.findMany({
    where: { cartId: userCart.id, savedAt: null },
    select: { quantity: true, variant: { select: { pricePaise: true } } },
  });
  const mergedSubtotal = merged.reduce(
    (sum, item) => sum + (item.variant?.pricePaise ?? 0) * item.quantity,
    0,
  );

  let mergedCouponCode: string | null = null;
  if (guestCart.couponCode) {
    const resolved = await resolveCoupon(guestCart.couponCode, mergedSubtotal, userId);
    mergedCouponCode = resolved?.code ?? null;
  }

  await prisma.cart.update({
    where: { id: userCart.id },
    data: { couponCode: mergedCouponCode },
  });

  await prisma.cart.delete({ where: { id: guestCart.id } });
  await clearCartSessionToken();
}
