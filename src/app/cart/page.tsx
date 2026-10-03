import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ShieldCheck, ShoppingBag, Truck } from "lucide-react";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { CartLine, SavedLine } from "@/components/cart/cart-line";
import { getCurrentUser } from "@/lib/auth/session";
import { getCart } from "@/lib/data/cart";
import { ROUTES } from "@/lib/routes";
import { formatMoney } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Your cart",
  description: "Review your riding gear before checkout.",
  alternates: { canonical: ROUTES.cart },
};

export default async function CartPage() {
  const user = await getCurrentUser();
  const cart = await getCart(user?.id ?? null);

  return (
    <div className="container-page py-8 sm:py-10">
      <Breadcrumbs
        className="mb-6"
        items={[{ label: "Home", href: ROUTES.home }, { label: "Cart" }]}
      />

      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-ink-800 pb-5">
        <div>
          <p className="label-caps text-flame-500">Your basket</p>
          <h1 className="mt-1 font-display text-3xl font-extrabold tracking-[-0.02em] text-bone-50 sm:text-4xl">
            Cart
          </h1>
        </div>
        {cart.totals.itemCount > 0 ? (
          <p className="text-sm text-ink-400 tabular-nums">
            {cart.totals.itemCount} item{cart.totals.itemCount === 1 ? "" : "s"}
          </p>
        ) : null}
      </div>

      {cart.lines.length === 0 && cart.savedLines.length === 0 ? (
        <div className="mx-auto flex max-w-xl flex-col items-center gap-4 py-16 text-center sm:py-20">
          <span aria-hidden="true" className="inline-flex h-14 w-14 items-center justify-center border border-ink-750 bg-ink-900 text-flame-500">
            <ShoppingBag className="h-6 w-6" />
          </span>
          <h2 className="font-display text-2xl font-extrabold tracking-[-0.01em] text-bone-50">
            Your cart is empty
          </h2>
          <p className="text-sm leading-relaxed text-ink-300">
            Good gear is the difference between a story and a scar. Start with a
            certified helmet or a jacket you will actually wear every ride.
          </p>
          <div className="mt-2 flex flex-wrap justify-center gap-3">
            <Link
              href={ROUTES.shop}
              className="inline-flex h-11 items-center gap-2 bg-flame-500 px-6 text-2xs font-bold uppercase tracking-[0.1em] text-ink-950 transition-colors hover:bg-flame-400"
            >
              Shop riding gear
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link
              href={ROUTES.category("helmets")}
              className="inline-flex h-11 items-center border border-ink-600 px-6 text-2xs font-bold uppercase tracking-[0.1em] text-bone-50 transition-colors hover:border-ink-400 hover:bg-ink-800"
            >
              Browse helmets
            </Link>
          </div>
        </div>
      ) : (
        <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_24rem] lg:gap-12">
          <div className="flex min-w-0 flex-col gap-8">
            {cart.lines.length > 0 ? (
              <section aria-label="Items in your cart">
                <ul className="flex flex-col gap-4">
                  {cart.lines.map((line) => (
                    <CartLine key={line.id} line={line} />
                  ))}
                </ul>
              </section>
            ) : null}

            {cart.savedLines.length > 0 ? (
              <section aria-label="Saved for later">
                <h2 className="label-caps mb-3 text-ink-400">
                  Saved for later ({cart.savedLines.length})
                </h2>
                <ul className="flex flex-col gap-3">
                  {cart.savedLines.map((line) => (
                    <SavedLine key={line.id} line={line} />
                  ))}
                </ul>
              </section>
            ) : null}

            <Link href={ROUTES.shop} className="w-fit text-2xs font-semibold uppercase tracking-[0.1em] text-ink-400 underline-offset-4 transition-colors hover:text-flame-300 hover:underline">
              ← Continue shopping
            </Link>
          </div>

          <aside className="lg:sticky lg:top-32 lg:self-start">
            <div className="border border-ink-850 bg-ink-900/50 p-6">
              <h2 className="font-display text-lg font-extrabold tracking-[-0.01em] text-bone-50">
                Order summary
              </h2>

              {!cart.totals.qualifiesForFreeShipping && cart.totals.amountToFreeShippingPaise > 0 ? (
                <div className="mt-4 border border-ink-800 bg-ink-950/60 p-3.5">
                  <p className="flex items-center gap-2 text-2xs text-ink-300">
                    <Truck className="h-4 w-4 shrink-0 text-flame-500" aria-hidden="true" />
                    Add {formatMoney(cart.totals.amountToFreeShippingPaise)} more for free shipping
                  </p>
                  <div className="mt-2 h-1 bg-ink-800" role="progressbar" aria-valuemin={0} aria-valuemax={cart.totals.freeShippingThresholdPaise} aria-valuenow={cart.totals.subtotalPaise} aria-label="Progress to free shipping">
                    <div
                      className="h-full bg-flame-500"
                      style={{ width: `${Math.min(100, (cart.totals.subtotalPaise / cart.totals.freeShippingThresholdPaise) * 100)}%` }}
                    />
                  </div>
                </div>
              ) : (
                <p className="mt-4 flex items-center gap-2 border border-success-500/30 bg-success-500/10 p-3.5 text-2xs font-semibold text-success-400">
                  <Truck className="h-4 w-4 shrink-0" aria-hidden="true" />
                  You have unlocked free shipping
                </p>
              )}

              <dl className="mt-5 flex flex-col gap-2.5 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-ink-400">Subtotal</dt>
                  <dd className="text-bone-50 tabular-nums">{formatMoney(cart.totals.subtotalPaise)}</dd>
                </div>
                {cart.coupon ? (
                  <div className="flex justify-between gap-3">
                    <dt className="text-ink-400">Coupon {cart.coupon.code}</dt>
                    <dd className="text-success-400 tabular-nums">−{formatMoney(cart.totals.discountPaise)}</dd>
                  </div>
                ) : null}
                <div className="flex justify-between gap-3">
                  <dt className="text-ink-400">Shipping</dt>
                  <dd className="text-bone-50 tabular-nums">
                    {cart.totals.shippingPaise === 0 ? "Free" : formatMoney(cart.totals.shippingPaise)}
                  </dd>
                </div>
                <div className="flex justify-between gap-3 border-t border-ink-800 pt-3">
                  <dt className="font-display text-base font-extrabold text-bone-50">Total</dt>
                  <dd className="font-display text-xl font-extrabold text-bone-50 tabular-nums">
                    {formatMoney(cart.totals.totalPaise)}
                  </dd>
                </div>
              </dl>
              <p className="mt-1 text-right text-2xs text-ink-500">Inclusive of all taxes</p>

              {cart.lines.length > 0 ? (
                <Link
                  href={ROUTES.checkout.start}
                  className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 bg-flame-500 text-2xs font-bold uppercase tracking-[0.12em] text-ink-950 transition-colors hover:bg-flame-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flame-500"
                >
                  Proceed to checkout
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              ) : null}

              <p className="mt-4 flex items-start gap-2 text-2xs leading-relaxed text-ink-500">
                <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-ink-400" aria-hidden="true" />
                Genuine CE-certified gear, secure checkout, and easy returns on unused items.
              </p>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
