import Link from "next/link";
import {
  Clock,
  Facebook,
  Instagram,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Youtube,
} from "lucide-react";
import { publicEnv } from "@/lib/env";
import { getStoreSettings } from "@/lib/data/site-settings";
import { getNavigationCategories } from "@/lib/data/navigation";
import { getCollections } from "@/lib/data/products";
import { ROUTES } from "@/lib/routes";
import { Logo } from "@/components/layout/logo";
import { NewsletterForm } from "@/components/layout/newsletter-form";
import { formatMoney } from "@/lib/utils";

/**
 * Site footer.
 *
 * Four columns of real navigation plus a full contact block — the store address,
 * both phone lines, email, opening hours and the social profiles. Content pages
 * live in their own column rather than being buried in a mega-menu nobody finds.
 */
export async function SiteFooter() {
  const env = publicEnv();
  const [settings, categories, collections] = await Promise.all([
    getStoreSettings(),
    getNavigationCategories(),
    getCollections(4),
  ]);

  const supportPhone = env.storePhone || settings.supportPhone;
  const supportEmail = env.storeEmail || settings.supportEmail;

  const whatsappDigits = env.whatsappNumber.replace(/\D/g, "");
  const whatsappHref = whatsappDigits
    ? `https://wa.me/${whatsappDigits}`
    : `mailto:${supportEmail}`;

  const socials = [
    { href: env.instagramUrl, label: "Instagram", icon: Instagram },
    { href: env.facebookUrl, label: "Facebook", icon: Facebook },
    { href: env.youtubeUrl, label: "YouTube", icon: Youtube },
  ].filter((social) => social.href.length > 0 && social.href !== "https://");

  const shopLinks = [
    { href: ROUTES.shop, label: "All products" },
    ...categories.slice(0, 6).map((category) => ({
      href: ROUTES.category(category.slug),
      label: category.name,
    })),
    { href: ROUTES.brands, label: "All brands" },
    { href: `${ROUTES.shop}?sort=newest`, label: "New arrivals" },
    { href: `${ROUTES.shop}?sale=1`, label: "Offers" },
  ];

  const helpLinks = [
    { href: ROUTES.content.shipping, label: "Shipping & delivery" },
    { href: ROUTES.content.returns, label: "Returns & exchanges" },
    { href: ROUTES.content.warranty, label: "Warranty" },
    { href: ROUTES.content.faq, label: "FAQ" },
    { href: ROUTES.content.contact, label: "Contact us" },
    { href: ROUTES.content.about, label: "Our story" },
  ];

  const legalLinks = [
    { href: ROUTES.content.privacy, label: "Privacy policy" },
    { href: ROUTES.content.terms, label: "Terms of service" },
  ];

  const accountLinks = [
    { href: ROUTES.account.overview, label: "My account" },
    { href: ROUTES.account.orders, label: "Order history" },
    { href: ROUTES.wishlist, label: "Wishlist" },
    { href: ROUTES.cart, label: "Cart" },
  ];

  const guaranteeItems = [
    {
      icon: ShieldCheck,
      title: "Batch-verified gear",
      body: "Every armour certification checked before it ships.",
    },
    {
      icon: MapPin,
      title: `${settings.city} storefront`,
      body: "Fitting help in person, six days a week.",
    },
    {
      icon: Clock,
      title: `Free over ${formatMoney(settings.freeShippingThresholdPaise, { compact: true })}`,
      body: `Standard ${settings.standardShippingEta}, express ${settings.expressShippingEta}.`,
    },
  ];

  return (
    <footer className="mt-24 border-t border-ink-850 bg-ink-950">
      {/*
        Guarantees.

        Hairline-divided rather than boxed, matching the trust strip under the
        hero. Repeating the same three guarantees at both ends of the page is
        deliberate reinforcement, but repeating the *treatment* as well would
        make the footer feel like a duplicate section rather than a closing note.
      */}
      <div className="border-b border-ink-850">
        <div className="container-page">
          <ul className="grid sm:grid-cols-3">
            {guaranteeItems.map((item) => (
              <li
                key={item.title}
                className="flex items-start gap-3.5 border-b border-ink-850 py-6 last:border-b-0 sm:border-r sm:border-b-0 sm:px-6 sm:first:pl-0 sm:last:border-r-0"
              >
                <span aria-hidden="true" className="mt-0.5 shrink-0 text-flame-500">
                  <item.icon className="h-5 w-5" strokeWidth={1.5} />
                </span>
                <span className="flex flex-col gap-1">
                  <span className="font-display text-sm font-extrabold tracking-[-0.015em] text-bone-50">
                    {item.title}
                  </span>
                  <span className="text-2xs leading-relaxed text-ink-400">{item.body}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Main footer */}
      <div className="container-page grid gap-12 py-section lg:grid-cols-12 lg:gap-8">
        {/* Brand + newsletter */}
        <div className="flex flex-col gap-6 lg:col-span-4">
          <Logo />

          <p className="max-w-sm text-sm leading-relaxed text-ink-400">
            Premium motorcycle helmets, riding gear and accessories, sold by a shop that checks the batch
            number before it hands anything over. Shipping across India since {settings.foundedYear}.
          </p>

          <div>
            <p className="label-caps mb-3 text-bone-50">Gear drops &amp; monsoon alerts</p>
            <NewsletterForm source="footer" className="max-w-md" />
            <p className="mt-2 text-2xs text-ink-500">
              One email a month, mostly new arrivals. Unsubscribe any time.
            </p>
          </div>

          {socials.length > 0 ? (
            <ul className="flex items-center gap-2.5">
              {socials.map((social) => (
                <li key={social.label}>
                  <a
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-9 w-9 items-center justify-center border border-ink-800 text-ink-400 transition-colors duration-200 hover:border-flame-500 hover:text-flame-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flame-500"
                  >
                    <social.icon className="h-4 w-4" aria-hidden="true" />
                    <span className="sr-only">
                      {social.label} (opens in a new tab)
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        {/* Shop */}
        <nav aria-labelledby="footer-shop" className="lg:col-span-2">
          <h2 id="footer-shop" className="label-caps mb-4 text-bone-50">
            Shop
          </h2>
          <ul className="flex flex-col gap-2.5">
            {shopLinks.map((link) => (
              <li key={link.href}>
                <FooterLink href={link.href}>{link.label}</FooterLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Collections + help */}
        <nav aria-labelledby="footer-help" className="lg:col-span-2">
          <h2 id="footer-help" className="label-caps mb-4 text-bone-50">
            Help
          </h2>
          <ul className="flex flex-col gap-2.5">
            {helpLinks.map((link) => (
              <li key={link.href}>
                <FooterLink href={link.href}>{link.label}</FooterLink>
              </li>
            ))}
          </ul>

          {collections.length > 0 ? (
            <>
              <h2 className="label-caps mt-7 mb-4 text-bone-50">Edits</h2>
              <ul className="flex flex-col gap-2.5">
                {collections.map((collection) => (
                  <li key={collection.slug}>
                    <FooterLink href={ROUTES.collection(collection.slug)}>{collection.name}</FooterLink>
                  </li>
                ))}
              </ul>
            </>
          ) : null}
        </nav>

        {/* Account */}
        <nav aria-labelledby="footer-account" className="lg:col-span-2">
          <h2 id="footer-account" className="label-caps mb-4 text-bone-50">
            Your account
          </h2>
          <ul className="flex flex-col gap-2.5">
            {accountLinks.map((link) => (
              <li key={link.href}>
                <FooterLink href={link.href}>{link.label}</FooterLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Contact */}
        <div className="lg:col-span-2">
          <h2 className="label-caps mb-4 text-bone-50">Visit or call</h2>

          <address className="flex flex-col gap-3.5 not-italic">
            <div className="flex items-start gap-2.5">
              <MapPin aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-ink-600" />
              <span className="text-sm leading-relaxed text-ink-300">
                {settings.addressLine1}
                <br />
                {settings.addressLine2}
                <br />
                {settings.city}, {settings.state} {settings.pincode}
                <br />
                {settings.country}
              </span>
            </div>

            <div className="flex items-start gap-2.5">
              <Clock aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-ink-600" />
              <span className="text-sm leading-relaxed text-ink-300">
                {settings.hoursWeekday}
                <br />
                {settings.hoursSunday}
              </span>
            </div>

            <div className="flex flex-col gap-2.5">
              <a
                href={whatsappHref}
                target={whatsappDigits ? "_blank" : undefined}
                rel={whatsappDigits ? "noopener noreferrer" : undefined}
                className="inline-flex items-center gap-2.5 text-sm text-ink-300 transition-colors duration-200 hover:text-flame-300"
              >
                <Phone aria-hidden="true" className="h-4 w-4 shrink-0 text-ink-600" />
                {supportPhone}
                {whatsappDigits ? <span className="text-2xs text-ink-600">(WhatsApp)</span> : null}
              </a>

              <a
                href={`tel:${supportPhone.replace(/\s/g, "")}`}
                className="sr-only"
                tabIndex={-1}
                aria-hidden="true"
              >
                Call {supportPhone}
              </a>

              <a
                href={`mailto:${supportEmail}`}
                className="inline-flex items-center gap-2.5 break-all text-sm text-ink-300 transition-colors duration-200 hover:text-flame-300"
              >
                <Mail aria-hidden="true" className="h-4 w-4 shrink-0 text-ink-600" />
                {supportEmail}
              </a>
            </div>
          </address>
        </div>
      </div>

      {/* Legal bar */}
      <div className="border-t border-ink-850">
        <div className="container-page flex flex-col items-center justify-between gap-4 py-6 sm:flex-row">
          <p className="text-2xs text-ink-500">
            © {new Date().getFullYear()} {env.storeName}. All rights reserved.
          </p>

          {/* Real photography in use — no demo notice. */}

          <ul className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
            {legalLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-2xs text-ink-500 transition-colors duration-200 hover:text-ink-200"
                >
                  {link.label}
                </Link>
              </li>
            ))}
            <li className="text-2xs text-ink-600">Payments secured with Razorpay</li>
          </ul>
        </div>
      </div>
    </footer>
  );
}

/**
 * Footer link.
 *
 * A short orange underline draws in from the left on hover and on keyboard
 * focus, so the destination is signalled without relying on colour change alone.
 */
function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="group relative inline-block py-0.5 text-sm text-ink-400 transition-colors duration-200 hover:text-bone-50 focus-visible:outline-none"
    >
      {children}
      <span
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-px origin-left scale-x-0 bg-flame-500 transition-transform duration-300 ease-(--ease-out-expo) group-hover:scale-x-100 group-focus-visible:scale-x-100 motion-reduce:transition-none"
      />
    </Link>
  );
}