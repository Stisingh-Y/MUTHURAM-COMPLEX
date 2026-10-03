import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowUpRight } from "lucide-react";
import { SectionHeading } from "@/components/ui/section-heading";
import { ButtonLink } from "@/components/ui/button";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { getBrands } from "@/lib/data/products";
import { getLqipOrTile } from "@/lib/image-placeholders";
import { ROUTES } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Brands we stock",
  description:
    "Every brand we stock, from road-race helmet makers to touring armour specialists. Honest notes on what each one is actually good for.",
  alternates: { canonical: ROUTES.brands },
};

export default async function BrandsPage() {
  const brands = await getBrands();

  return (
    <>
      <PageHeader count={brands.length} />

      <section className="bg-bone-50 py-section text-ink-950">
        <div className="container-page">
          {brands.length === 0 ? (
            <p className="text-sm text-ink-600">
              No brands are listed yet. Check back shortly.
            </p>
          ) : (
            <ul className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 sm:gap-x-5 lg:grid-cols-4 lg:gap-x-6 lg:gap-y-12">
              {brands.map((brand) => (
                <li key={brand.id}>
                  <Link
                    href={ROUTES.brand(brand.slug)}
                    className="group flex flex-col focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-flame-600"
                  >
                    {/* Logo plate. Square corners, generous whitespace — a logo
                        needs air around it far more than it needs a container. */}
                    <div className="relative flex aspect-3/2 items-center justify-center overflow-hidden bg-white p-7">
                      {brand.logo ? (
                        <Image
                          src={brand.logo}
                          alt={brand.name}
                          fill
                          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 46vw"
                          placeholder="blur"
                          blurDataURL={getLqipOrTile(brand.logo)}
                          className="object-contain p-7 opacity-70 grayscale transition-all duration-500 ease-(--ease-out-expo) group-hover:scale-105 group-hover:opacity-100 group-hover:grayscale-0 motion-reduce:group-hover:scale-100"
                        />
                      ) : (
                        <span className="font-display text-xl leading-tight font-extrabold tracking-[-0.02em] text-ink-950/45">
                          {brand.name}
                        </span>
                      )}

                      <span
                        aria-hidden="true"
                        className="absolute inset-0 bg-ink-950 opacity-0 transition-opacity duration-400 group-hover:opacity-100"
                      />
                      <span
                        aria-hidden="true"
                        className="absolute bottom-3 right-3 translate-y-1 text-2xs font-semibold tracking-[0.1em] text-flame-500 uppercase opacity-0 transition-all duration-300 ease-(--ease-out-expo) group-hover:translate-y-0 group-hover:opacity-100"
                      >
                        View
                      </span>
                    </div>

                    <div className="mt-4 flex items-baseline justify-between gap-3 border-t border-ink-950/12 pt-3">
                      <h2 className="font-display text-base font-bold tracking-[-0.01em] text-ink-950 transition-colors duration-200 group-hover:text-flame-600">
                        {brand.name}
                      </h2>
                      <span className="shrink-0 text-2xs tracking-[0.08em] text-ink-400 uppercase tabular-nums">
                        {brand.productCount}
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </>
  );
}

function PageHeader({ count }: { count: number }) {
  return (
    <header className="relative overflow-hidden bg-ink-950">
      <div className="bg-grid absolute inset-0 opacity-35" aria-hidden="true" />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/70 to-ink-950/40"
      />
      <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-px bg-flame-500/40" />

      <div className="container-page relative py-12 sm:py-14 lg:py-18">
        <Breadcrumbs
          className="mb-8"
          items={[{ label: "Home", href: ROUTES.home }, { label: "Brands" }]}
        />

        <SectionHeading
          eyebrow={`${count} ${count === 1 ? "brand" : "brands"}`}
          title="Brands we stock"
          description="We carry a deliberately short list. Every maker here has been worn on our own bikes, and every one we could not vouch for was left out."
          action={
            <ButtonLink href={ROUTES.shop} variant="outline" size="lg">
              Browse all products
              <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
            </ButtonLink>
          }
        />
      </div>
    </header>
  );
}