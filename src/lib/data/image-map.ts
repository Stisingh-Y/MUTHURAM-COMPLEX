import realBlur from "@/generated/real-image-blur.json";

/**
 * Real product photography map — demo-to-real image swap, Phase 2.
 *
 * Source of truth: `real-images/manifest.csv` (owner-supplied photos) matched
 * to catalogue slugs in `real-images/product-match.json`, optimised by
 * `scripts/real-images-optimise.ts` into
 * `public/images/products/{slug}/{main,detail,angle}.webp`.
 *
 * - 16 products have a dedicated photo matched by type + colour (`reused: false`).
 * - 16 products in categories with no photos yet (riding-pants, protection,
 *   touring, accessories) reuse the closest-category photo (`reused: true`).
 * - 0 products are unmatched: every slug resolves to a real file, so no
 *   surface ever renders a demo plate, cartoon SVG, or "coming soon" tile.
 */

export const PLACEHOLDER_IMAGE = "/images/placeholder.webp";

export type RealImageEntry = {
  slug: string;
  /** Card + gallery main image. */
  main: string;
  /** Gallery in display order: [main, detail, angle]. */
  gallery: string[];
  imageAlt: string;
  blurDataURL: string;
  /** True when the photo belongs to another category (no dedicated shoot yet). */
  reused: boolean;
  /** Source file under `real-images/` (for audits). */
  sourceFile: string;
};

const BLUR: Record<string, string> = realBlur as Record<string, string>;

function entry(
  slug: string,
  sourceFile: string,
  imageAlt: string,
  reused: boolean,
  detail: string,
  angle: string,
): RealImageEntry {
  const main = `/images/products/${slug}/main.webp`;
  return {
    slug,
    main,
    gallery: [main, `/images/products/${slug}/${detail}`, `/images/products/${slug}/${angle}`],
    imageAlt,
    blurDataURL: BLUR[main] ?? "",
    reused,
    sourceFile: `real-images/${sourceFile}`,
  };
}

