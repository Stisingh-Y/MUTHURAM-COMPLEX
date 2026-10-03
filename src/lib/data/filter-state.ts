import { isSortOption, type SortOption } from "@/lib/enums";
import { buildQuery } from "@/lib/utils";

/**
 * URL ⇄ filter-state translation for every catalogue page.
 *
 * Deliberately free of `server-only` so the same helpers can run in the Server
 * Components that read a query and in the small Client Components that rewrite
 * it — one definition of the query-string contract, no drift between the two
 * ends.
 *
 * Filters live in the query string rather than in React state, which means a
 * filtered view is a real, shareable, back-button-safe URL. The filter form is
 * therefore a plain GET form: it works with JavaScript disabled, and the client
 * script only makes it submit faster.
 */

export type ProductFilterState = {
  category?: string;
  brand?: string[];
  size?: string[];
  color?: string[];
  minPricePaise?: number;
  maxPricePaise?: number;
  rating?: number;
  inStockOnly?: boolean;
  discountOnly?: boolean;
  search?: string;
  /**
   * Restrict to an explicit set of product ids — used by collection pages, where
   * membership is editorial rather than an attribute of the product. Set by a
   * page, never parsed from the query string.
   */
  productIds?: string[];
  sort: SortOption;
  page: number;
  perPage: number;
};

export type RawSearchParams = Record<string, string | string[] | undefined>;

export const PER_PAGE = 24;

/** Query-string keys this module owns. Anything else passes through untouched. */
export const QUERY_KEYS = [
  "q",
  "category",
  "brand",
  "size",
  "color",
  "minPrice",
  "maxPrice",
  "rating",
  "stock",
  "sale",
  "sort",
  "page",
] as const;

const MULTI_KEYS = new Set(["brand", "size", "color"]);

/** Sort value that is already the default — never written to the URL. */
export const DEFAULT_SORT: SortOption = "featured";

const toArray = (value: string | string[] | undefined): string[] => {
  if (value === undefined) return [];
  return (Array.isArray(value) ? value : [value]).map((entry) => entry.trim()).filter(Boolean);
};

/** Parse a positive integer, ignoring anything absurd or non-numeric. */
const toInt = (value: string | string[] | undefined, max: number): number | undefined => {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw === undefined || raw.trim() === "") return undefined;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed < 1 || parsed > max) return undefined;
  return parsed;
};

const toFlag = (value: string | string[] | undefined): boolean => {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw === "1" || raw === "true";
};

/**
 * Read a query string into a filter state.
 *
 * `overrides` let a page pin values that are not in the URL — a category page
 * always filters to its own category, a collection page to its own membership —
 * so a hand-edited URL cannot widen the scope.
 */
export function parseFilterState(
  searchParams: RawSearchParams,
  overrides: Partial<ProductFilterState> = {},
): ProductFilterState {
  const sortRaw = Array.isArray(searchParams.sort) ? searchParams.sort[0] : searchParams.sort;
  const q = (Array.isArray(searchParams.q) ? searchParams.q[0] : searchParams.q)?.trim();
  const rating = toInt(searchParams.rating, 5);
  const minPrice = toInt(searchParams.minPrice, 1_000_000);
  const maxPrice = toInt(searchParams.maxPrice, 1_000_000);

  const base: ProductFilterState = {
    category: first(searchParams.category),
    brand: toArray(searchParams.brand),
    size: toArray(searchParams.size),
    color: toArray(searchParams.color),
    minPricePaise: minPrice === undefined ? undefined : minPrice * 100,
    maxPricePaise: maxPrice === undefined ? undefined : maxPrice * 100,
    rating: rating && rating <= 5 ? rating : undefined,
    inStockOnly: toFlag(searchParams.stock),
    discountOnly: toFlag(searchParams.sale),
    search: q ? q : undefined,
    sort: sortRaw && isSortOption(sortRaw) ? sortRaw : DEFAULT_SORT,
    page: toInt(searchParams.page, 10_000) ?? 1,
    perPage: PER_PAGE,
  };

  return { ...base, ...overrides };
}

const first = (value: string | string[] | undefined): string | undefined => {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw?.trim() || undefined;
};

/** The subset of a raw query this module manages, ready for `buildQuery`. */
function ownedParams(searchParams: RawSearchParams): Record<string, string | string[] | undefined> {
  const owned: Record<string, string | string[] | undefined> = {};
  for (const key of QUERY_KEYS) {
    const value = searchParams[key];
    if (value !== undefined) owned[key] = value;
  }
  return owned;
}

