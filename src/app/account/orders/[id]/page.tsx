import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { ORDER_PROGRESS, ORDER_STATUS_META } from "@/lib/enums";
import { ROUTES } from "@/lib/routes";
import { formatDate, formatMoney } from "@/lib/utils";
import { getLqipOrTile } from "@/lib/image-placeholders";

type AddressJson = {
  fullName?: string;
  phone?: string;
  line1?: string;
  line2?: string | null;
  landmark?: string | null;
  city?: string;
  state?: string;
  pincode?: string;
};

function parseAddress(raw: string): AddressJson {
  try {
    const value: unknown = JSON.parse(raw);
    return typeof value === "object" && value !== null ? (value as AddressJson) : {};
  } catch {
    return {};
  }
}

export default async function AccountOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;

  const order = await prisma.order.findFirst({
    where: { id, userId: user.id },
    include: { items: true, events: { orderBy: { createdAt: "asc" } } },
  });

  if (!order) notFound();

  const shipping = parseAddress(order.shippingAddressJson);
  const progressIndex = ORDER_PROGRESS.indexOf(order.status as (typeof ORDER_PROGRESS)[number]);

  return (
    <div className="flex flex-col gap-6">
      <Link href={ROUTES.account.orders} className="inline-flex w-fit items-center gap-1.5 text-2xs font-semibold uppercase tracking-[0.1em] text-ink-400 transition-colors hover:text-flame-300">
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
        All orders
      </Link>

      <section aria-label={`Order ${order.orderNumber}`} className="border border-ink-850 bg-ink-900/50 p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-extrabold tracking-[-0.01em] text-bone-50">
              {order.orderNumber}
            </h2>
            <p className="mt-0.5 text-2xs text-ink-500">
              Placed {formatDate(order.placedAt)} · {order.items.length} item{order.items.length === 1 ? "" : "s"}
            </p>
          </div>
          <span className="border border-flame-500/50 bg-flame-500/10 px-2.5 py-1 text-2xs font-bold uppercase tracking-[0.08em] text-flame-300">
            {ORDER_STATUS_META[order.status as keyof typeof ORDER_STATUS_META]?.label ?? order.status}
          </span>
        </div>

        {order.status !== "CANCELLED" ? (
          <ol aria-label="Delivery progress" className="mt-5 flex flex-col gap-0">
            {ORDER_PROGRESS.map((step, index) => {
              const done = progressIndex >= 0 && index <= progressIndex;
              return (
                <li key={step} className="flex gap-3">
                  <span aria-hidden="true" className="flex flex-col items-center">
                    <span className={done ? "mt-1 h-2.5 w-2.5 bg-flame-500" : "mt-1 h-2.5 w-2.5 border border-ink-600"} />
                    {index < ORDER_PROGRESS.length - 1 ? (
                      <span className={done ? "w-px flex-1 bg-flame-500/60" : "w-px flex-1 bg-ink-800"} />
                    ) : null}
                  </span>
                  <span className={`pb-4 text-2xs font-semibold uppercase tracking-[0.08em] ${done ? "text-bone-100" : "text-ink-600"}`}>
                    {ORDER_STATUS_META[step].label}
                  </span>
                </li>
              );
            })}
          </ol>
        ) : (
          <p className="mt-4 border border-ink-700 px-3.5 py-3 text-sm text-ink-300">
            This order was cancelled. If you paid online, the refund is processed to the original method.
          </p>
        )}

        <ul className="mt-2 flex flex-col divide-y divide-ink-800 border-t border-ink-800">
          {order.items.map((item) => (
            <li key={item.id} className="flex items-center gap-4 py-4">
              {item.imageSnapshot ? (
                <span className="relative block h-16 w-14 shrink-0 overflow-hidden border border-ink-800 bg-ink-850">
                  <Image src={item.imageSnapshot} alt="" fill sizes="56px" placeholder="blur" blurDataURL={getLqipOrTile(item.imageSnapshot)} className="object-cover" />
                </span>
              ) : null}
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-bone-50">{item.nameSnapshot}</span>
                {item.variantSnapshot ? (
                  <span className="block text-2xs text-ink-500">{item.variantSnapshot}</span>
                ) : null}
                <span className="block text-2xs text-ink-500 tabular-nums">
                  {formatMoney(item.unitPricePaise)} × {item.quantity}
                </span>
              </span>
              <span className="shrink-0 text-sm font-bold text-bone-50 tabular-nums">
                {formatMoney(item.totalPaise)}
              </span>
            </li>
          ))}
        </ul>

        <dl className="flex flex-col gap-2 border-t border-ink-800 pt-4 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-ink-400">Subtotal</dt>
            <dd className="tabular-nums text-bone-50">{formatMoney(order.subtotalPaise)}</dd>
          </div>
          {order.discountPaise > 0 ? (
            <div className="flex justify-between gap-3">
              <dt className="text-ink-400">Discount{order.couponCode ? ` (${order.couponCode})` : ""}</dt>
              <dd className="tabular-nums text-success-400">−{formatMoney(order.discountPaise)}</dd>
            </div>
          ) : null}
          <div className="flex justify-between gap-3">
            <dt className="text-ink-400">Shipping</dt>
            <dd className="tabular-nums text-bone-50">{order.shippingPaise === 0 ? "Free" : formatMoney(order.shippingPaise)}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="font-display text-base font-extrabold text-bone-50">Total</dt>
            <dd className="font-display text-lg font-extrabold text-bone-50 tabular-nums">{formatMoney(order.totalPaise)}</dd>
          </div>
        </dl>
      </section>

      <section aria-label="Delivery address" className="border border-ink-850 bg-ink-900/50 p-5 sm:p-6">
        <h2 className="label-caps text-ink-400">Deliver to</h2>
        <address className="mt-2 text-sm not-italic leading-relaxed text-ink-200">
          <span className="font-semibold text-bone-50">{shipping.fullName}</span>
          <br />
          {shipping.line1}
          {shipping.line2 ? `, ${shipping.line2}` : ""}
          {shipping.landmark ? <><br />Near {shipping.landmark}</> : null}
          <br />
          {shipping.city}, {shipping.state} — {shipping.pincode}
          <br />
          {shipping.phone}
        </address>
        {order.trackingNumber ? (
          <p className="mt-3 text-2xs text-ink-400">
            Tracking: <span className="font-mono text-bone-100">{order.trackingNumber}</span>
          </p>
        ) : null}
      </section>
    </div>
  );
}
