import Link from "next/link";
import { Star } from "lucide-react";
import { cn, formatMoney } from "@/lib/utils";
import { FilterAutoSubmit } from "@/components/catalog/filter-auto-submit";
import { clearFiltersHref, hasActiveFilters, QUERY_KEYS, type RawSearchParams } from "@/lib/data/filter-state";
import type { FacetValue, ProductQueryResult } from "@/lib/data/products";

/**
 * Catalogue filters.
 *
 * A plain `<form method="get">`: the result set lives entirely in the query
 * string, so filtering works with JavaScript disabled and every filtered view
 * has a URL a rider can bookmark or send to a friend. A small client script
 * elsewhere on the page turns it into an instant submit, but nothing here
 * depends on that.
 *
 * Two details worth knowing:
 *
 *  - No hidden `page` input. Unchecked boxes are simply absent from the
 *    submission, so removing a filter works by omission, and because `page` is
 *    never carried over, narrowing the set always lands on page 1.
 *  - `q` and `sort` are preserved as hidden fields, so filtering never silently
 *    discards the search term or the chosen ordering.
 */

type Facets = ProductQueryResult["facets"];

export function FilterPanel({
  basePath,
  searchParams,
  facets,
  lockedCategoryLabel,
  formId = "catalog-filter-form",
  idPrefix = "f",
  className,
}: {
  basePath: string;
  searchParams: RawSearchParams;
  facets: Facets;
  lockedCategoryLabel?: string;
  /**
   * Rendered twice on purpose — once in the desktop sidebar, once inside the
   * mobile drawer — so the control ids must be namespaced per instance to stay
   * unique in the document.
   */
  formId?: string;
  idPrefix?: string;
  className?: string;
}) {
  const selected = {
    brands: toSet(searchParams.brand),
    sizes: toSet(searchParams.size),
    colors: toSet(searchParams.color),
    rating: single(searchParams.rating),
    stock: flag(searchParams.stock),
    sale: flag(searchParams.sale),
    minPrice: single(searchParams.minPrice),
    maxPrice: single(searchParams.maxPrice),
  };

  const minRupees = Math.floor(facets.priceRange.minPaise / 100);
  const maxRupees = Math.ceil(facets.priceRange.maxPaise / 100);
  const active = hasActiveFilters(searchParams);

  return (
    <form
      method="get"
      action={basePath}
      id={formId}
      data-filter-form={formId}
      className={cn("flex flex-col gap-7", className)}
    >
      <PreservedFields searchParams={searchParams} />
      <FilterAutoSubmit />

<header className="flex items-baseline justify-between gap-3 border-b border-ink-800 pb-4">
        <h2 className="font-display text-base font-extrabold tracking-[-0.015em] text-bone-50">
          Refine
        </h2>
        {active ? (
          <Link
            href={clearFiltersHref(basePath, searchParams)}
            className="text-2xs font-semibold uppercase tracking-[0.08em] text-ink-400 underline-offset-4 transition-colors hover:text-flame-400 hover:underline"
          >
            Clear all
          </Link>
        ) : null}
      </header>

      {lockedCategoryLabel ? (
        <Group label="Category">
          <p className="flex items-center justify-between gap-2 rounded-xs border border-flame-500/30 bg-flame-500/8 px-3 py-2 text-sm text-bone-50">
            {lockedCategoryLabel}
            <span className="text-2xs text-ink-400">fixed</span>
          </p>
        </Group>
      ) : (
        <Group label="Category">
          <RadioRow
            name="category"
            value=""
            label="All categories"
            count={sumCount(facets.categories)}
            defaultChecked={!single(searchParams.category)} idPrefix={idPrefix} />
          {facets.categories.map((facet) => (
            <RadioRow
              key={facet.value}
              name="category"
              value={facet.value}
              label={facet.label}
              count={facet.count}
              defaultChecked={single(searchParams.category) === facet.value} idPrefix={idPrefix} />
          ))}
        </Group>
      )}

      <Group label="Brand">
        {facets.brands.map((facet) => (
          <CheckRow
            key={facet.value}
            name="brand"
            value={facet.value}
            label={facet.label}
            count={facet.count}
            defaultChecked={selected.brands.has(facet.value)} idPrefix={idPrefix} />
        ))}
      </Group>

      <Group label="Size">
        <div className="flex flex-wrap gap-1.5">
          {facets.sizes.map((facet) => {
            const isOn = selected.sizes.has(facet.value);
            return (
              <label
                key={facet.value}
                className={cn(
                  "cursor-pointer rounded-xs border px-2.5 py-1.5 text-2xs font-semibold transition-colors duration-200",
                  "focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-flame-500",
                  isOn
                    ? "border-flame-500 bg-flame-500/12 text-flame-300"
                    : "border-ink-700 text-ink-300 hover:border-ink-600 hover:text-bone-50",
                )}
              >
                <input
                  type="checkbox"
                  name="size"
                  value={facet.value}
                  defaultChecked={isOn}
                  className="sr-only"
                />
                {facet.label}
                <span className="ml-1 text-ink-600 tabular-nums">{facet.count}</span>
              </label>
            );
          })}
        </div>
      </Group>

      {facets.colors.length > 0 ? (
        <Group label="Colour">
          <div className="flex flex-wrap gap-1.5">
            {facets.colors.map((facet) => {
              const isOn = selected.colors.has(facet.value);
              return (
                <label
                  key={facet.value}
                  className={cn(
                    "cursor-pointer rounded-xs border px-2.5 py-1.5 text-2xs font-semibold transition-colors duration-200",
                    "focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-flame-500",
                    isOn
                      ? "border-flame-500 bg-flame-500/12 text-flame-300"
                      : "border-ink-700 text-ink-300 hover:border-ink-600 hover:text-bone-50",
                  )}
                >
                  <input
                    type="checkbox"
                    name="color"
                    value={facet.value}
                    defaultChecked={isOn}
                    className="sr-only"
                  />
                  {facet.label}
                  <span className="ml-1 text-ink-600 tabular-nums">{facet.count}</span>
                </label>
              );
            })}
          </div>
        </Group>
      ) : null}

      <Group label="Price">
        <div className="flex items-center gap-2">
          <PriceInput
            id={`${idPrefix}-min-price`}
            name="minPrice"
            placeholder={String(minRupees)}
            defaultValue={selected.minPrice}
          />
          <span aria-hidden="true" className="text-2xs text-ink-500">
            to
          </span>
          <PriceInput
            id={`${idPrefix}-max-price`}
            name="maxPrice"
            placeholder={String(maxRupees)}
            defaultValue={selected.maxPrice}
          />
        </div>
        <p className="mt-2 text-2xs text-ink-500">
          Catalogue runs {formatMoney(facets.priceRange.minPaise)} –{" "}
          {formatMoney(facets.priceRange.maxPaise)}.
        </p>
      </Group>

      <Group label="Rating">
        {[4, 3, 2].map((rating) => (
          <RadioRow
            key={rating}
            name="rating"
            value={String(rating)}
            label={`${rating}★ & up`}
            count={undefined}
            defaultChecked={selected.rating === String(rating)}
            idPrefix={idPrefix}
            icon
          />
        ))}
      </Group>

      <Group label="Availability">
        <CheckRow
          name="stock"
          value="1"
          label="In stock only"
          count={undefined}
          defaultChecked={selected.stock} idPrefix={idPrefix} />
        {facets.maxDiscount > 0 ? (
          <CheckRow
            name="sale"
            value="1"
            label={`On sale (up to ${facets.maxDiscount}% off)`}
            count={undefined}
            defaultChecked={selected.sale} idPrefix={idPrefix} />
        ) : null}
      </Group>

      {/* The desktop sidebar has no Apply button — this submits immediately so
          the form is equally usable either way. On mobile the drawer footer
          renders the explicit control. */}
      <noscript>
        <button
          type="submit"
          className="w-full rounded-sm bg-flame-500 px-5 py-3 text-2xs font-bold uppercase tracking-[0.1em] text-ink-950"
        >
          Apply filters
        </button>
      </noscript>
    </form>
  );
}