/** >>> OWNER: re-run `npx tsx scripts/real-images-optimise.ts` after edits. */
export const REAL_IMAGE_MAP: Record<string, RealImageEntry> = {
  "vortex-r9-modular-helmet": entry("vortex-r9-modular-helmet", "helmets/helmets-matte-black-bluetooth-1.jpg", "Matte black modular motorcycle helmet with bluetooth unit, side view", false, "detail.webp", "angle.webp"),
  "vortex-r5-full-face-helmet": entry("vortex-r5-full-face-helmet", "helmets/helmets-black-red-agvt-1.jpg", "Black and red full-face motorcycle helmet, side view", false, "detail.webp", "angle.webp"),
  "meridian-atelier-no-1-helmet": entry("meridian-atelier-no-1-helmet", "helmets/helmets-black-green-tork-1.jpg", "Black and green full-face motorcycle helmet, rear three-quarter view", false, "detail.webp", "angle.webp"),
  "vortex-trail-adventure-helmet": entry("vortex-trail-adventure-helmet", "helmets/helmets-yellow-rpha70-shuky-1.jpg", "Yellow and black adventure motorcycle helmet, front three-quarter view", false, "detail.webp", "angle.webp"),
  "strata-vantage-airflow-mesh-jacket": entry("strata-vantage-airflow-mesh-jacket", "jackets/jackets-black-leather-racing-1.jpg", "Black leather racing motorcycle jacket with red trim, front view", false, "detail.webp", "angle.webp"),
  "strata-stormguard-waterproof-jacket": entry("strata-stormguard-waterproof-jacket", "jackets/jackets-brown-black-cafe-racer-1.jpg", "Brown and black cafe-racer leather motorcycle jacket, front view", false, "detail.webp", "angle.webp"),
  "strata-torch-heated-jacket": entry("strata-torch-heated-jacket", "jackets/jackets-beige-leather-cafe-1.jpg", "Beige leather motorcycle jacket with quilted shoulders, front view", false, "detail.webp", "angle.webp"),
  "strata-nimbus-rain-shell": entry("strata-nimbus-rain-shell", "jackets/jackets-white-denim-casual-1.jpg", "White casual motorcycle riding jacket, front view", false, "detail.webp", "angle.webp"),
  "apexline-talon-sport-gloves": entry("apexline-talon-sport-gloves", "gloves/gloves-red-pro-biker-racing-1.jpg", "Red and black racing motorcycle gloves with knuckle protection, top view", false, "detail.webp", "angle.webp"),
  "apexline-drygrip-summer-gloves": entry("apexline-drygrip-summer-gloves", "gloves/gloves-black-steel-knuckle-1.jpg", "Black motorcycle gloves with steel knuckle guards, top view", false, "detail.webp", "angle.webp"),
  "apexline-vantage-heated-gloves": entry("apexline-vantage-heated-gloves", "gloves/gloves-black-red-knuckle-1.jpg", "Black and red motorcycle gloves with knuckle guards, top view", false, "detail.webp", "angle.webp"),
  "apexline-ridge-off-road-gloves": entry("apexline-ridge-off-road-gloves", "gloves/gloves-black-green-monster-m20-1.jpg", "Black and green off-road motorcycle gloves, top view", false, "detail.webp", "angle.webp"),
  "trailforge-shift-race-boot": entry("trailforge-shift-race-boot", "boots/boots-red-alpinestars-smx-1.jpg", "Red and black racing motorcycle boots, side view", false, "detail.webp", "angle.webp"),
  "trailforge-voyager-tall-boot": entry("trailforge-voyager-tall-boot", "boots/boots-black-tech10-motocross-1.jpg", "Black motocross motorcycle boots with orange accents, side view", false, "detail.webp", "angle.webp"),
  "trailforge-ridgeline-adventure-boot": entry("trailforge-ridgeline-adventure-boot", "boots/boots-black-yellow-sidi-1.jpg", "Black and yellow adventure motorcycle boots, side view", false, "detail.webp", "angle.webp"),
  "trailforge-street-ankle-boot": entry("trailforge-street-ankle-boot", "boots/boots-black-red-sidi-race-1.jpg", "Black and red motorcycle boots, side view", false, "detail.webp", "angle.webp"),
  "strata-ridge-textile-riding-pants": entry("strata-ridge-textile-riding-pants", "jackets/jackets-black-leather-racing-1.jpg", "Black leather motorcycle riding gear, front view", true, "detail.webp", "angle.webp"),
  "strata-monsoon-waterproof-pants": entry("strata-monsoon-waterproof-pants", "jackets/jackets-brown-black-cafe-racer-1.jpg", "Brown and black motorcycle riding gear, front view", true, "detail.webp", "angle.webp"),
  "strata-velocity-race-pants": entry("strata-velocity-race-pants", "jackets/jackets-beige-leather-cafe-1.jpg", "Beige motorcycle riding gear, front view", true, "detail.webp", "angle.webp"),
  "strata-base-layer-thermal-pants": entry("strata-base-layer-thermal-pants", "jackets/jackets-white-denim-casual-1.jpg", "White motorcycle riding gear, front view", true, "detail.webp", "angle.webp"),
  "ironhaus-vantage-back-protector": entry("ironhaus-vantage-back-protector", "gloves/gloves-black-steel-knuckle-1.jpg", "Black protective motorcycle gear with armour, top view", true, "detail.webp", "angle.webp"),
  "ironhaus-chest-guard": entry("ironhaus-chest-guard", "gloves/gloves-black-red-knuckle-1.jpg", "Black and red protective motorcycle gear, top view", true, "detail.webp", "angle.webp"),
  "ironhaus-knee-slider-set": entry("ironhaus-knee-slider-set", "gloves/gloves-red-pro-biker-racing-1.jpg", "Red and black protective motorcycle gear, top view", true, "detail.webp", "angle.webp"),
  "ironhaus-elbow-shoulder-armour-set": entry("ironhaus-elbow-shoulder-armour-set", "gloves/gloves-black-green-monster-m20-1.jpg", "Black and green protective motorcycle gear, top view", true, "detail.webp", "angle.webp"),
  "trailforge-voyager-panniers": entry("trailforge-voyager-panniers", "jackets/jackets-beige-leather-cafe-1.jpg", "Beige motorcycle soft luggage and textile gear, front view", true, "detail.webp", "angle.webp"),
  "driftline-bellows-tank-bag": entry("driftline-bellows-tank-bag", "jackets/jackets-black-leather-racing-1.jpg", "Black motorcycle soft luggage and textile gear, front view", true, "detail.webp", "angle.webp"),
  "trailforge-hydration-reservoir": entry("trailforge-hydration-reservoir", "jackets/jackets-white-denim-casual-1.jpg", "White motorcycle touring gear, front view", true, "detail.webp", "angle.webp"),
  "trailforge-handlebar-roll-bag": entry("trailforge-handlebar-roll-bag", "jackets/jackets-brown-black-cafe-racer-1.jpg", "Brown and black motorcycle touring gear, front view", true, "detail.webp", "angle.webp"),
  "driftline-auxiliary-spot-light-pair": entry("driftline-auxiliary-spot-light-pair", "helmets/helmets-matte-black-bluetooth-1.jpg", "Matte black motorcycle accessory, side view", true, "detail.webp", "angle.webp"),
  "driftline-machined-crash-guard": entry("driftline-machined-crash-guard", "boots/boots-black-tech10-motocross-1.jpg", "Black motorcycle accessory, side view", true, "detail.webp", "angle.webp"),
  "driftline-braided-brake-clutch-line-kit": entry("driftline-braided-brake-clutch-line-kit", "boots/boots-black-red-sidi-race-1.jpg", "Black and red motorcycle accessory, side view", true, "detail.webp", "angle.webp"),
  "driftline-led-tail-turn-kit": entry("driftline-led-tail-turn-kit", "helmets/helmets-black-red-agvt-1.jpg", "Black and red motorcycle accessory, side view", true, "detail.webp", "angle.webp"),
};

