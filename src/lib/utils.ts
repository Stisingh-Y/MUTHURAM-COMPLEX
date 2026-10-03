import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge conditional class names, letting later Tailwind utilities win. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * All money in this application is stored and computed as integer paise
 * (1 INR = 100 paise) so totals are exact — no floating point drift between
 * the cart, the coupon engine and the payment gateway.
 */
export function formatMoney(paise: number, options: { compact?: boolean } = {}): string {
  const rupees = paise / 100;

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: options.compact && rupees >= 100000 ? 0 : 2,
    ...(options.compact && rupees >= 100000 ? { notation: "compact" as const } : {}),
  }).format(rupees);
}

/** Bare rupee amount with no symbol, for price annotations. */
export function formatRupees(paise: number): string {
  return new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(paise / 100);
}

export function formatPercent(value: number): string {
  return `${Math.round(value)}%`;
}

export function discountPercent(pricePaise: number, compareAtPaise: number | null | undefined): number | null {
  if (!compareAtPaise || compareAtPaise <= pricePaise) return null;
  return Math.round(((compareAtPaise - pricePaise) / compareAtPaise) * 100);
}

export function formatDate(date: Date | string, style: "short" | "long" = "short"): string {
  const value = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(value.getTime())) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: style === "long" ? "long" : "short",
    year: "numeric",
  }).format(value);
}

export function formatDateTime(date: Date | string): string {
  const value = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(value.getTime())) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);
}

export function formatCompactNumber(value: number): string {
  return new Intl.NumberFormat("en-IN", { notation: "compact", maximumFractionDigits: 1 }).format(
    value,
  );
}

/** Truncate on a word boundary so headlines do not break mid-word. */
export function truncate(value: string, maxLength: number): string {
  if (value.length <= maxLength) return value;
  const clipped = value.slice(0, maxLength);
  const lastSpace = clipped.lastIndexOf(" ");
  return `${(lastSpace > maxLength * 0.6 ? clipped.slice(0, lastSpace) : clipped).trimEnd()}…`;
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}



/** Inclusive array slice used for pagination, tolerant of out-of-range pages. */
export function paginate<T>(items: readonly T[], page: number, perPage: number): T[] {
  const start = Math.max(0, (page - 1) * perPage);
  return items.slice(start, start + perPage);
}

export function buildQuery(
  base: Record<string, string | string[] | undefined>,
  overrides: Record<string, string | string[] | number | undefined | null>,
): string {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries({ ...base, ...overrides })) {
    if (value === undefined || value === null || value === "") continue;
    if (Array.isArray(value)) {
      for (const entry of value) if (entry) params.append(key, entry);
    } else {
      params.set(key, String(value));
    }
  }

  const query = params.toString();
  return query ? `?${query}` : "";
}
