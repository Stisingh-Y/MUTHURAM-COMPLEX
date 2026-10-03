import { MapPin } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { deleteAddressAction, setDefaultAddressAction } from "@/app/actions/account";
import { AddressForm } from "@/components/account/account-forms";

export default async function AccountAddressesPage() {
  const user = await requireUser();
  const addresses = await prisma.address.findMany({
    where: { userId: user.id },
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
  });

  return (
    <div className="flex flex-col gap-6">
      <section aria-label="Saved addresses" className="border border-ink-850 bg-ink-900/50 p-5 sm:p-6">
        <h2 className="font-display text-lg font-extrabold tracking-[-0.01em] text-bone-50">
          Saved addresses
        </h2>

        {addresses.length === 0 ? (
          <p className="mt-3 flex items-start gap-2 text-sm text-ink-400">
            <MapPin className="h-4 w-4 shrink-0 text-ink-600" aria-hidden="true" />
            No addresses yet. Add one below and checkout becomes a two-tap job.
          </p>
        ) : (
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {addresses.map((address) => (
              <li key={address.id} className="flex flex-col gap-3 border border-ink-800 bg-ink-950/50 p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="label-caps text-ink-300">{address.label}</span>
                  {address.isDefault ? (
                    <span className="bg-flame-500/12 px-2 py-0.5 text-2xs font-bold uppercase tracking-[0.08em] text-flame-400">
                      Default
                    </span>
                  ) : null}
                </div>
                <address className="text-sm not-italic leading-relaxed text-ink-300">
                  <span className="font-semibold text-bone-50">{address.fullName}</span>
                  <br />
                  {address.line1}
                  {address.line2 ? `, ${address.line2}` : ""}
                  <br />
                  {address.city}, {address.state} — {address.pincode}
                  <br />
                  {address.phone}
                </address>
                <div className="mt-auto flex gap-2 pt-1">
                  {!address.isDefault ? (
                    <form action={setDefaultAddressAction}>
                      <input type="hidden" name="addressId" value={address.id} />
                      <button type="submit" className="h-9 border border-ink-700 px-3 text-2xs font-semibold uppercase tracking-[0.08em] text-ink-200 transition-colors hover:border-ink-500 hover:text-bone-50">
                        Make default
                      </button>
                    </form>
                  ) : null}
                  <form action={deleteAddressAction}>
                    <input type="hidden" name="addressId" value={address.id} />
                    <button type="submit" className="h-9 border border-ink-700 px-3 text-2xs font-semibold uppercase tracking-[0.08em] text-ink-400 transition-colors hover:border-danger-500 hover:text-danger-400">
                      Delete
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-label="Add a new address" className="border border-ink-850 bg-ink-900/50 p-5 sm:p-6">
        <h2 className="font-display text-lg font-extrabold tracking-[-0.01em] text-bone-50">
          Add a new address
        </h2>
        <div className="mt-4">
          <AddressForm />
        </div>
      </section>
    </div>
  );
}
