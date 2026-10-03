"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  addToCart as addToCartRecord,
  clearCartSessionToken,
  getCart,
  moveSavedItemToCart,
  removeCartItem,
  setCartItemSaved,
  updateCartItemQuantity,
} from "@/lib/data/cart";
import { getCurrentUser } from "@/lib/auth/session";
import { ROUTES } from "@/lib/routes";

/**
 * Cart server actions.
 *
 * Guests get a cart keyed by an httpOnly session cookie and signed-in riders get
 * one keyed by user id; `getCurrentUser` decides which, so a rider who signs in
 * mid-session does not silently lose the basket they filled.
 *
 * Every action revalidates the layout because the header renders a live item
 * count. Returning a state object rather than throwing keeps the product page
 * usable as a plain form post.
 */

export type CartActionState = {
  status: "idle" | "error" | "success";
  message?: string;
  itemCount?: number;
  code?: string;
};

const MAX_LINE_QUANTITY = 10;

const addSchema = z.object({
  productId: z.string().trim().min(1),
  variantId: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value && value !== "" ? value : null)),
  quantity: z.coerce.number().int().min(1).max(MAX_LINE_QUANTITY),
  redirectToCart: z
    .union([z.literal("on"), z.literal("off")])
    .optional()
    .transform((value) => value === "on"),
});

const itemSchema = z.object({ itemId: z.string().trim().min(1) });

const quantitySchema = itemSchema.extend({
  quantity: z.coerce.number().int().min(0).max(MAX_LINE_QUANTITY),
});

const MESSAGES: Record<string, string> = {
  OUT_OF_STOCK: "That size just sold out. Pick another and try again.",
  NOT_FOUND: "We could not find that item any more.",
  MAX_QUANTITY: `You can order up to ${MAX_LINE_QUANTITY} of one item per line. Call the shop for more.`,
  UNPUBLISHED: "That product is no longer available.",
};

/** Re-render the header count and the cart page. */
async function refreshCartViews(): Promise<number> {
  const user = await getCurrentUser();
  const cart = await getCart(user?.id ?? null);

  revalidatePath(ROUTES.cart, "layout");
  return cart.totals.itemCount;
}

export async function addToCartAction(
  _prev: CartActionState,
  formData: FormData,
): Promise<CartActionState> {
  const parsed = addSchema.safeParse({
    productId: formData.get("productId"),
    variantId: formData.get("variantId") ?? undefined,
    quantity: formData.get("quantity") ?? 1,
    redirectToCart: formData.get("redirectToCart") ?? undefined,
  });

  if (!parsed.success) {
    return { status: "error", message: "That does not look like a valid selection." };
  }

  const user = await getCurrentUser();
  const result = await addToCartRecord({
    userId: user?.id ?? null,
    productId: parsed.data.productId,
    variantId: parsed.data.variantId,
    quantity: parsed.data.quantity,
  });

  if (!result.ok) {
    return { status: "error", message: MESSAGES[result.code] ?? "Could not add that.", code: result.code };
  }

  const itemCount = await refreshCartViews();
  return { status: "success", message: "Added to cart.", itemCount };
}

export async function updateCartItemAction(
  _prev: CartActionState,
  formData: FormData,
): Promise<CartActionState> {
  const parsed = quantitySchema.safeParse({
    itemId: formData.get("itemId"),
    quantity: formData.get("quantity"),
  });

  if (!parsed.success) {
    return { status: "error", message: "That quantity is not valid." };
  }

  const user = await getCurrentUser();
  const result = await updateCartItemQuantity(user?.id ?? null, parsed.data.itemId, parsed.data.quantity);

  if (!result.ok) {
    return { status: "error", message: result.error ?? "Could not update that line." };
  }

  const itemCount = await refreshCartViews();
  return { status: "success", itemCount };
}

export async function removeCartItemAction(
  _prev: CartActionState,
  formData: FormData,
): Promise<CartActionState> {
  const parsed = itemSchema.safeParse({ itemId: formData.get("itemId") });

  if (!parsed.success) {
    return { status: "error", message: "That item could not be found." };
  }

  const user = await getCurrentUser();
  const result = await removeCartItem(user?.id ?? null, parsed.data.itemId);

  if (!result.ok) {
    return { status: "error", message: "Could not remove that line." };
  }

  const itemCount = await refreshCartViews();
  return { status: "success", message: "Removed.", itemCount };
}

export async function saveCartItemAction(
  _prev: CartActionState,
  formData: FormData,
): Promise<CartActionState> {
  const parsed = itemSchema.safeParse({ itemId: formData.get("itemId") });

  if (!parsed.success) {
    return { status: "error", message: "That item could not be found." };
  }

  const user = await getCurrentUser();
  await setCartItemSaved(user?.id ?? null, parsed.data.itemId, true);

  const itemCount = await refreshCartViews();
  return { status: "success", message: "Saved for later.", itemCount };
}

export async function moveSavedItemToCartAction(
  _prev: CartActionState,
  formData: FormData,
): Promise<CartActionState> {
  const parsed = itemSchema.safeParse({ itemId: formData.get("itemId") });

  if (!parsed.success) {
    return { status: "error", message: "That item could not be found." };
  }

  const user = await getCurrentUser();
  await moveSavedItemToCart(user?.id ?? null, parsed.data.itemId);

  const itemCount = await refreshCartViews();
  return { status: "success", message: "Moved to cart.", itemCount };
}

/**
 * Clear the guest cart cookie.
 *
 * Exposed for the cart page's "start over" control. Delegates to the data layer
 * so the cookie name lives in one place; a signed-in rider's basket is keyed by
 * user id and is deliberately untouched.
 */
export async function clearGuestCartCookie(): Promise<void> {
  await clearCartSessionToken();
}