"use client";

import { useActionState } from "react";
import { Field } from "@/components/ui/field";
import { FormMessage } from "@/components/ui/form-message";
import { addAddressAction, updateProfileAction, type AccountActionState } from "@/app/actions/account";

const IDLE: AccountActionState = { status: "idle" };

export function AddressForm() {
  const [state, action, pending] = useActionState(addAddressAction, IDLE);

  return (
    <form action={action} className="flex flex-col gap-4">
      <FormMessage status={state.status} message={state.message} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="addr-label" name="label" label="Label" maxLength={24} placeholder="Home / Work" error={state.fieldErrors?.label} />
        <Field id="addr-name" name="fullName" label="Recipient name" autoComplete="name" required maxLength={80} placeholder="Aarav Sharma" error={state.fieldErrors?.fullName} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="addr-phone" name="phone" label="Mobile number" type="tel" autoComplete="tel" inputMode="tel" required maxLength={10} placeholder="10-digit mobile" error={state.fieldErrors?.phone} />
        <Field id="addr-pincode" name="pincode" label="Pincode" inputMode="numeric" required maxLength={6} placeholder="6-digit pincode" error={state.fieldErrors?.pincode} />
      </div>
      <Field id="addr-line1" name="line1" label="Street address" autoComplete="street-address" required maxLength={160} placeholder="Flat, street, area" error={state.fieldErrors?.line1} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="addr-line2" name="line2" label="Address line 2 (optional)" maxLength={160} placeholder="Apartment, floor" error={state.fieldErrors?.line2} />
        <Field id="addr-landmark" name="landmark" label="Landmark (optional)" maxLength={120} placeholder="Near…" error={state.fieldErrors?.landmark} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="addr-city" name="city" label="City" autoComplete="address-level2" required maxLength={80} placeholder="Coimbatore" error={state.fieldErrors?.city} />
        <Field id="addr-state" name="state" label="State" autoComplete="address-level1" required maxLength={80} placeholder="Tamil Nadu" error={state.fieldErrors?.state} />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-11 items-center justify-center bg-flame-500 px-6 text-2xs font-bold uppercase tracking-[0.1em] text-ink-950 transition-colors hover:bg-flame-400 disabled:cursor-not-allowed disabled:opacity-55 sm:w-fit"
      >
        {pending ? "Saving…" : "Save address"}
      </button>
    </form>
  );
}

export function ProfileForm({ name, phone }: { name: string; phone: string | null }) {
  const [state, action, pending] = useActionState(updateProfileAction, IDLE);

  return (
    <form action={action} className="flex flex-col gap-4">
      <FormMessage status={state.status} message={state.message} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="profile-name" name="name" label="Full name" autoComplete="name" required maxLength={80} defaultValue={name} error={state.fieldErrors?.name} />
        <Field id="profile-phone" name="phone" label="Mobile number" type="tel" autoComplete="tel" inputMode="tel" maxLength={10} defaultValue={phone ?? ""} placeholder="10-digit mobile (optional)" error={state.fieldErrors?.phone} />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-11 items-center justify-center bg-flame-500 px-6 text-2xs font-bold uppercase tracking-[0.1em] text-ink-950 transition-colors hover:bg-flame-400 disabled:cursor-not-allowed disabled:opacity-55 sm:w-fit"
      >
        {pending ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}
