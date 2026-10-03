import Link from "next/link";
import { ArrowRight, Heart, MapPin, Package } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { getCart } from "@/lib/data/cart";
import { getWishlistIds } from "@/lib/data/wishlist";
import { ORDER_STATUS_META } from "@/lib/enums";
import { ROUTES } from "@/lib/routes";
import { formatDate, formatMoney } from "@/lib/utils";

export default async function AccountOverviewPage() {
  const user = await requireUser();

  const [orderCount, recentOrders, addressCount, wishlistIds, cart] = await Promise.all([
    prisma.order.count({ where: { userId: user.id } }),
    prisma.order.findMany({
      where: { userId: user.id },
      orderBy: { placedAt: "desc" },
      take: 3,
      select: { id: true, orderNumber: true, status: true, totalPaise: true, placedAt: true, _count: { select: { items: true } } },
    }),
    prisma.address.count({ where: { userId: user.id } }),
    getWishlistIds(user.id),
    getCart(user.id),
  ]);

  const stats = [
    { label: "Orders placed", value: String(orderCount), href: ROUTES.account.orders, icon: Package },
    { label: "Wishlist", value: String(wishlistIds.length), href: ROUTES.account.wishlist, icon: Heart },
    { label: "Saved addresses", value: String(addressCount), href: ROUTES.account.addresses, icon: MapPin },
    { label: "In your cart", value: String(cart.totals.itemCount), href: ROUTES.cart, icon: Package },
  ];

  return (
    <div className="flex flex-col gap-8">
      <section aria-label="Account summary">
        <ul className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
          {stats.map((stat) => (
            <li key={stat.label}>
              <Link
                href={stat.href}
                className="flex h-full flex-col gap-1 border border-ink-850 bg-ink-900/50 p-4 transition-colors duration-200 hover:border-ink-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flame-500 sm:p-5"
              >
                <stat.icon className="h-4 w-4 text-flame-500" aria-hidden="true" />
                <span className="mt-2 font-display text-2xl font-extrabold text-bone-50 tabular-nums">
                  {stat.value}
                </span>
                <span className="label-caps text-ink-400">{stat.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section aria-label="Recent orders" className="border border-ink-850 bg-ink-900/50 p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-lg font-extrabold tracking-[-0.01em] text-bone-50">
            Recent orders
          </h2>
          <Link href={ROUTES.account.orders} className="inline-flex items-center gap-1 text-2xs font-semibold uppercase tracking-[0.1em] text-flame-400 transition-colors hover:text-flame-300">
            View all
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <p className="mt-3 text-sm text-ink-400">
            No orders yet. When you check out, everything lands here with live status.
          </p>
        ) : (
          <ul className="mt-4 flex flex-col divide-y divide-ink-800">
            {recentOrders.map((order) => (
              <li key={order.id}>
                <Link
                  href={ROUTES.account.order(order.id)}
                  className="flex items-center justify-between gap-3 py-3 transition-colors hover:text-bone-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flame-500"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-bone-50">
                      {order.orderNumber}
                    </span>
                    <span className="block text-2xs text-ink-500">
                      {formatDate(order.placedAt)} · {order._count.items} item{order._count.items === 1 ? "" : "s"}
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-3">
                    <span className="text-2xs font-semibold uppercase tracking-[0.08em] text-ink-300">
                      {ORDER_STATUS_META[order.status as keyof typeof ORDER_STATUS_META]?.label ?? order.status}
                    </span>
                    <span className="text-sm font-bold text-bone-50 tabular-nums">
                      {formatMoney(order.totalPaise)}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
