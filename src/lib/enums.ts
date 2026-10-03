/**
 * Domain enums.
 *
 * The Prisma schema is kept portable across SQLite and PostgreSQL, so it stores
 * these values as `String`. These `as const` unions give us the same
 * compile-time safety a database enum would, and `is*` guards narrow untrusted
 * input (form posts, route params) before it reaches a query.
 */

// ── Users ────────────────────────────────────────────────────────────────────

export const USER_ROLES = ["CUSTOMER", "ADMIN", "STAFF"] as const;
export type UserRole = (typeof USER_ROLES)[number];
export const isUserRole = (value: string): value is UserRole =>
  (USER_ROLES as readonly string[]).includes(value);

// ── Orders ───────────────────────────────────────────────────────────────────

export const ORDER_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "PACKED",
  "SHIPPED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];
export const isOrderStatus = (value: string): value is OrderStatus =>
  (ORDER_STATUSES as readonly string[]).includes(value);

/** Linear happy path used for the customer-facing status timeline. */
export const ORDER_PROGRESS: readonly OrderStatus[] = [
  "CONFIRMED",
  "PROCESSING",
  "PACKED",
  "SHIPPED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
];

/** Presentation metadata for the order timeline. */
export const ORDER_STATUS_META: Record<
  OrderStatus,
  { label: string; description: string; tone: "neutral" | "info" | "success" | "warning" | "danger" }
> = {
  PENDING: {
    label: "Pending",
    description: "Waiting for payment confirmation.",
    tone: "warning",
  },
  CONFIRMED: {
    label: "Confirmed",
    description: "Payment received and your order is confirmed.",
    tone: "info",
  },
  PROCESSING: {
    label: "Processing",
    description: "Our team is picking and quality-checking your gear.",
    tone: "info",
  },
  PACKED: {
    label: "Packed",
    description: "Your order is packed and awaiting pickup.",
    tone: "info",
  },
  SHIPPED: {
    label: "Shipped",
    description: "On the way to you.",
    tone: "info",
  },
  OUT_FOR_DELIVERY: {
    label: "Out for delivery",
    description: "Out for delivery today.",
    tone: "info",
  },
  DELIVERED: {
    label: "Delivered",
    description: "Delivered. We hope you ride well.",
    tone: "success",
  },
  CANCELLED: {
    label: "Cancelled",
    description: "This order was cancelled.",
    tone: "danger",
  },
  REFUNDED: {
    label: "Refunded",
    description: "This order was refunded.",
    tone: "danger",
  },
};

export const ORDER_STATUS_OPTIONS = ORDER_STATUSES.map((status) => ({
  value: status,
  label: ORDER_STATUS_META[status].label,
}));

// ── Payments ─────────────────────────────────────────────────────────────────

export const PAYMENT_STATUSES = ["PENDING", "PAID", "FAILED", "REFUNDED", "CAPTURED"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];
export const isPaymentStatus = (value: string): value is PaymentStatus =>
  (PAYMENT_STATUSES as readonly string[]).includes(value);

// ── Catalog ──────────────────────────────────────────────────────────────────

export const PRODUCT_BADGES = ["NEW", "BESTSELLER", "SALE", "LIMITED", "OUT_OF_STOCK"] as const;
export type ProductBadge = (typeof PRODUCT_BADGES)[number];

export const SORT_OPTIONS = [
  { value: "featured", label: "Featured" },
  { value: "newest", label: "Newest" },
  { value: "popular", label: "Popular" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "rating", label: "Top Rated" },
] as const;

export type SortOption = (typeof SORT_OPTIONS)[number]["value"];
export const isSortOption = (value: string): value is SortOption =>
  (SORT_OPTIONS as readonly { value: SortOption }[]).some((option) => option.value === value);

// ── Promotions ───────────────────────────────────────────────────────────────

export const DISCOUNT_TYPES = ["PERCENT", "FIXED"] as const;
export type DiscountType = (typeof DISCOUNT_TYPES)[number];
export const isDiscountType = (value: string): value is DiscountType =>
  (DISCOUNT_TYPES as readonly string[]).includes(value);

export const BANNER_THEMES = ["DARK", "LIGHT", "ACCENT"] as const;
export type BannerTheme = (typeof BANNER_THEMES)[number];
export const isBannerTheme = (value: string): value is BannerTheme =>
  (BANNER_THEMES as readonly string[]).includes(value);

export const BANNER_PLACEMENTS = ["HERO", "PROMO", "STRIP", "FOOTER"] as const;
export type BannerPlacement = (typeof BANNER_PLACEMENTS)[number];

// ── Addresses ────────────────────────────────────────────────────────────────

export const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Delhi",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Puducherry",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
] as const;

export const SHIPPING_METHODS = [
  {
    value: "STANDARD",
    label: "Standard Delivery",
    description: "4–7 business days",
    pricePaise: 9900,
  },
  {
    value: "EXPRESS",
    label: "Express Delivery",
    description: "2–3 business days",
    pricePaise: 24900,
  },
] as const;
export type ShippingMethod = (typeof SHIPPING_METHODS)[number]["value"];
export const isShippingMethod = (value: string): value is ShippingMethod =>
  SHIPPING_METHODS.some((method) => method.value === value);

export const FREE_SHIPPING_THRESHOLD_PAISE = 299900;
export const DEFAULT_SHIPPING_PAISE = 9900;
