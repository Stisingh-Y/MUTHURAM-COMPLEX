import "server-only";

import { prisma } from "@/lib/db";
import { BANNER_PLACEMENTS, isBannerTheme, type BannerTheme } from "@/lib/enums";

/**
 * Promotional banners.
 *
 * Marketing copy lives in the database so it can be changed without a deploy.
 * Reads filter on `isActive` and the optional schedule window, so a banner that
 * has expired disappears from every surface without anyone touching the code.
 */

export type BannerView = {
  id: string;
  placement: string;
  eyebrow: string | null;
  title: string;
  subtitle: string | null;
  image: string | null;
  mobileImage: string | null;
  ctaLabel: string | null;
  ctaHref: string | null;
  secondaryCtaLabel: string | null;
  secondaryCtaHref: string | null;
  theme: BannerTheme;
};

const SELECT = {
  id: true,
  placement: true,
  eyebrow: true,
  title: true,
  subtitle: true,
  imageUrl: true,
  mobileImageUrl: true,
  ctaLabel: true,
  ctaHref: true,
  secondaryCtaLabel: true,
  secondaryCtaHref: true,
  theme: true,
} as const;

type BannerRow = {
  id: string;
  placement: string;
  eyebrow: string | null;
  title: string;
  subtitle: string | null;
  imageUrl: string | null;
  mobileImageUrl: string | null;
  ctaLabel: string | null;
  ctaHref: string | null;
  secondaryCtaLabel: string | null;
  secondaryCtaHref: string | null;
  theme: string;
};

/**
 * Demo banner plates (`/media/demo/*`) were never shipped as files. Every one
 * is remapped here to a real optimised photo so no surface can render a
 * broken-image icon. Unknown demo paths resolve to `null`, and callers
 * already render a plain dark gradient when `image` is null.
 */
const DEMO_BANNER_IMAGE: Record<string, string> = {
  "/media/demo/hero-01.jpg": "/images/products/helmets/helmets-black-red-agvt-1.webp",
  "/media/demo/hero-01-mobile.jpg": "/images/products/helmets/helmets-black-red-agvt-1.webp",
  "/media/demo/promo-monsoon.jpg": "/images/products/jackets/jackets-white-denim-casual-1.webp",
  "/media/demo/promo-genuine.jpg": "/images/products/helmets/helmets-matte-black-bluetooth-1.webp",
  "/media/demo/promo-track.jpg": "/images/products/boots/boots-red-alpinestars-smx-1.webp",
};

function resolveBannerImage(url: string | null): string | null {
  if (!url) return null;
  if (DEMO_BANNER_IMAGE[url]) return DEMO_BANNER_IMAGE[url];
  if (url.startsWith("/media/demo/")) return null;
  return url;
}

function mapBanner(row: BannerRow): BannerView {
  return {
    id: row.id,
    placement: row.placement,
    eyebrow: row.eyebrow,
    title: row.title,
    subtitle: row.subtitle,
    image: resolveBannerImage(row.imageUrl),
    mobileImage: resolveBannerImage(row.mobileImageUrl),
    ctaLabel: row.ctaLabel,
    ctaHref: row.ctaHref,
    secondaryCtaLabel: row.secondaryCtaLabel,
    secondaryCtaHref: row.secondaryCtaHref,
    theme: isBannerTheme(row.theme) ? row.theme : "DARK",
  };
}

/** Only banners whose schedule window includes `now`. */
function withinSchedule(row: { startsAt: Date | null; expiresAt: Date | null }, now: Date): boolean {
  if (row.startsAt && row.startsAt > now) return false;
  if (row.expiresAt && row.expiresAt < now) return false;
  return true;
}

export async function getBanners(placement: string): Promise<BannerView[]> {
  const now = new Date();
  const rows = await prisma.banner.findMany({
    where: { placement, isActive: true },
    orderBy: { position: "asc" },
    select: { ...SELECT, startsAt: true, expiresAt: true },
  });

  return rows.filter((row) => withinSchedule(row, now)).map((row) => mapBanner(row));
}

/** Every live banner, grouped by placement — what the homepage shell needs. */
export async function getAllBanners(): Promise<Record<string, BannerView[]>> {
  const now = new Date();
  const rows = await prisma.banner.findMany({
    where: { isActive: true },
    orderBy: { position: "asc" },
    select: { ...SELECT, startsAt: true, expiresAt: true },
  });

  const grouped = Object.fromEntries(BANNER_PLACEMENTS.map((placement) => [placement, []])) as Record<
    string,
    BannerView[]
  >;

  for (const row of rows) {
    if (!withinSchedule(row, now)) continue;
    grouped[row.placement]?.push(mapBanner(row));
  }

  return grouped;
}