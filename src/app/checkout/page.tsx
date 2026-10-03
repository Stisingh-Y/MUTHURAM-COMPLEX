import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { CheckoutClient } from "@/components/checkout/checkout-client";
import { getCurrentUser } from "@/lib/auth/session";
import { getCart } from "@/lib/data/cart";
import { prisma } from "@/lib/db";
import { ROUTES } from "@/lib/routes";
import { formatMoney } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Confirm your delivery address and place your order.",
  robots: { index: false, follow: false },
};

export default async function CheckoutPage() {
  const user = await getCurrentUser();
  if (!user) redirect(`${ROUTES.auth.login}?next=${encodeURIComponent(ROUTES.checkout.start)}`);

  const [cart, addresses] = await Promise.all([
    getCart(user.id),
    prisma.address.findMany({
      where: { userId: user.id },
      orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
    }),
  ]);

  return (
    <div className="container-page py-8 sm:py-10">
      <Breadcrumbs
        className="mb-6"
        items={[
          { label: "Home", href: ROUTES.home },
          { label: "Cart", href: ROUTES.cart },
          { label: "Checkout" },
        ]}
      />

      <p className="label-caps text-flame-500">Almost yours</p>
      <h1 className="mt-1 font-display text-3xl font-extrabold tracking-[-0.02em] text-bone-50 sm:text-4xl">
        Checkout
      </h1>

      {cart.lines.length === 0 ? (
        <div className="mx-auto flex max-w-xl flex-col items-center gap-4 py-16 text-center">
          <h2 className="font-display text-2xl font-extrabold text-bone-50">Nothing to check out</h2>
          <p className="text-sm text-ink-300">Your cart is empty — add some gear first.</p>
          <Link
            href={ROUTES.shop}
            className="mt-2 inline-flex h-11 items-center bg-flame-500 px-6 text-2xs font-bold uppercase tracking-[0.1em] text-ink-950 transition-colors hover:bg-flame-400"
          >
            Shop riding gear
          </Link>
        </div>
      ) : (
        <div className="mt-8 flex flex-col gap-8">
          <section aria-label="Order lines" className="border border-ink-850 bg-ink-900/50 px-5 py-4">
            <ul className="flex flex-col divide-y divide-ink-800">
              {cart.lines.map((line) => (
                <li key={line.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <span className="min-w-0 truncate text-ink-200">
                    <span className="font-semibold text-bone-50">{line.name}</span>
                    {line.variantLabel ? <span className="text-ink-500"> · {line.variantLabel}</span> : null}
                    <span className="text-ink-500 tabular-nums"> × {line.quantity}</span>
                  </span>
                  <span className="shrink-0 font-bold text-bone-50 tabular-nums">
                    {formatMoney(line.lineTotalPaise)}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <CheckoutClient
            addresses={addresses}
            subtotalPaise={cart.totals.subtotalPaise}
            discountPaise={cart.totals.discountPaise}
            couponCode={cart.coupon?.code ?? null}
            standardShippingPaise={cart.totals.shippingPaise}
          />
        </div>
      )}
    </div>
  );
}
