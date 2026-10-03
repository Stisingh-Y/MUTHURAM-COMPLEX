"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Check, Heart, Minus, Plus, ShieldCheck, ShoppingBag, Truck } from "lucide-react";
import { addToCartAction, type CartActionState } from "@/app/actions/cart";
import { ROUTES } from "@/lib/routes";
import { cn, formatMoney } from "@/lib/utils";
import type { ProductDetailView, ProductVariantView } from "@/lib/data/products";
import { FormMessage } from "@/components/ui/form-message";

/**
 * Buy box.
 *
 * Size and colour are two separate axes, so the picker resolves
 * (size, colour) → variant and drives availability from there: choosing a size
 * disables the colours that are sold out in it, and vice versa. That is what
 * stops a rider from discovering a dead end only after clicking Add to cart.
 *
 * When a product has exactly one variant the picker is hidden and that variant
 * is submitted automatically — a "Size: One Size" button is noise.
 *
 * The variant id travels in a hidden input, so the form degrades to a plain POST
 * without JavaScript; only the interactivity above is client-side.
 */
/**
 * Declared here rather than imported: a `"use server"` module may only export
 * async functions, so the idle seed cannot live next to `addToCartAction`.
 */
const IDLE_CART_STATE: CartActionState = { status: "idle" };

