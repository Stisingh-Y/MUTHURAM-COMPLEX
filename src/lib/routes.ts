/**
 * Every internal route the app links to.
 *
 * Centralising them means a path rename is a single edit, and it gives server
 * actions a trusted set of redirect targets instead of hand-written strings.
 */

export const ROUTES = {
  home: "/",

  shop: "/shop",
  search: "/search",

  category: (slug: string) => `/category/${slug}`,
  brands: "/brands",
  brand: (slug: string) => `/brand/${slug}`,
  collection: (slug: string) => `/collections/${slug}`,
  product: (slug: string) => `/product/${slug}`,

  cart: "/cart",
  wishlist: "/wishlist",

  checkout: {
    start: "/checkout",
    success: "/checkout/success",
  },

  account: {
    overview: "/account",
    orders: "/account/orders",
    order: (id: string) => `/account/orders/${id}`,
    addresses: "/account/addresses",
    profile: "/account/profile",
    wishlist: "/wishlist",
  },

  auth: {
    login: "/login",
    register: "/register",
    forgotPassword: "/forgot-password",
    resetPassword: "/reset-password",
  },

  content: {
    about: "/about",
    contact: "/contact",
    faq: "/faq",
    shipping: "/shipping",
    returns: "/returns",
    warranty: "/warranty",
    privacy: "/privacy",
    terms: "/terms",
  },

  admin: {
    dashboard: "/admin",
    products: "/admin/products",
    orders: "/admin/orders",
    customers: "/admin/customers",
    inventory: "/admin/inventory",
  },
} as const;

/** Auth screens a `?next=` value must never bounce back to. */
const AUTH_PATHS = [
  ROUTES.auth.login,
  ROUTES.auth.register,
  ROUTES.auth.forgotPassword,
  ROUTES.auth.resetPassword,
];

/**
 * Validate a `?next=` query value for use in a redirect.
 *
 * An unvalidated `next` is an open redirect: `?next=https://evil.test` or
 * `?next=//evil.test` would send a rider off-site right after authenticating,
 * which is the exact moment they are most likely to trust the link. Only
 * single-slash absolute paths, free of control characters and backslashes, and
 * not pointing back at an auth screen, are allowed through.
 */
export function safeNext(raw: string | null | undefined, fallback: string): string {
  if (!raw) return fallback;
  if (!raw.startsWith("/") || raw.startsWith("//")) return fallback;
  if (raw.includes("\\")) return fallback;
  if (/[\x00-\x1F]/.test(raw)) return fallback;
  if (AUTH_PATHS.some((path) => raw === path || raw.startsWith(`${path}?`))) return fallback;
  return raw;
}