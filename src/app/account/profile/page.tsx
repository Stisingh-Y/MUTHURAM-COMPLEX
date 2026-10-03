import { requireUser } from "@/lib/auth/session";
import { logoutAction } from "@/app/auth/actions";
import { ProfileForm } from "@/components/account/account-forms";

export default async function AccountProfilePage() {
  const user = await requireUser();

  return (
    <div className="flex flex-col gap-6">
      <section aria-label="Profile details" className="border border-ink-850 bg-ink-900/50 p-5 sm:p-6">
        <h2 className="font-display text-lg font-extrabold tracking-[-0.01em] text-bone-50">
          Profile
        </h2>
        <p className="mt-1 text-sm text-ink-400">
          Signed in as <span className="font-semibold text-bone-100">{user.email}</span>
        </p>
        <div className="mt-4">
          <ProfileForm name={user.name} phone={user.phone} />
        </div>
      </section>

      <section aria-label="Sign out" className="border border-ink-850 bg-ink-900/50 p-5 sm:p-6">
        <h2 className="font-display text-lg font-extrabold tracking-[-0.01em] text-bone-50">
          Sign out
        </h2>
        <p className="mt-1 text-sm text-ink-400">
          Your cart and wishlist stay saved for next time.
        </p>
        <form action={logoutAction} className="mt-4">
          <button
            type="submit"
            className="inline-flex h-11 items-center border border-ink-600 px-6 text-2xs font-bold uppercase tracking-[0.1em] text-bone-50 transition-colors hover:border-ink-400 hover:bg-ink-800"
          >
            Sign out everywhere
          </button>
        </form>
      </section>
    </div>
  );
}