// ── Pieces ────────────────────────────────────────────────────────────────────

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-2.5">
      <legend className="label-caps mb-0.5 text-bone-50">{label}</legend>
      {children}
    </fieldset>
  );
}

const inputClasses = [
  "mt-0.5 h-4 w-4 shrink-0 cursor-pointer appearance-none rounded-xs",
  "border border-ink-600 bg-ink-900",
  "checked:border-flame-500 checked:bg-flame-500",
  "bg-[length:11px] bg-center bg-no-repeat",
  "checked:bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 12 12%22><path d=%22M1.5 6.2l3 3L10.5 3%22 fill=%22none%22 stroke=%22%2308090a%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22/></svg>')]",
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flame-500",
].join(" ");

function CheckRow({
  name,
  value,
  label,
  count,
  defaultChecked,
  idPrefix,
}: {
  name: string;
  value: string;
  label: string;
  count?: number;
  defaultChecked: boolean;
  idPrefix: string;
}) {
  const id = `${idPrefix}-${name}-${value}`;
  return (
    <div className="flex items-center gap-2.5">
      <input id={id} name={name} type="checkbox" value={value} defaultChecked={defaultChecked} className={inputClasses} />
      <label htmlFor={id} className="flex flex-1 cursor-pointer items-baseline justify-between gap-2 text-sm text-ink-200 transition-colors hover:text-bone-50">
        {label}
        {count === undefined ? null : (
          <span className="text-2xs text-ink-500 tabular-nums">{count}</span>
        )}
      </label>
    </div>
  );
}

