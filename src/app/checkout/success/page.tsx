import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BadgeCheck, Banknote } from "lucide-react";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { ROUTES } from "@/lib/routes";
import { formatDate, formatMoney } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Order confirmed",
  robots: { index: false, follow: false },
};

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  const user = await getCurrentUser();
  const { order: orderId } = await searchParams;

  const order = orderId
    ? await prisma.order.findFirst({
        where: { id: orderId, ...(user ? { userId: user.id } : { id: "__none__" }) },
        include: { items: { select: { id: true, nameSnapshot: true, quantity: true } } },
      })
    : null;

  if (!order) {
    return (
      <div className="container-page py-16 sm:py-20">
        <div className="mx-auto flex max-w-xl flex-col items-center gap-4 text-center">
          <h1 className="font-display text-3xl font-extrabold tracking-[-0.02em] text-bone-50">
            We could not find that order
          </h1>
          <p className="text-sm leading-relaxed text-ink-300">
            The confirmation link looks wrong. Signed-in riders can find every order under Account.
          </p>
          <Link
            href={ROUTES.account.orders}
            className="mt-2 inline-flex h-11 items-center gap-2 bg-flame-500 px-6 text-2xs font-bold uppercase tracking-[0.1em] text-ink-950 transition-colors hover:bg-flame-400"
          >
            View my orders
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container-page py-12 sm:py-16">
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-4 text-center">
        <span aria-hidden="true" className="inline-flex h-14 w-14 items-center justify-center border border-success-500/40 bg-success-500/10 text-success-400">
          <BadgeCheck className="h-7 w-7" />
        </span>
        <p className="label-caps text-flame-500">Order placed</p>
        <h1 className="font-display text-3xl font-extrabold tracking-[-0.02em] text-bone-50 sm:text-4xl">
          Thank you — {order.orderNumber} is confirmed
        </h1>
        <p className="max-w-lg text-sm leading-relaxed text-ink-300">
          Placed {formatDate(order.placedAt)} · {order.items.length} item{order.items.length === 1 ? "" : "s"} ·{" "}
          <span className="font-bold text-bone-50 tabular-nums">{formatMoney(order.totalPaise)}</span>
        </p>

        <p className="flex max-w-lg items-start gap-2 border border-ink-800 bg-ink-900/50 px-4 py-3.5 text-left text-sm leading-relaxed text-ink-200">
          <Banknote className="h-4 w-4 shrink-0 text-flame-500" aria-hidden="true" />
          Pay on delivery — keep cash or UPI ready when your gear arrives. Our team may call to confirm your address before dispatch.
        </p>

        <div className="mt-2 flex flex-wrap justify-center gap-3">
          <Link
            href={ROUTES.account.order(order.id)}
            className="inline-flex h-11 items-center gap-2 bg-flame-500 px-6 text-2xs font-bold uppercase tracking-[0.1em] text-ink-950 transition-colors hover:bg-flame-400"
          >
            Track this order
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
          <Link
            href={ROUTES.shop}
            className="inline-flex h-11 items-center border border-ink-600 px-6 text-2xs font-bold uppercase tracking-[0.1em] text-bone-50 transition-colors hover:border-ink-400 hover:bg-ink-800"
          >
            Keep shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
