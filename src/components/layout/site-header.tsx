import Link from "next/link";
import { Heart, ShoppingBag, UserRound } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import { getCart } from "@/lib/data/cart";
import { getWishlistIds } from "@/lib/data/wishlist";
import { getStoreSettings } from "@/lib/data/site-settings";
import { getNavigationCategories, getNavigationCollections } from "@/lib/data/navigation";
import { ROUTES } from "@/lib/routes";
import { Logo } from "@/components/layout/logo";
import { AnnouncementBar } from "@/components/layout/announcement-bar";
import { HeaderScrollShell } from "@/components/layout/header-scroll-shell";
import { MegaMenu } from "@/components/layout/mega-menu";
import { SearchDialog } from "@/components/layout/search-dialog";
import { MobileNav } from "@/components/layout/mobile-nav";
import { AccountMenu } from "@/components/layout/account-menu";

/**
 * Site header.
 *
 * Server Component: counts, the signed-in rider and the category list are all
 * read here and handed to small client islands as plain props. That means the
 * bar is correct in the first HTML frame — no cart badge flicker from 0 to 3
 * after hydration.
 *
 * Counts come from `getCart`/`getWishlistIds`, which read cookies, so this
 * segment is request-time. Mutations call `revalidatePath` to refresh it.
 */
export async function SiteHeader() {
  const [user, settings, categories, collections] = await Promise.all([
    getCurrentUser(),
    getStoreSettings(),
    getNavigationCategories(),
    getNavigationCollections(),
  ]);

  const [cart, wishlistIds] = await Promise.all([
    getCart(user?.id ?? null),
    getWishlistIds(user?.id ?? null),
  ]);

  const cartCount = cart.totals.itemCount;
  const wishlistCount = wishlistIds.length;
  const isStaff = user?.role === "ADMIN" || user?.role === "STAFF";

  const accountUser = user
    ? {
        name: user.name,
        email: user.email,
        isStaff,
        links: [
          { href: ROUTES.account.overview, label: "Dashboard" },
          { href: ROUTES.account.orders, label: "Orders" },
          { href: ROUTES.account.addresses, label: "Addresses" },
          { href: ROUTES.account.profile, label: "Profile" },
        ],
      }
    : null;

  /**
   * Primary navigation.
   *
   * The brand brief calls for every department to be reachable in one click:
   * Home, Shop, each category, Brands, Offers. That is too many items for a
   * mega menu to be the only route in — a rider who knows they want gloves
   * should not have to open a panel to find gloves.
   *
   * So: `Shop` keeps the mega menu for browsing, and the categories are *also*
   * listed inline. The list is built from the database rather than hardcoded, so
   * merchandising a new category or renaming one updates the header with no
   * code change, and the fixed entries (Brands, Offers) stay stable because they
   * are store-level destinations rather than categories.
   *
   * `sale` is the correct filter key for offers; `discount` is not recognised by
   * the catalog's filter parser and silently returns the full range.
   */
  // Six items, never truncated: Shop (mega menu) + 4 core
  // departments + Brands. Riding Pants, Protection, Tools, Accessories
  // and Offers live inside the mega menu.
  const fixedLinks = [
    { href: ROUTES.category("helmets"), label: "Helmets" },
    { href: ROUTES.category("jackets"), label: "Jackets" },
    { href: ROUTES.category("gloves"), label: "Gloves" },
    { href: ROUTES.category("boots"), label: "Boots" },
    { href: ROUTES.brands, label: "Brands" },
  ];

  return (
    <>
      <AnnouncementBar
        freeShippingPaise={settings.freeShippingThresholdPaise}
        returnDays={15}
      />

      <HeaderScrollShell>
        <div className="container-page">
          {/* Fixed 72px bar — never animates height, so scrolling across the
              threshold cannot shift layout or flash the header. */}
          <div className="flex h-[72px] items-center gap-3">
            <div className="flex shrink-0 items-center gap-2">
              <MobileNav
                categories={categories}
                collections={collections}
                cartCount={cartCount}
                wishlistCount={wishlistCount}
                user={accountUser}
              />
              <Logo />
            </div>

            <nav aria-label="Primary" className="hidden min-w-0 flex-1 items-center justify-center xl:flex">
              <ul className="flex items-center gap-9">
                <li className="flex shrink-0 items-center">
                  <MegaMenu categories={categories} collections={collections} />
                </li>
                {fixedLinks.map((link) => (
                  <li key={link.href} className="flex shrink-0 items-center">
                    <Link
                      href={link.href}
                      className="group relative block py-2 text-[13px] font-bold whitespace-nowrap text-[#D9D9D9] uppercase transition-colors duration-200 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-flame-500"
                      style={{ letterSpacing: "0.08em" }}
                    >
                      {link.label}
                      {/* 2px orange underline, slides in from the left */}
                      <span
                        aria-hidden="true"
                        className="absolute inset-x-0 bottom-0 h-0.5 origin-left scale-x-0 bg-flame-500 transition-transform duration-200 ease-out group-hover:scale-x-100 group-focus-visible:scale-x-100 motion-reduce:transition-none"
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="ml-auto flex shrink-0 items-center gap-2">
              <SearchDialog compact />

              <Link
                href={ROUTES.wishlist}
                className="relative inline-flex h-10 w-10 items-center justify-center rounded-sm border border-ink-800 text-ink-300 transition-colors duration-200 hover:border-ink-600 hover:bg-ink-850 hover:text-bone-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flame-500"
              >
                <Heart className="h-[1.15rem] w-[1.15rem]" aria-hidden="true" />
                {wishlistCount > 0 ? <CountBadge count={wishlistCount} /> : null}
                <span className="sr-only">
                  Wishlist{wishlistCount > 0 ? `, ${wishlistCount} saved` : ""}
                </span>
              </Link>

              <Link
                href={ROUTES.cart}
                className="relative inline-flex h-10 w-10 items-center justify-center rounded-sm border border-ink-800 text-ink-300 transition-colors duration-200 hover:border-ink-600 hover:bg-ink-850 hover:text-bone-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flame-500 sm:w-auto sm:gap-2 sm:px-3"
              >
                <ShoppingBag className="h-[1.15rem] w-[1.15rem] shrink-0" aria-hidden="true" />
                {cartCount > 0 ? <CountBadge count={cartCount} /> : null}
                <span className="sr-only">
                  Cart{cartCount > 0 ? `, ${cartCount} ${cartCount === 1 ? "item" : "items"}` : ""}
                </span>
              </Link>

              {accountUser ? (
                <AccountMenu user={accountUser} />
              ) : (
                <Link
                  href={ROUTES.auth.login}
                  className="hidden h-10 items-center gap-2 rounded-sm border border-ink-800 px-3 text-2xs font-semibold uppercase tracking-[0.1em] text-ink-200 transition-colors duration-200 hover:border-ink-600 hover:bg-ink-850 hover:text-bone-50 lg:inline-flex"
                >
                  <UserRound className="h-4 w-4" aria-hidden="true" />
                  Sign in
                </Link>
              )}
            </div>
          </div>
        </div>
      </HeaderScrollShell>
    </>
  );
}

/** Small pill badge pinned to the top-right of an icon button. */
function CountBadge({ count }: { count: number }) {
  if (count <= 0) return null;

  return (
    <span
      aria-hidden="true"
      className="absolute -right-1 -top-1 flex h-[1.15rem] min-w-[1.15rem] items-center justify-center bg-flame-500 px-1 font-display text-[0.625rem] font-bold tabular-nums text-ink-950"
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}