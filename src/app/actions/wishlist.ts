"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { toggleWishlist } from "@/lib/data/wishlist";
import { getCurrentUser } from "@/lib/auth/session";

/**
 * Wishlist server action.
 *
 * Backs the wishlist control on the product card, so "save this" is a real
 * mutation rather than a decorative heart. Guests are supported by the same
 * cookie the data layer already writes, which is why no sign-in prompt appears
 * mid-interaction.
 *
 * The layout is revalidated because the header renders a live wishlist count,
 * and the product routes because a card's saved state lives on the server.
 * Returning a state object rather than throwing keeps the button usable as a
 * plain form post without JavaScript.
 */

export type WishlistActionState = {
  status: "idle" | "error" | "success";
  added?: boolean;
  count?: number;
  message?: string;
};

const toggleSchema = z.object({
  productId: z.string().trim().min(1),
});

export async function toggleWishlistAction(
  _prev: WishlistActionState,
  formData: FormData,
): Promise<WishlistActionState> {
  const parsed = toggleSchema.safeParse({ productId: formData.get("productId") });

  if (!parsed.success) {
    return { status: "error", message: "That item could not be identified." };
  }

  const user = await getCurrentUser();
  const result = await toggleWishlist(user?.id ?? null, parsed.data.productId);

  if (!result.ok) {
    return { status: "error", message: result.error ?? "Could not save that item." };
  }

  // Root layout, not just the wishlist route: the header renders a live saved
  // count, so the badge has to be recomputed wherever the rider is when they
  // tap the heart.
  revalidatePath("/", "layout");

  return {
    status: "success",
    added: result.added,
    count: result.count,
    message: result.added ? "Saved to your wishlist." : "Removed from your wishlist.",
  };
}
