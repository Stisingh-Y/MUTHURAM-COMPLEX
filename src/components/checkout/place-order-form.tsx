"use client";

import { useActionState } from "react";
import { LockKeyhole } from "lucide-react";
import { FormMessage } from "@/components/ui/form-message";
import { placeOrderAction, type CheckoutActionState } from "@/app/actions/checkout";

const IDLE: CheckoutActionState = { status: "idle" };

export function PlaceOrderForm({
  addressId,
  shippingMethod,
  disabled,
}: {
  addressId: string | null;
  shippingMethod: string;
  disabled?: boolean;
}) {
  const [state, action, pending] = useActionState(placeOrderAction, IDLE);

  return (
    <form action={action} className="mt-5 flex flex-col gap-3">
      <input type="hidden" name="addressId" value={addressId ?? ""} />
      <input type="hidden" name="shippingMethod" value={shippingMethod} />
      <FormMessage status={state.status} message={state.message} />
      <button
        type="submit"
        disabled={pending || disabled || !addressId}
        className="inline-flex h-12 w-full items-center justify-center gap-2 bg-flame-500 text-2xs font-bold uppercase tracking-[0.12em] text-ink-950 transition-colors hover:bg-flame-400 disabled:cursor-not-allowed disabled:opacity-55 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flame-500"
      >
        <LockKeyhole className="h-4 w-4" aria-hidden="true" />
        {pending ? "Placing your order…" : "Place order · pay on delivery"}
      </button>
      <p className="text-center text-2xs leading-relaxed text-ink-500">
        No advance payment. Pay by cash or UPI when your gear arrives.
      </p>
    </form>
  );
}