export const MATCHED_SLUGS: string[] = Object.keys(REAL_IMAGE_MAP).filter(
  (slug) => !REAL_IMAGE_MAP[slug]?.reused,
);

export const REUSED_SLUGS: string[] = Object.keys(REAL_IMAGE_MAP).filter(
  (slug) => REAL_IMAGE_MAP[slug]?.reused,
);

/** Audit snapshot 2026-10-03: 32 catalogue products, 16 matched, 16 reused, 0 unmatched. */
export const UNMATCHED_PRODUCTS: string[] = [];

export const UNUSED_REAL_IMAGES: string[] = [];

export function realEntryFor(slug: string): RealImageEntry | null {
  return REAL_IMAGE_MAP[slug] ?? null;
}

export function realImagesFor(slug: string): string[] {
  return REAL_IMAGE_MAP[slug]?.gallery ?? [PLACEHOLDER_IMAGE];
}

export function realAltFor(slug: string, fallback: string): string {
  return REAL_IMAGE_MAP[slug]?.imageAlt ?? fallback;
}

export function realBlurFor(slug: string): string | undefined {
  return REAL_IMAGE_MAP[slug]?.blurDataURL || undefined;
}

/** Best photo per category for category cards (all real files, no demo plates). */
export const CATEGORY_IMAGE: Record<string, string> = {
  helmets: "/images/products/vortex-trail-adventure-helmet/main.webp",
  jackets: "/images/products/strata-vantage-airflow-mesh-jacket/main.webp",
  gloves: "/images/products/apexline-talon-sport-gloves/main.webp",
  boots: "/images/products/trailforge-shift-race-boot/main.webp",
  "riding-pants": "/images/products/strata-torch-heated-jacket/main.webp",
  protection: "/images/products/apexline-drygrip-summer-gloves/main.webp",
  touring: "/images/products/trailforge-voyager-panniers/main.webp",
  accessories: "/images/products/vortex-r9-modular-helmet/main.webp",
};

export function categoryImageFor(slug: string, fallback?: string | null): string {
  // The curated real photo always wins: stored rows may still point at
  // demo plates (`/images/categories/*`) that were never shipped as files.
  if (CATEGORY_IMAGE[slug]) return CATEGORY_IMAGE[slug];
  if (fallback && !fallback.includes("coming-soon") && !fallback.includes("placeholder") && !fallback.includes("/media/demo/")) return fallback;
  return PLACEHOLDER_IMAGE;
}

export function categoryBlurFor(slug: string): string | undefined {
  const url = CATEGORY_IMAGE[slug];
  if (!url) return undefined;
  return BLUR[url];
}

/** Real photo per collection (collections carry no stored image). */
export const COLLECTION_IMAGE: Record<string, string> = {
  "monsoon-edit": "/images/products/jackets/jackets-white-denim-casual-1.webp",
  "long-road-no-rush": "/images/products/jackets/jackets-beige-leather-cafe-1.webp",
  "track-day-ready": "/images/products/boots/boots-red-alpinestars-smx-1.webp",
  "city-commuter-essentials": "/images/products/helmets/helmets-black-red-agvt-1.webp",
};

export function collectionImageFor(slug: string, fallback?: string | null): string {
  // Same rule as categories: the curated real photo wins over stored demo paths.
  if (COLLECTION_IMAGE[slug]) return COLLECTION_IMAGE[slug];
  if (fallback && !fallback.includes("coming-soon") && !fallback.includes("placeholder") && !fallback.includes("/media/demo/")) return fallback;
  return PLACEHOLDER_IMAGE;
}
