import placeholders from "@/generated/image-placeholders.json";

/**
 * Low-quality image placeholders (LQIP).
 *
 * Every art-directed JPEG under `public/media` is downscaled to 20px and encoded
 * as a data URI by `npm run images:generate`. Shipping that inline lets
 * `next/image` paint a blurred, correctly-hued version of the real frame the
 * instant the box is laid out — no grey flash, no layout shift, and no extra
 * network request because the bytes are already in the bundle.
 *
 * Safe on both sides of the boundary: this module has no `server-only` import,
 * so client components can look up placeholders too.
 */

const LQIP: Record<string, string> = placeholders;

/** Fallback tile for artwork we have no generated placeholder for. */
const NEUTRAL_TILE =
  "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='4'%3E%3Crect width='4' height='4' fill='%23141617'/%3E%3C/svg%3E";

/** Strip origin/query so CDN and absolute URLs resolve against the manifest. */
function normalizeKey(url: string): string {
  if (!url) return "";
  if (url.startsWith("data:")) return url;

  let key = url;
  try {
    if (url.startsWith("http://") || url.startsWith("https://")) {
      key = new URL(url).pathname;
    }
  } catch {
    /* Fall through and use the raw value. */
  }

  key = key.replace(/^\/+/, "/");
  const queryIndex = key.search(/[?#]/);
  if (queryIndex !== -1) key = key.slice(0, queryIndex);
  return key;
}

/**
 * Resolve the blur placeholder for an image URL.
 *
 * Returns `undefined` for unknown sources so callers can fall back to
 * `placeholder="empty"` rather than rendering a placeholder of the wrong colour.
 */
export function getLqip(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  const key = normalizeKey(url);
  if (!key) return undefined;
  return LQIP[key];
}

/** `getLqip` with a neutral tile instead of `undefined`. */
export function getLqipOrTile(url: string | null | undefined): string {
  return getLqip(url) ?? NEUTRAL_TILE;
}

/** How many generated placeholders are available — used by the image verifier. */
export function lqipCount(): number {
  return Object.keys(LQIP).length;
}