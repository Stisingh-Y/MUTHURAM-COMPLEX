import type { Metadata } from "next";
import Link from "next/link";
import { Heart } from "lucide-react";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { ProductGrid } from "@/components/product/product-grid";
import { getCurrentUser } from "@/lib/auth/session";
import { getWishlist } from "@/lib/data/wishlist";
import { ROUTES } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Wishlist",
  description: "The gear you have your eye on.",
  alternates: { canonical: ROUTES.wishlist },
};

export default async function WishlistPage() {
  const user = await getCurrentUser();
  const entries = await getWishlist(user?.id ?? null);

  return (
    <div className="container-page py-8 sm:py-10">
      <Breadcrumbs
        className="mb-6"
        items={[{ label: "Home", href: ROUTES.home }, { label: "Wishlist" }]}
      />

      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-ink-800 pb-5">
        <div>
          <p className="label-caps text-flame-500">Saved gear</p>
          <h1 className="mt-1 font-display text-3xl font-extrabold tracking-[-0.02em] text-bone-50 sm:text-4xl">
            Wishlist
          </h1>
        </div>
        {entries.length > 0 ? (
          <p className="text-sm text-ink-400 tabular-nums">
            {entries.length} saved
          </p>
        ) : null}
      </div>

      {entries.length === 0 ? (
        <div className="mx-auto flex max-w-xl flex-col items-center gap-4 py-16 text-center sm:py-20">
          <span aria-hidden="true" className="inline-flex h-14 w-14 items-center justify-center border border-ink-750 bg-ink-900 text-flame-500">
            <Heart className="h-6 w-6" />
          </span>
          <h2 className="font-display text-2xl font-extrabold tracking-[-0.01em] text-bone-50">
            Nothing saved yet
          </h2>
          <p className="text-sm leading-relaxed text-ink-300">
            Tap the heart on any product and it waits for you here
            {user ? "" : " — sign in and it follows you across devices"}.
          </p>
          <div className="mt-2 flex flex-wrap justify-center gap-3">
            <Link
              href={ROUTES.shop}
              className="inline-flex h-11 items-center bg-flame-500 px-6 text-2xs font-bold uppercase tracking-[0.1em] text-ink-950 transition-colors hover:bg-flame-400"
            >
              Discover gear
            </Link>
            {!user ? (
              <Link
                href={ROUTES.auth.login}
                className="inline-flex h-11 items-center border border-ink-600 px-6 text-2xs font-bold uppercase tracking-[0.1em] text-bone-50 transition-colors hover:border-ink-400 hover:bg-ink-800"
              >
                Sign in
              </Link>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="mt-8">
          <ProductGrid products={entries} tone="dark" priorityCount={4} label="Wishlist products" />
        </div>
      )}
    </div>
  );
}
