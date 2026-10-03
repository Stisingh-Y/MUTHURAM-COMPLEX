import Link from "next/link";
import { PackageSearch } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { ORDER_STATUS_META } from "@/lib/enums";
import { ROUTES } from "@/lib/routes";
import { formatDate, formatMoney } from "@/lib/utils";

export default async function AccountOrdersPage() {
  const user = await requireUser();
  const orders = await prisma.order.findMany({
    where: { userId: user.id },
    orderBy: { placedAt: "desc" },
    select: {
      id: true,
      orderNumber: true,
      status: true,
      paymentStatus: true,
      totalPaise: true,
      placedAt: true,
      _count: { select: { items: true } },
    },
  });

  return (
    <section aria-label="Your orders" className="border border-ink-850 bg-ink-900/50 p-5 sm:p-6">
      <h2 className="font-display text-lg font-extrabold tracking-[-0.01em] text-bone-50">
        Orders
      </h2>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-10 text-center">
          <PackageSearch className="h-8 w-8 text-ink-600" aria-hidden="true" />
          <p className="text-sm text-ink-300">No orders yet — your history will show up here.</p>
          <Link
            href={ROUTES.shop}
            className="mt-1 inline-flex h-11 items-center bg-flame-500 px-6 text-2xs font-bold uppercase tracking-[0.1em] text-ink-950 transition-colors hover:bg-flame-400"
          >
            Start shopping
          </Link>
        </div>
      ) : (
        <ul className="mt-4 flex flex-col divide-y divide-ink-800">
          {orders.map((order) => (
            <li key={order.id}>
              <Link
                href={ROUTES.account.order(order.id)}
                className="flex items-center justify-between gap-3 py-4 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flame-500"
              >
                <span className="min-w-0">
                  <span className="block truncate font-display text-base font-extrabold text-bone-50">
                    {order.orderNumber}
                  </span>
                  <span className="mt-0.5 block text-2xs text-ink-500">
                    {formatDate(order.placedAt)} · {order._count.items} item{order._count.items === 1 ? "" : "s"}
                  </span>
                </span>
                <span className="flex shrink-0 flex-col items-end gap-1">
                  <span className="border border-ink-700 px-2 py-0.5 text-2xs font-semibold uppercase tracking-[0.08em] text-ink-200">
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
  );
}
