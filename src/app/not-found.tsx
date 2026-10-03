import Link from "next/link";
import { Compass, Home, Search } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { ROUTES } from "@/lib/routes";

/**
 * 404.
 *
 * Rendered for any unmatched route and for `notFound()` calls in a segment. The
 * three links are the three ways a lost rider most likely wants to recover:
 * back to the shop, search the catalogue, or go home.
 */
export default function NotFound() {
  return (
    <div className="container-page py-20 sm:py-28">
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-7 text-center">
        <span
          aria-hidden="true"
          className="font-display text-[5rem] leading-none font-extrabold tracking-[-0.04em] text-ink-850"
        >
          404
        </span>

        <div className="flex flex-col gap-3">
          <h1 className="text-3xl text-bone-50 sm:text-4xl">That page has ridden off</h1>
          <p className="text-sm leading-relaxed text-ink-300 sm:text-base">
            The link may be old, or the product may have sold out and been retired. Nothing is wrong with
            your cart — anything you saved is still waiting for you.
          </p>
        </div>

        <nav aria-label="Recovery links">
          <ul className="flex flex-wrap items-center justify-center gap-3">
            <li>
              <ButtonLink href={ROUTES.shop} size="lg">
                <Compass aria-hidden="true" className="h-4 w-4" />
                Browse all gear
              </ButtonLink>
            </li>
            <li>
              <ButtonLink href={ROUTES.search} variant="outline" size="lg">
                <Search aria-hidden="true" className="h-4 w-4" />
                Search the catalogue
              </ButtonLink>
            </li>
            <li>
              <ButtonLink href={ROUTES.home} variant="ghost" size="lg">
                <Home aria-hidden="true" className="h-4 w-4" />
                Home
              </ButtonLink>
            </li>
          </ul>
        </nav>

        <div className="w-full rounded-lg border border-ink-800 bg-ink-900/60 p-6 text-left">
          <h2 className="label-caps mb-3 text-bone-50">Popular right now</h2>
          <ul className="flex flex-wrap gap-2">
            {[
              { href: ROUTES.category("helmets"), label: "Helmets" },
              { href: ROUTES.category("jackets"), label: "Riding jackets" },
              { href: ROUTES.category("protection"), label: "Armour & protection" },
              { href: ROUTES.category("touring"), label: "Touring gear" },
              { href: ROUTES.collection("monsoon-edit"), label: "The Monsoon Edit" },
              { href: ROUTES.wishlist, label: "Your wishlist" },
            ].map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="inline-flex rounded-full border border-ink-700 px-3.5 py-1.5 text-2xs font-semibold uppercase tracking-[0.08em] text-ink-200 transition-colors duration-200 hover:border-flame-500 hover:text-flame-300"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}