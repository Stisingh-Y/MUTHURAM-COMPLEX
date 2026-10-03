"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { getCart, resolveCoupon } from "@/lib/data/cart";
import {
  FREE_SHIPPING_THRESHOLD_PAISE,
  SHIPPING_METHODS,
  isShippingMethod,
} from "@/lib/enums";
import { ROUTES } from "@/lib/routes";

/**
 * Order placement.
 *
 * No online payment is integrated yet, so this deliberately records a
 * pay-on-delivery order rather than a fake "payment success": the order row,
 * item snapshots, stock decrement, coupon usage and timeline event are all
 * real database writes inside one transaction. Prices are re-read from the
 * catalogue — the client only chooses an address and a shipping method.
 */

export type CheckoutActionState = {
  status: "idle" | "error";
  message?: string;
};

const checkoutSchema = z.object({
  addressId: z.string().trim().min(1, "Choose a delivery address."),
  shippingMethod: z.string().trim().min(1),
  notes: z.string().trim().max(500).optional(),
});

function orderNumber(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let suffix = "";
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  for (const byte of bytes) suffix += alphabet[byte % alphabet.length];
  return `MC-${new Date().getFullYear()}-${suffix}`;
}

export async function placeOrderAction(
  _prev: CheckoutActionState,
  formData: FormData,
): Promise<CheckoutActionState> {
  const user = await requireUser();

  const parsed = checkoutSchema.safeParse({
    addressId: formData.get("addressId"),
    shippingMethod: formData.get("shippingMethod"),
    notes: formData.get("notes") || undefined,
  });

  if (!parsed.success || !isShippingMethod(parsed.data.shippingMethod)) {
    return { status: "error", message: "Choose a delivery address and shipping method." };
  }

  const address = await prisma.address.findFirst({
    where: { id: parsed.data.addressId, userId: user.id },
  });
  if (!address) {
    return { status: "error", message: "That address does not belong to this account." };
  }

  const cart = await getCart(user.id);
  const lines = cart.lines;
  if (lines.length === 0) {
    return { status: "error", message: "Your cart is empty — add some gear first." };
  }
  if (cart.hasUnavailableLines) {
    return {
      status: "error",
      message: "A size in your cart just sold out. Remove it or save it for later, then try again.",
    };
  }

  const method = SHIPPING_METHODS.find((entry) => entry.value === parsed.data.shippingMethod)!;

  try {
    const orderId = await prisma.$transaction(async (tx) => {
      // Re-price every line from the catalogue inside the transaction and lock
      // stock by decrementing — a concurrent checkout that exhausts inventory
      // fails here instead of overselling.
      let subtotal = 0;
      const items: {
        productId: string;
        variantId: string | null;
        name: string;
        slug: string;
        sku: string;
        image: string | null;
        variantLabel: string | null;
        unitPrice: number;
        quantity: number;
      }[] = [];

      for (const line of lines) {
        const variant = line.variantId
          ? await tx.productVariant.findUnique({
              where: { id: line.variantId },
              include: { inventory: true },
            })
          : null;

        let unitPrice = line.unitPricePaise;
        let available = line.availableQuantity;

        if (variant) {
          if (!variant.isActive) throw new Error(`SOLD_OUT:${line.name}`);
          unitPrice = variant.pricePaise;
          available = Math.max(0, (variant.inventory?.quantity ?? 0) - (variant.inventory?.reserved ?? 0));
          if (available < line.quantity) throw new Error(`SOLD_OUT:${line.name}`);
          await tx.inventoryItem.update({
            where: { variantId: variant.id },
            data: { quantity: { decrement: line.quantity } },
          });
        } else {
          // Single-variant products still move through inventory rows.
          const rows = await tx.inventoryItem.findMany({
            where: { productId: line.productId },
            select: { quantity: true, reserved: true, variantId: true },
          });
          const total = rows.reduce((sum, row) => sum + Math.max(0, row.quantity - row.reserved), 0);
          if (total < line.quantity) throw new Error(`SOLD_OUT:${line.name}`);
          let remaining = line.quantity;
          for (const row of rows) {
            if (remaining <= 0) break;
            const free = Math.max(0, row.quantity - row.reserved);
            const take = Math.min(free, remaining);
            if (take > 0) {
              await tx.inventoryItem.update({
                where: { variantId: row.variantId },
                data: { quantity: { decrement: take } },
              });
              remaining -= take;
            }
          }
        }

        subtotal += unitPrice * line.quantity;
        items.push({
          productId: line.productId,
          variantId: line.variantId,
          name: line.name,
          slug: line.slug,
          sku: line.sku,
          image: line.image.url,
          variantLabel: line.variantLabel,
          unitPrice,
          quantity: line.quantity,
        });
      }

      // Re-validate the coupon against the fresh subtotal — it may have
      // expired or hit its limit since it was applied.
      let discount = 0;
      let couponCode: string | null = null;
      const cartRow = await tx.cart.findUnique({ where: { userId: user.id }, select: { couponCode: true } });
      if (cartRow?.couponCode) {
        const coupon = await resolveCoupon(cartRow.couponCode, subtotal, user.id);
        if (coupon) {
          discount = Math.min(coupon.discountPaise, subtotal);
          couponCode = coupon.code;
        }
      }

      const merchandise = subtotal - discount;
      const shipping =
        parsed.data.shippingMethod === "EXPRESS"
          ? method.pricePaise
          : merchandise >= FREE_SHIPPING_THRESHOLD_PAISE
            ? 0
            : method.pricePaise;
      const total = merchandise + shipping;

      const shippingSnapshot = {
        fullName: address.fullName,
        phone: address.phone,
        line1: address.line1,
        line2: address.line2,
        landmark: address.landmark,
        city: address.city,
        state: address.state,
        pincode: address.pincode,
        country: address.country,
      };

      let createdId: string | null = null;
      for (let attempt = 0; attempt < 3 && !createdId; attempt += 1) {
        try {
          const order = await tx.order.create({
            data: {
              orderNumber: orderNumber(),
              userId: user.id,
              email: user.email,
              status: "PENDING",
              paymentStatus: "PENDING",
              subtotalPaise: subtotal,
              discountPaise: discount,
              shippingPaise: shipping,
              taxPaise: 0,
              totalPaise: total,
              couponCode,
              shippingMethod: parsed.data.shippingMethod,
              shippingAddressJson: JSON.stringify(shippingSnapshot),
              notes: parsed.data.notes || null,
              items: {
                create: items.map((item) => ({
                  productId: item.productId,
                  variantId: item.variantId,
                  nameSnapshot: item.name,
                  slugSnapshot: item.slug,
                  skuSnapshot: item.sku,
                  imageSnapshot: item.image,
                  variantSnapshot: item.variantLabel,
                  unitPricePaise: item.unitPrice,
                  quantity: item.quantity,
                  totalPaise: item.unitPrice * item.quantity,
                })),
              },
              events: { create: [{ status: "PENDING", note: "Order placed — pay on delivery." }] },
            },
            select: { id: true },
          });
          createdId = order.id;
        } catch (error) {
          // Order numbers are random; a collision just means retry.
          if (attempt === 2) throw error;
        }
      }

      if (couponCode) {
        const coupon = await tx.coupon.findUnique({ where: { code: couponCode }, select: { id: true } });
        if (coupon) {
          await tx.couponUsage.create({
            data: { couponId: coupon.id, userId: user.id, orderId: createdId, amountPaise: discount },
          });
          await tx.coupon.update({ where: { id: coupon.id }, data: { usedCount: { increment: 1 } } });
        }
      }

      // Empty the basket but keep saved-for-later lines.
      await tx.cartItem.deleteMany({
        where: { cart: { userId: user.id }, savedAt: null },
      });
      await tx.cart.update({ where: { userId: user.id }, data: { couponCode: null } });

      return createdId as string;
    });

    redirect(`${ROUTES.checkout.success}?order=${orderId}`);
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("SOLD_OUT:")) {
      const name = error.message.slice("SOLD_OUT:".length);
      return { status: "error", message: `“${name}” just sold out. Remove it and try again.` };
    }
    // Next.js redirects surface as thrown errors — let them through.
    throw error;
  }
}
