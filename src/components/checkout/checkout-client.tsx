"use client";

import { useState } from "react";
import Link from "next/link";
import { MapPin, Plus } from "lucide-react";
import { PlaceOrderForm } from "@/components/checkout/place-order-form";
import { SHIPPING_METHODS } from "@/lib/enums";
import { ROUTES } from "@/lib/routes";
import { formatMoney } from "@/lib/utils";

export type CheckoutAddress = {
  id: string;
  label: string;
  fullName: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
};

/**
 * Address + shipping-method selection.
 *
 * Totals are server-computed and passed in; this component only re-derives the
 * displayed shipping line when the method changes. The authoritative totals are
 * recomputed again in `placeOrderAction`, so a tampered form cannot change what
 * is charged.
 */
export function CheckoutClient({
  addresses,
  subtotalPaise,
  discountPaise,
  couponCode,
  standardShippingPaise,
}: {
  addresses: CheckoutAddress[];
  subtotalPaise: number;
  discountPaise: number;
  couponCode: string | null;
  standardShippingPaise: number;
}) {
  const express = SHIPPING_METHODS.find((method) => method.value === "EXPRESS")!;
  const [addressId, setAddressId] = useState<string | null>(
    addresses.find((address) => address.isDefault)?.id ?? addresses[0]?.id ?? null,
  );
  const [method, setMethod] = useState<"STANDARD" | "EXPRESS">("STANDARD");

  const shipping = method === "EXPRESS" ? express.pricePaise : standardShippingPaise;
  const total = subtotalPaise - discountPaise + shipping;

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_24rem] lg:gap-12">
      <div className="flex min-w-0 flex-col gap-8">
        <section aria-label="Delivery address">
          <h2 className="font-display text-lg font-extrabold tracking-[-0.01em] text-bone-50">
            <span className="mr-2 text-flame-500">01</span>
            Delivery address
          </h2>

          {addresses.length === 0 ? (
            <p className="mt-3 border border-ink-800 bg-ink-900/50 px-4 py-3.5 text-sm text-ink-300">
              You have no saved addresses yet.{" "}
              <Link href={ROUTES.account.addresses} className="font-semibold text-flame-400 underline-offset-4 hover:underline">
                Add one
              </Link>{" "}
              to continue — it takes a minute.
            </p>
          ) : (
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {addresses.map((address) => {
                const selected = address.id === addressId;
                return (
                  <li key={address.id}>
                    <button
                      type="button"
                      onClick={() => setAddressId(address.id)}
                      aria-pressed={selected}
                      className={`flex w-full flex-col gap-1 border p-4 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flame-500 ${
                        selected
                          ? "border-flame-500 bg-flame-500/[0.06]"
                          : "border-ink-800 bg-ink-900/50 hover:border-ink-600"
                      }`}
                    >
                      <span className="flex items-center justify-between gap-2">
                        <span className="label-caps text-ink-300">{address.label}</span>
                        {address.isDefault ? (
                          <span className="text-2xs font-bold uppercase tracking-[0.08em] text-flame-400">Default</span>
                        ) : null}
                      </span>
                      <span className="text-sm font-semibold text-bone-50">{address.fullName}</span>
                      <span className="text-2xs leading-relaxed text-ink-400">
                        {address.line1}
                        {address.line2 ? `, ${address.line2}` : ""}
                        <br />
                        {address.city}, {address.state} — {address.pincode}
                        <br />
                        {address.phone}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          <Link href={ROUTES.account.addresses} className="mt-3 inline-flex items-center gap-1.5 text-2xs font-semibold uppercase tracking-[0.1em] text-ink-400 transition-colors hover:text-flame-300">
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            Manage addresses
          </Link>
        </section>

        <section aria-label="Shipping method">
          <h2 className="font-display text-lg font-extrabold tracking-[-0.01em] text-bone-50">
            <span className="mr-2 text-flame-500">02</span>
            Shipping
          </h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {SHIPPING_METHODS.map((option) => {
              const selected = method === option.value;
              return (
                <li key={option.value}>
                  <button
                    type="button"
                    onClick={() => setMethod(option.value)}
                    aria-pressed={selected}
                    className={`flex w-full flex-col gap-0.5 border p-4 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flame-500 ${
                      selected
                        ? "border-flame-500 bg-flame-500/[0.06]"
                        : "border-ink-800 bg-ink-900/50 hover:border-ink-600"
                    }`}
                  >
                    <span className="text-sm font-semibold text-bone-50">{option.label}</span>
                    <span className="text-2xs text-ink-400">{option.description}</span>
                    <span className="mt-1 text-sm font-bold text-bone-50 tabular-nums">
                      {option.value === "STANDARD" && standardShippingPaise === 0
                        ? "Free"
                        : formatMoney(option.pricePaise)}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          <p className="mt-2 flex items-start gap-1.5 text-2xs text-ink-500">
            <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            Standard shipping is free over {formatMoney(299900)}. Express is always charged.
          </p>
        </section>
      </div>

      <aside className="lg:sticky lg:top-32 lg:self-start">
        <div className="border border-ink-850 bg-ink-900/50 p-6">
          <h2 className="font-display text-lg font-extrabold tracking-[-0.01em] text-bone-50">
            <span className="mr-2 text-flame-500">03</span>
            Place order
          </h2>
          <dl className="mt-4 flex flex-col gap-2.5 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-ink-400">Subtotal</dt>
              <dd className="tabular-nums text-bone-50">{formatMoney(subtotalPaise)}</dd>
            </div>
            {discountPaise > 0 ? (
              <div className="flex justify-between gap-3">
                <dt className="text-ink-400">Discount{couponCode ? ` (${couponCode})` : ""}</dt>
                <dd className="tabular-nums text-success-400">−{formatMoney(discountPaise)}</dd>
              </div>
            ) : null}
            <div className="flex justify-between gap-3">
              <dt className="text-ink-400">Shipping</dt>
              <dd className="tabular-nums text-bone-50">{shipping === 0 ? "Free" : formatMoney(shipping)}</dd>
            </div>
            <div className="flex justify-between gap-3 border-t border-ink-800 pt-3">
              <dt className="font-display text-base font-extrabold text-bone-50">Total</dt>
              <dd className="font-display text-xl font-extrabold text-bone-50 tabular-nums">{formatMoney(total)}</dd>
            </div>
          </dl>
          <PlaceOrderForm addressId={addressId} shippingMethod={method} disabled={addresses.length === 0} />
        </div>
      </aside>
    </div>
  );
}
