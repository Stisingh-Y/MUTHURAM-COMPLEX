/**
 * MUTHURAM motion language — single source for timing, easing and variants.
 *
 * Timing: micro 120–180ms, fast 180–250ms, standard 250–400ms,
 * reveal 400–650ms, cinematic 600–900ms. One expo-out easing everywhere;
 * linear/bounce/elastic are never used for UI.
 *
 * Intensity hierarchy: hero + editorial (high) → categories/featured (medium)
 * → cards/buttons/icons/nav (low) → checkout/forms (minimal).
 * Transform + opacity only; reduced-motion is handled at each call site.
 */

export const MOTION_EASE = [0.16, 1, 0.3, 1] as const;

export const MOTION_DURATION = {
  micro: 0.15,
  fast: 0.22,
  standard: 0.32,
  reveal: 0.6,
  cinematic: 0.85,
} as const;

/** Section reveal: container first, then heading → content → actions via delay. */
export const fadeUp = {
  initial: { opacity: 0, y: 24 },
  inView: { opacity: 1, y: 0 },
};

export const fadeIn = {
  initial: { opacity: 0 },
  inView: { opacity: 1 },
};

/** Editorial image reveal: gentle settle, never a fly-in. */
export const imageReveal = {
  initial: { opacity: 0, y: 12, scale: 1.04 },
  inView: { opacity: 1, y: 0, scale: 1 },
};

/** Product card entry: restrained fade + lift, stagger handled by delay. */
export const cardReveal = {
  initial: { opacity: 0, y: 18 },
  inView: { opacity: 1, y: 0 },
};

/** Stagger step for grouped children (cards, accordion rows, badges). */
export const STAGGER_STEP = 0.08;

/** Shared viewport config: enter once, 15% visible, slight bottom margin. */
export const VIEWPORT_ONCE = {
  once: true,
  amount: 0.15,
  margin: "0px 0px -10% 0px",
} as const;