function RadioRow({
  name,
  value,
  label,
  count,
  defaultChecked,
  icon = false,
  idPrefix,
}: {
  name: string;
  value: string;
  label: string;
  count?: number;
  defaultChecked: boolean;
  icon?: boolean;
  idPrefix: string;
}) {
  const id = `${idPrefix}-${name}-${value || "any"}`;
  return (
    <div className="flex items-center gap-2.5">
      <input
        id={id}
        name={name}
        type="radio"
        value={value}
        defaultChecked={defaultChecked}
        className={[
          inputClasses,
          "rounded-full",
          "checked:bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 12 12%22><circle cx=%226%22 cy=%226%22 r=%223%22 fill=%22%2308090a%22/></svg>')]",
        ].join(" ")}
      />
      <label
        htmlFor={id}
        className="flex flex-1 cursor-pointer items-center gap-1.5 text-sm text-ink-200 transition-colors hover:text-bone-50"
      >
        {icon ? <Star aria-hidden="true" className="h-3.5 w-3.5 text-flame-500" /> : null}
        {label}
        {count === undefined ? null : (
          <span className="ml-auto text-2xs text-ink-500 tabular-nums">{count}</span>
        )}
      </label>
    </div>
  );
}

function PriceInput({
  id,
  name,
  placeholder,
  defaultValue,
}: {
  id: string;
  name: string;
  placeholder: string;
  defaultValue?: string;
}) {
  return (
    <>
      <label htmlFor={id} className="sr-only">
        {name === "minPrice" ? "Minimum price in rupees" : "Maximum price in rupees"}
      </label>
      <input
        id={id}
        name={name}
        type="number"
        inputMode="numeric"
        min={0}
        step={100}
        placeholder={placeholder}
        defaultValue={defaultValue}
        className="w-full rounded-sm border border-ink-700 bg-ink-900 px-2.5 py-2 text-2xs text-bone-50 transition-colors duration-200 placeholder:text-ink-600 hover:border-ink-600 focus:border-flame-500 focus:outline-none focus:ring-2 focus:ring-flame-500/35"
      />
    </>
  );
}

/**
 * Hidden inputs carrying everything this form does not render itself.
 *
 * Strictly limited to the search term, the sort order and any parameter this
 * module does not own. Carrying the filter keys here too would double every
 * value — a ticked brand would be submitted once as a hidden field and once by
 * its own checkbox — so they are deliberately left to the controls. `page` is
 * excluded for the opposite reason: any filter change should land on page 1.
 */
function PreservedFields({ searchParams }: { searchParams: RawSearchParams }) {
  const preserved: [string, string][] = [];
  const ours = new Set<string>(QUERY_KEYS);

  for (const [key, raw] of Object.entries(searchParams)) {
    const keep = key === "q" || (!ours.has(key) && key !== "page");
    if (!keep) continue;

    const values = Array.isArray(raw) ? raw : raw === undefined ? [] : [raw];
    for (const value of values) {
      if (value !== "") preserved.push([key, value]);
    }
  }

  const sort = single(searchParams.sort);
  if (sort) preserved.push(["sort", sort]);

  return (
    <>
      {preserved.map(([key, value]) => (
        <input key={`${key}:${value}`} type="hidden" name={key} value={value} />
      ))}
    </>
  );
}

const toSet = (value: string | string[] | undefined): Set<string> =>
  new Set(Array.isArray(value) ? value : value ? [value] : []);

const single = (value: string | string[] | undefined): string | undefined => {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw && raw.trim() !== "" ? raw : undefined;
};

const flag = (value: string | string[] | undefined): boolean => {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw === "1" || raw === "true";
};

const sumCount = (facets: FacetValue[]): number =>
  facets.reduce((total, facet) => total + facet.count, 0);