import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SectionHeading } from "@/components/ui/section-heading";
import { Reveal } from "@/components/ui/reveal";
import { getLqipOrTile } from "@/lib/image-placeholders";
import { ROUTES } from "@/lib/routes";
import type { CollectionView } from "@/lib/data/products";

export function CollectionGrid({ collections }: { collections: CollectionView[] }) {
  if (collections.length === 0) return null;

  return (
    <section aria-labelledby="edits-title" className="bg-warm py-section text-ink-950">
      <div className="container-page">
        <SectionHeading
          id="edits-title"
          tone="light"
          index="04"
          divider
          eyebrow="Curated edits"
          title={<>Pick the trip, we will <span className="sh-hl">pick the gear</span></>}
          description="Assembled by the people who fit it in the shop, for the way Indian riders actually ride."
        />

        {/* Asymmetric: the first edit takes the full row at small sizes and half
            the width on large ones, so the section reads as an editorial spread
            rather than a pair of matching tiles. */}
        <ul className="mt-10 grid gap-4 sm:mt-12 lg:grid-cols-2 lg:gap-5">
          {collections.map((collection, index) => (
            <Reveal as="li" key={collection.id} delay={Math.min(index * 0.06, 0.24)}>
              <Link
                href={ROUTES.collection(collection.slug)}
                className="group relative flex min-h-80 flex-col justify-end overflow-hidden rounded-xs bg-ink-900 p-6 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-flame-600 sm:min-h-96 lg:min-h-[28rem]"
              >
                <Image
                  src={collection.image}
                  alt=""
                  fill
                  sizes="(min-width: 640px) 46vw, 100vw"
                  placeholder="blur"
                  blurDataURL={getLqipOrTile(collection.image)}
                  className="object-cover transition-transform duration-700 ease-(--ease-out-expo) group-hover:scale-105 motion-reduce:group-hover:scale-100"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink-950/95 via-ink-950/60 to-ink-950/10" />

                {/* Orange hairline that draws in from the left on hover. */}
                <span
                  aria-hidden="true"
                  className="absolute inset-x-6 bottom-0 h-px origin-left scale-x-0 bg-flame-500 transition-transform duration-500 ease-(--ease-out-expo) group-hover:scale-x-100 motion-reduce:transition-none"
                />

                <div className="relative flex flex-col gap-2 pb-1">
                  <p className="label-caps text-flame-400">
                    {collection.productCount} {collection.productCount === 1 ? "product" : "products"}
                  </p>
                  <h3 className="max-w-md font-display text-2xl leading-tight font-extrabold tracking-[-0.025em] text-bone-50 sm:text-3xl">
                    {collection.name}
                  </h3>
                  {collection.tagline ? (
                    <p className="max-w-md text-sm leading-relaxed text-ink-300">{collection.tagline}</p>
                  ) : null}

                  <span className="mt-4 inline-flex items-center gap-2 text-2xs font-semibold tracking-[0.12em] text-bone-50 uppercase">
                    Shop this edit
                    <ArrowRight
                      aria-hidden="true"
                      className="h-3.5 w-3.5 transition-transform duration-300 ease-(--ease-out-expo) group-hover:translate-x-1 motion-reduce:group-hover:translate-x-0"
                    />
                  </span>
                </div>
              </Link>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
