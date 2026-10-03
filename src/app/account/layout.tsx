import type { Metadata } from "next";
import Link from "next/link";
import { Heart, LayoutDashboard, MapPin, Package, UserRound } from "lucide-react";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { requireUser } from "@/lib/auth/session";
import { ROUTES } from "@/lib/routes";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "My account",
  robots: { index: false, follow: false },
};

const NAV = [
  { href: ROUTES.account.overview, label: "Overview", icon: LayoutDashboard },
  { href: ROUTES.account.orders, label: "Orders", icon: Package },
  { href: ROUTES.account.addresses, label: "Addresses", icon: MapPin },
  { href: ROUTES.account.profile, label: "Profile", icon: UserRound },
  { href: ROUTES.account.wishlist, label: "Wishlist", icon: Heart },
];

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  return (
    <div className="container-page py-8 sm:py-10">
      <Breadcrumbs
        className="mb-6"
        items={[{ label: "Home", href: ROUTES.home }, { label: "Account" }]}
      />

      <p className="label-caps text-flame-500">My account</p>
      <h1 className="mt-1 font-display text-3xl font-extrabold tracking-[-0.02em] text-bone-50 sm:text-4xl">
        Hi, {user.name.split(" ")[0]}
      </h1>

      <div className="mt-8 grid gap-8 lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-12">
        <nav aria-label="Account sections" className="lg:sticky lg:top-32 lg:self-start">
          <ul className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0">
            {NAV.map((item) => (
              <li key={item.href} className="shrink-0">
                <AccountNavLink href={item.href} label={item.label}>
                  <item.icon className="h-4 w-4" aria-hidden="true" />
                </AccountNavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}

function AccountNavLink({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2.5 border border-ink-800 bg-ink-900/40 px-4 py-2.5",
        "text-2xs font-semibold uppercase tracking-[0.1em] text-ink-300",
        "transition-colors duration-200 hover:border-ink-600 hover:text-bone-50",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flame-500",
        "lg:w-full",
      )}
    >
      {children}
      {label}
    </Link>
  );
}
