import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { ProductGrid } from "@/components/product/product-grid";
import { FilterPanel } from "@/components/catalog/filter-panel";
import { MobileFilterDrawer } from "@/components/catalog/mobile-filter-drawer";
import { ActiveFilterChips } from "@/components/catalog/active-filter-chips";
import { ResultsHeader } from "@/components/catalog/results-header";
import { SortSelect } from "@/components/catalog/sort-select";
import { queryProducts } from "@/lib/data/products";
import { parseFilterState, type RawSearchParams } from "@/lib/data/filter-state";
import { ROUTES } from "@/lib/routes";
import { SlidersHorizontal } from "lucide-react";

/**
 * The one catalogue layout.
 *
 * `/shop`, `/search`, `/category/[slug]`, `/collection/[slug]` and
 * `/brand/[slug]` are the same screen with a different scope, so they all render
 * this. One layout means the filter behaviour, the empty state and the paging
 * cannot drift apart between five routes.
 *
 * A collection is resolved to its member product ids first and then filtered
 * client-side of the database query, because a collection is an editorial
 * membership rather than an attribute — `queryProducts` has no column for it.
 */
const first = (value: string | string[] | undefined): string | undefined => {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw?.trim() || undefined;
};

const normalizeTerm = (value: string | string[] | undefined): string | undefined =>
  first(value);

export type CatalogScope =
  | { kind: "all" }
  | { kind: "category"; slug: string; label: string }
  | { kind: "brand"; slug: string; label: string }
  | { kind: "collection"; label: string; productIds: string[] }
  | { kind: "search"; label: string };

export async function CatalogView({
  basePath,
  searchParams,
  scope,
  breadcrumbs,
}: {
  basePath: string;
  searchParams: RawSearchParams;
  scope: CatalogScope;
  breadcrumbs: { label: string; href?: string }[];
}) {
  const overrides =
    scope.kind === "category"
      ? { category: scope.slug }
      : scope.kind === "brand"
        ? { brand: [scope.slug] }
        : scope.kind === "collection"
          ? { productIds: scope.productIds }
          : scope.kind === "search"
            ? { search: normalizeTerm(searchParams.q) }
            : {};

  const state = parseFilterState(searchParams, overrides);
  const result = await queryProducts(state);

  const products = result.products;
  const total = result.total;
  const title =
    scope.kind === "search"
      ? `Results for “${scope.label}”`
      : scope.kind === "all"
        ? "All gear"
        : scope.label;

  const activeCount = result.appliedFilters.length;

  return (
    <div className="container-page py-8 sm:py-10">
      <Breadcrumbs items={breadcrumbs} className="mb-6" />

      <div className="flex flex-col gap-6 lg:flex-row lg:gap-10">
        {/* Sidebar. `hidden lg:block` rather than conditional rendering: the
            drawer owns its own copy of the form, and hiding this one keeps it
            out of the tab order and the accessibility tree on small screens. */}
        <aside className="hidden w-64 shrink-0 lg:block">
          <div className="sticky top-32 max-h-[calc(100svh-9rem)] overflow-y-auto pr-2 pb-8">
            <FilterPanel
              basePath={basePath}
              searchParams={searchParams}
              facets={result.facets}
              lockedCategoryLabel={scope.kind === "category" ? scope.label : undefined}
              formId="catalog-filter-form-desktop"
              idPrefix="desk"
            />
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          {/*
            The page title is a real `<h1>` for document structure, but it is
            visually hidden: the breadcrumb already names the section, and a
            second large heading directly above the result count would repeat it.
          */}
          <h1 className="sr-only">{title}</h1>

          <ResultsHeader total={total} page={result.page} perPage={result.perPage}>
            <MobileFilterDrawer
              activeCount={activeCount}
              formId="catalog-filter-form-mobile"
              label="Filters"
            >
              <FilterPanel
                basePath={basePath}
                searchParams={searchParams}
                facets={result.facets}
                lockedCategoryLabel={scope.kind === "category" ? scope.label : undefined}
                formId="catalog-filter-form-mobile"
                idPrefix="mob"
              />
            </MobileFilterDrawer>
          </ResultsHeader>

          <ActiveFilterChips
            basePath={basePath}
            searchParams={searchParams}
            appliedFilters={result.appliedFilters}
          />

          <div className="mt-6 flex flex-col gap-5">
            {products.length === 0 ? (
              <CatalogEmptyState
                title={scope.kind === "search" ? "Nothing matched that" : "Nothing in stock here"}
                detail={
                  activeCount > 0
                    ? "No product matches every filter you have on. Removing one usually brings results back."
                    : scope.kind === "search"
                      ? "Try a shorter word, or browse by category instead."
                      : "This range is being restocked. Try another category, or check back next week."
                }
                clearHref={activeCount > 0 ? `${basePath}?` : ROUTES.shop}
                clearLabel={activeCount > 0 ? "Clear filters" : "Browse all gear"}
              />
            ) : (
              <>
                {/* Sticky filter bar: blurred, sits under the header. */}
                <div className="sticky top-16 z-30 -mx-1 flex items-center justify-between gap-3 border-b border-ink-850 bg-ink-950/80 px-1 py-3 backdrop-blur-[12px] sm:top-[4.5rem]">
                  <p className="hidden items-center gap-2 text-2xs text-ink-500 sm:flex">
                    <SlidersHorizontal aria-hidden="true" className="h-3.5 w-3.5" />
                    {total.toLocaleString("en-IN")} results
                  </p>
                  <SortSelect
                    basePath={basePath}
                    searchParams={searchParams}
                    value={state.sort}
                    className="ml-auto w-full sm:w-56"
                  />
                </div>

                <ProductGrid
                  products={products}
                  tone="dark"
                  priorityCount={4}
                  label={`${title} products`}
                />

                <Pagination
                  basePath={basePath}
                  searchParams={searchParams}
                  page={result.page}
                  totalPages={result.totalPages}
                  className="pt-4"
                />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function CatalogEmptyState({
  title,
  detail,
  clearHref,
  clearLabel,
}: {
  title: string;
  detail: string;
  clearHref: string;
  clearLabel: string;
}) {
  return (
    <EmptyState
      title={title}
      description={detail}
      action={{ href: clearHref, label: clearLabel }}
    />
  );
}