/** Params we do not own, preserved across every filter edit. */
function foreignParams(searchParams: RawSearchParams): Record<string, string | string[] | undefined> {
  const foreign: Record<string, string | string[] | undefined> = {};
  for (const [key, value] of Object.entries(searchParams)) {
    if (!QUERY_KEYS.includes(key as (typeof QUERY_KEYS)[number]) && value !== undefined) {
      foreign[key] = value;
    }
  }
  return foreign;
}

function href(
  basePath: string,
  searchParams: RawSearchParams,
  overrides: Record<string, string | string[] | number | undefined | null>,
): string {
  return buildQuery({ ...foreignParams(searchParams), ...ownedParams(searchParams) }, overrides);
}

/**
 * Toggle one value of a multi-select filter, and always return to page 1.
 *
 * Staying on page 4 after narrowing the result set is the classic way to land a
 * shopper on an "out of range" empty page, so any filter change resets paging.
 */
export function toggleFilterHref(
  basePath: string,
  searchParams: RawSearchParams,
  key: string,
  value: string,
): string {
  const current = toArray(searchParams[key]);
  const next = current.includes(value)
    ? current.filter((entry) => entry !== value)
    : [...current, value];

  return href(basePath, searchParams, { [key]: next, page: null });
}

/** Force a single-select filter to a value (or clear it with `null`). */
export function setFilterHref(
  basePath: string,
  searchParams: RawSearchParams,
  key: string,
  value: string | null,
): string {
  return href(basePath, searchParams, { [key]: value, page: null });
}

/**
 * Change sort order.
 *
 * A rider who sorted by price on page 3 almost never wants page 3 of a different
 * ordering, so paging resets too.
 */
export function setSortHref(basePath: string, searchParams: RawSearchParams, sort: SortOption): string {
  return href(basePath, searchParams, {
    sort: sort === DEFAULT_SORT ? null : sort,
    page: null,
  });
}

/**
 * Remove one applied filter.
 *
 * `key` comes from `AppliedFilter`, which groups both ends of the price range
 * under `price` and labels the flags `stock` / `sale`, so those need mapping
 * back onto the actual query keys.
 */
export function removeFilterHref(
  basePath: string,
  searchParams: RawSearchParams,
  key: string,
  value: string,
): string {
  switch (key) {
    case "price":
      return href(basePath, searchParams, { minPrice: null, maxPrice: null, page: null });
    case "stock":
      return href(basePath, searchParams, { stock: null, page: null });
    case "discount":
      return href(basePath, searchParams, { sale: null, page: null });
    case "q":
      return href(basePath, searchParams, { q: null, page: null });
    case "category":
      return href(basePath, searchParams, { category: null, page: null });
    case "rating":
      return href(basePath, searchParams, { rating: null, page: null });
    default:
      if (!MULTI_KEYS.has(key)) return href(basePath, searchParams, { page: null });
      return toggleFilterHref(basePath, searchParams, key, value);
  }
}

/** Clear every filter but keep the search term and the current sort. */
export function clearFiltersHref(basePath: string, searchParams: RawSearchParams): string {
  return href(basePath, searchParams, {
    category: null,
    brand: null,
    size: null,
    color: null,
    minPrice: null,
    maxPrice: null,
    rating: null,
    stock: null,
    sale: null,
    page: null,
  });
}

/** Move to another page, preserving every filter. */
export function pageHref(
  basePath: string,
  searchParams: RawSearchParams,
  page: number,
): string {
  return href(basePath, searchParams, { page: page <= 1 ? null : page });
}

/** True when anything other than sort and page is narrowing the result set. */
export function hasActiveFilters(searchParams: RawSearchParams): boolean {
  return (
    Boolean(first(searchParams.q) ?? first(searchParams.category) ?? first(searchParams.rating)) ||
    toFlag(searchParams.stock) ||
    toFlag(searchParams.sale) ||
    toInt(searchParams.minPrice, 1_000_000) !== undefined ||
    toInt(searchParams.maxPrice, 1_000_000) !== undefined ||
    QUERY_KEYS.some(
      (key) => MULTI_KEYS.has(key) && toArray(searchParams[key]).length > 0,
    )
  );
}