export function AddToCartForm({
  product,
  freeShippingPaise,
}: {
  product: ProductDetailView;
  freeShippingPaise: number;
}) {
  const [state, formAction, pending] = useActionState(addToCartAction, IDLE_CART_STATE);

  const sizes = unique(product.variants.map((variant) => variant.size));
  const colors = unique(product.variants.map((variant) => variant.color));
  const singleVariant = product.variants.length === 1;

  const [size, setSize] = useState<string>(sizes[0] ?? "");
  const [color, setColor] = useState<string>(colors[0] ?? "");
  const [quantity, setQuantity] = useState(1);

  const selected = findVariant(product.variants, size, color);
  const soldOut = !singleVariant && product.variants.length > 0 && !selected;
  const variant = selected ?? product.variants.find((entry) => entry.isAvailable) ?? null;
  const maxQuantity = Math.min(10, Math.max(1, variant?.availableQuantity ?? 1));
  const soldOutEverything = product.variants.length > 0 && product.variants.every((entry) => !entry.isAvailable);

  const pricePaise = variant?.pricePaise ?? product.pricePaise;
  const compareAtPaise = variant?.compareAtPricePaise ?? product.compareAtPricePaise;

  /** A colour is offered in a size when some variant pairs them. */
  const colorAvailableInSize = (candidate: string): boolean =>
    product.variants.some(
      (entry) => entry.color === candidate && entry.size === size && entry.isAvailable,
    );

  const sizeAvailableInColor = (candidate: string): boolean =>
    product.variants.some(
      (entry) => entry.size === candidate && entry.color === color && entry.isAvailable,
    );

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <input type="hidden" name="productId" value={product.id} />
      <input type="hidden" name="variantId" value={variant?.id ?? ""} />
      <input type="hidden" name="quantity" value={quantity} />

      {product.variants.length === 0 || singleVariant ? null : (
        <>
          <fieldset className="flex flex-col gap-3">
            <legend className="label-caps text-bone-50">
              Size
              <span className="ml-2 font-normal tracking-normal text-ink-500 normal-case">
                {sizes.length} available
              </span>
            </legend>

            <div className="flex flex-wrap gap-2">
              {sizes.map((entry) => {
                const isSelected = entry === size;
                const available = sizeAvailableInColor(entry);

                return (
                  <label
                    key={entry}
                    className={cn(
                      "cursor-pointer rounded-sm border px-4 py-2.5 text-sm font-semibold transition-colors duration-200",
                      "focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-flame-500",
                      !available && "cursor-not-allowed opacity-40",
                      isSelected && available
                        ? "border-flame-500 bg-flame-500/12 text-flame-300"
                        : "border-ink-700 text-ink-200 hover:border-ink-600 hover:text-bone-50",
                    )}
                  >
                    <input
                      type="radio"
                      name="size"
                      value={entry}
                      checked={isSelected}
                      disabled={!available}
                      onChange={() => {
                        setSize(entry);
                        setQuantity(1);
                        // Keep the colour only if this size actually stocks it.
                        if (!colorAvailableInSize(color)) setColor(colors[0] ?? "");
                      }}
                      className="sr-only"
                    />
                    {entry}
                  </label>
                );
              })}
            </div>
          </fieldset>

          <fieldset className="flex flex-col gap-3">
            <legend className="label-caps text-bone-50">Colour</legend>

            <div className="flex flex-wrap gap-2">
              {colors.map((entry) => {
                const isSelected = entry === color;
                const available = colorAvailableInSize(entry);
                const hex = product.colorOptions.find((option) => option.name === entry)?.hex;

                return (
                  <label
                    key={entry}
                    className={cn(
                      "inline-flex cursor-pointer items-center gap-2 rounded-sm border px-3 py-2 text-sm transition-colors duration-200",
                      "focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-flame-500",
                      !available && "cursor-not-allowed opacity-40",
                      isSelected && available
                        ? "border-flame-500 bg-flame-500/12 text-bone-50"
                        : "border-ink-700 text-ink-200 hover:border-ink-600",
                    )}
                  >
                    <input
                      type="radio"
                      name="color"
                      value={entry}
                      checked={isSelected}
                      disabled={!available}
                      onChange={() => setColor(entry)}
                      className="sr-only"
                    />
                    {hex ? (
                      <span
                        aria-hidden="true"
                        className="h-4 w-4 rounded-full border border-ink-600"
                        style={{ backgroundColor: hex }}
                      />
                    ) : null}
                    {entry}
                  </label>
                );
              })}
            </div>
          </fieldset>
        </>
      )}

      {variant ? (
        <div className="flex flex-col gap-1">
          {/* Larger sizes can carry a premium, so the price of the chosen variant
              is authoritative and shown here whenever it differs from the
              headline price. */}
          {pricePaise !== product.pricePaise ? (
            <p className="flex flex-wrap items-baseline gap-2">
              <span className="font-display text-2xl font-extrabold text-bone-50 tabular-nums">
                {formatMoney(pricePaise)}
              </span>
              {compareAtPaise && compareAtPaise > pricePaise ? (
                <span className="text-sm text-ink-500 line-through tabular-nums">
                  {formatMoney(compareAtPaise)}
                </span>
              ) : null}
              <span className="text-2xs text-ink-500">for this size</span>
            </p>
          ) : null}

          <p className="flex flex-wrap items-center gap-2 text-2xs text-ink-400">
            <span className="font-mono text-ink-500">SKU {variant.sku}</span>
            {variant.availableQuantity > 0 && variant.availableQuantity <= 3 ? (
              <span className="font-semibold text-flame-400">
                only {variant.availableQuantity} left in this size
              </span>
            ) : null}
          </p>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex h-14 items-center rounded-sm border border-ink-700 bg-ink-900">
          <button
            type="button"
            onClick={() => setQuantity((current) => Math.max(1, current - 1))}
            disabled={quantity <= 1 || pending}
            className="inline-flex h-full w-12 items-center justify-center text-ink-300 transition-colors hover:text-bone-50 disabled:opacity-35 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-flame-500"
          >
            <Minus className="h-4 w-4" aria-hidden="true" />
            <span className="sr-only">Decrease quantity</span>
          </button>

          <output
            aria-live="polite"
            aria-label="Quantity"
            className="min-w-10 text-center text-sm font-semibold text-bone-50 tabular-nums"
          >
            {quantity}
          </output>

          <button
            type="button"
            onClick={() => setQuantity((current) => Math.min(maxQuantity, current + 1))}
            disabled={quantity >= maxQuantity || pending}
            className="inline-flex h-full w-12 items-center justify-center text-ink-300 transition-colors hover:text-bone-50 disabled:opacity-35 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-flame-500"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            <span className="sr-only">Increase quantity</span>
          </button>
        </div>

        <button
          type="submit"
          disabled={pending || soldOut || soldOutEverything}
          className="inline-flex h-14 flex-1 items-center justify-center gap-2 rounded-sm bg-flame-500 px-8 text-2xs font-bold tracking-[0.1em] text-ink-950 uppercase transition-colors duration-200 hover:bg-flame-400 active:translate-y-px disabled:cursor-not-allowed disabled:bg-ink-800 disabled:text-ink-500 sm:flex-none"
        >
          {pending ? (
            "Adding…"
          ) : soldOutEverything ? (
            "Out of stock"
          ) : (
            <>
              <ShoppingBag className="h-4 w-4" aria-hidden="true" />
              Add to cart
            </>
          )}
        </button>

        <Link
          href={ROUTES.wishlist}
          className="inline-flex h-14 w-14 items-center justify-center rounded-sm border border-ink-700 text-ink-300 transition-colors duration-200 hover:border-ink-600 hover:text-bone-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flame-500"
        >
          <Heart className="h-4 w-4" aria-hidden="true" />
          <span className="sr-only">Save to wishlist</span>
        </Link>
      </div>

      {soldOut ? (
        <p
          role="status"
          className="rounded-xs border border-flame-500/35 bg-flame-500/8 px-3.5 py-2.5 text-2xs leading-relaxed text-flame-300"
        >
          That size and colour combination has sold out. Try another colour, or call the shop and we
          will tell you when the next batch lands.
        </p>
      ) : null}

      {state.status === "error" ? (
        <FormMessage status="error" message={state.message} />
      ) : null}

      {state.status === "success" ? (
        <p
          role="status"
          className="flex flex-wrap items-center gap-x-2 rounded-xs border border-success-500/35 bg-success-500/8 px-3.5 py-2.5 text-2xs text-success-400"
        >
          <span className="inline-flex items-center gap-1.5">
            <Check className="h-3.5 w-3.5" aria-hidden="true" />
            {state.message}
          </span>
          <Link
            href={ROUTES.cart}
            className="font-semibold text-bone-50 underline underline-offset-4 hover:text-flame-300"
          >
            View cart
          </Link>
        </p>
      ) : null}

      <ul className="flex flex-col gap-2.5 border-t border-ink-850 pt-5">
        <Assurance
          icon={<Truck className="h-4 w-4" aria-hidden="true" />}
          title={`Free shipping over ${formatMoney(freeShippingPaise)}`}
          detail="Flat rate below that, the same for a helmet and a full kit."
        />
        <Assurance
          icon={<ShieldCheck className="h-4 w-4" aria-hidden="true" />}
          title={`${product.warrantyMonths}-month warranty`}
          detail={`${product.returnDays} days to return unused gear with tags on.`}
        />
      </ul>
    </form>
  );
}

function Assurance({
  icon,
  title,
  detail,
}: {
  icon: React.ReactNode;
  title: string;
  detail: string;
}) {
  return (
    <li className="flex items-start gap-3">
      <span aria-hidden="true" className="mt-0.5 text-flame-500">
        {icon}
      </span>
      <span className="flex flex-col">
        <span className="text-2xs font-semibold text-bone-100">{title}</span>
        <span className="text-2xs text-ink-500">{detail}</span>
      </span>
    </li>
  );
}


// ── Variant helpers ──────────────────────────────────────────────────────────

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

function findVariant(
  variants: ProductVariantView[],
  size: string,
  color: string,
): ProductVariantView | null {
  return (
    variants.find((variant) => variant.size === size && variant.color === color) ??
    // A single-variant product (one size, one colour) has no meaningful pair.
    (variants.length === 1 ? variants[0]! : null)
  );
}