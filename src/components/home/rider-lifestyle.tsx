import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Quote } from "lucide-react";
import { Reveal } from "@/components/ui/reveal";
import { getLqipOrTile } from "@/lib/image-placeholders";
import { ROUTES } from "@/lib/routes";
import type { BannerView } from "@/lib/data/banners";

/**
 * Rider lifestyle.
 *
 * The gear is the product; the ride is the reason to buy it. This is the one
 * band on the page that sells the second thing — a real road, real weather, real
 * distance — using a deliberately offset mosaic rather than an even grid.
 *
 * Layout is a 12-column composition: one tall lead plate, two stacked plates
 * beside it, and a pull-quote in the last cell. Asymmetry is the point; a
 * uniform three-up grid here would read as three more promotional tiles and the
 * section would lose its distinct purpose.
 *
 * Sourced from promo banners rather than collections, deliberately — the
 * collection edits already carry that imagery one section down, and repeating
 * the same three photographs on one page is the fastest way to make a
 * catalogue feel thin.
 *
 * Every frame is sized and cropped for photography rather than product-on-white,
 * so swapping in real rider photography needs new image files at these paths and
 * no structural change.
 */
export function RiderLifestyle({ banners }: { banners: BannerView[] }) {
  // Filter on `image` up front: a banner can legitimately have copy but no
  // artwork, and an `<Image>` cannot be given a null source.
  const plates = banners
    .filter((banner): banner is BannerView & { image: string } => banner.image !== null)
    .slice(0, 3);
  if (plates.length < 3) return null;

  return (
    <section aria-labelledby="lifestyle-title" className="bg-charcoal py-section text-bone-50">
      <div className="container-page">
        <Reveal>
          <p className="label-caps inline-flex items-center gap-2.5 text-flame-400">
            <span aria-hidden="true" className="h-px w-6 bg-flame-500" />
            Rider lifestyle
          </p>

          <h2
            id="lifestyle-title"
            className="mt-3 max-w-3xl text-display-md font-extrabold text-bone-50"
          >
            The road is the point.
            <span className="block text-ink-400">The gear just has to keep up.</span>
          </h2>
        </Reveal>

        <div className="mt-10 grid grid-cols-1 gap-4 sm:mt-12 sm:grid-cols-2 sm:gap-5 lg:grid-cols-12 lg:gap-6">
          {/* Lead plate — full height, left third of the composition. */}
          <Reveal className="lg:col-span-5">
            <LifestylePlate plate={plates[0]} className="h-full min-h-[22rem] lg:min-h-[32rem]" />
          </Reveal>

          {/* Two stacked plates. */}
          <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:col-span-4 lg:grid-rows-2">
            <Reveal delay={0.08}>
              <LifestylePlate plate={plates[1]} className="h-64 sm:h-72 lg:h-full lg:min-h-0" />
            </Reveal>
            <Reveal delay={0.16}>
              <LifestylePlate plate={plates[2]} className="h-64 sm:h-72 lg:h-full lg:min-h-0" />
            </Reveal>
          </div>

          {/* Pull-quote. The only orange text on this section, and it is a mark
              rather than a panel, so it reads as emphasis not advertising. */}
          <Reveal delay={0.24} className="lg:col-span-3">
            <figure className="flex h-full flex-col justify-between gap-8 border border-white/10 bg-ink-950 p-7 lg:p-8">
              <Quote aria-hidden="true" className="h-6 w-6 text-flame-500" />

              <blockquote className="flex flex-col gap-5">
                <p className="font-display text-xl leading-snug font-bold tracking-[-0.02em] text-bone-50 lg:text-2xl">
                  I have ridden 40,000 km in this jacket. It has been rained on, dropped
                  in a river and washed thirty times. It still fits like the day I bought
                  it.
                </p>

                <figcaption className="flex flex-col gap-1 border-t border-white/10 pt-5">
                  <span className="text-xs font-bold tracking-[0.06em] text-bone-50 uppercase">
                    Arjun Mehta
                  </span>
                  <span className="text-2xs tracking-[0.06em] text-ink-400 uppercase">
                    Verified rider — Bengaluru
                  </span>
                </figcaption>
              </blockquote>

              <Link
                href={ROUTES.shop}
                className="group inline-flex items-center gap-2 self-start border-b border-flame-500/40 pb-1 text-2xs font-bold tracking-[0.12em] text-flame-400 uppercase transition-colors duration-200 hover:border-flame-400 hover:text-flame-300"
              >
                Read more reviews
                <ArrowUpRight
                  aria-hidden="true"
                  className="h-3.5 w-3.5 transition-transform duration-300 ease-(--ease-out-expo) group-hover:translate-x-0.5 group-hover:-translate-y-0.5 motion-reduce:group-hover:translate-x-0"
                />
              </Link>
            </figure>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function LifestylePlate({
  plate,
  className,
}: {
  plate: BannerView & { image: string };
  className?: string;
}) {
  return (
    <Link
      href={plate.ctaHref ?? ROUTES.shop}
      className={`group relative block overflow-hidden bg-ink-900 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-flame-500 ${className ?? ""}`}
    >
      <Image
        src={plate.image}
        alt=""
        fill
        sizes="(min-width: 1024px) 40vw, (min-width: 640px) 50vw, 100vw"
        placeholder="blur"
        blurDataURL={getLqipOrTile(plate.image)}
        className="object-cover transition-transform duration-1000 ease-(--ease-out-expo) group-hover:scale-105 motion-reduce:group-hover:scale-100"
      />

      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-t from-ink-950/90 via-ink-950/25 to-transparent"
      />

      <div className="absolute inset-x-0 bottom-0 flex flex-col gap-1.5 p-5 lg:p-6">
        {plate.eyebrow ? (
          <span className="text-2xs font-semibold tracking-[0.12em] text-flame-400 uppercase">
            {plate.eyebrow}
          </span>
        ) : null}
        <span className="font-display text-lg leading-tight font-extrabold tracking-[-0.02em] text-bone-50 lg:text-xl">
          {plate.title}
        </span>
        {plate.subtitle ? (
          <span className="max-w-xs text-xs leading-relaxed text-ink-300">{plate.subtitle}</span>
        ) : null}
      </div>
    </Link>
  );
}