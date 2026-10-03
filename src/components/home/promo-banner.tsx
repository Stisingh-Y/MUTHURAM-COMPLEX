import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { getLqipOrTile } from "@/lib/image-placeholders";
import type { BannerView } from "@/lib/data/banners";

/**
 * Promo banner.
 *
 * Three seeded campaigns land here. Square corners, no border, no shadow — this
 * is a campaign plate, not a widget.
 *
 * On the orange overlay: it is kept because a themed campaign genuinely wants
 * its own surface, but it is deliberately desaturated at the gradient stops
 * (`flame-700/92` → `flame-500/65`) so the photograph still reads through it.
 * A flat opaque orange panel would hide the image entirely and turn the section
 * into three identical orange rectangles.
 */
export function PromoBanner({ banner, className }: { banner: BannerView; className?: string }) {
  if (!banner.image) return null;

  const isAccent = banner.theme === "ACCENT";
  const isLight = banner.theme === "LIGHT";

  return (
    <section aria-label={banner.title} className={cn("relative isolate overflow-hidden rounded-xs", className)}>
      <Image
        src={banner.image}
        alt=""
        fill
        sizes="(min-width: 1024px) 33vw, 100vw"
        placeholder="blur"
        blurDataURL={getLqipOrTile(banner.image)}
        className="object-cover"
      />

      <div
        aria-hidden="true"
        className={cn(
          "absolute inset-0",
          isAccent
            ? "bg-gradient-to-t from-flame-700/92 via-flame-600/80 to-flame-500/65"
            : "bg-gradient-to-t from-ink-950 via-ink-950/72 to-ink-950/25",
        )}
      />

      <div className="relative flex min-h-72 flex-col justify-end gap-3 p-6 sm:min-h-80 sm:p-8">
        {banner.eyebrow ? (
          <p
            className={cn(
              "label-caps",
              isAccent || isLight ? "text-ink-950/70" : "text-flame-400",
            )}
          >
            {banner.eyebrow}
          </p>
        ) : null}

        <h2
          className={cn(
            "max-w-sm font-display text-2xl leading-tight font-extrabold tracking-[-0.025em] sm:text-3xl",
            isAccent || isLight ? "text-ink-950" : "text-bone-50",
          )}
        >
          {banner.title}
        </h2>

        {banner.subtitle ? (
          <p
            className={cn(
              "max-w-sm text-sm leading-relaxed",
              isAccent || isLight ? "text-ink-900/80" : "text-ink-200",
            )}
          >
            {banner.subtitle}
          </p>
        ) : null}

        {banner.ctaLabel && banner.ctaHref ? (
          <Link
            href={banner.ctaHref}
            className={cn(
              "group mt-2 inline-flex w-fit items-center gap-2 rounded-xs px-5 py-3",
              "text-2xs font-bold uppercase tracking-[0.1em]",
              "transition-colors duration-200 active:translate-y-px",
              isAccent || isLight
                ? "bg-ink-950 text-bone-50 hover:bg-ink-900"
                : "bg-flame-500 text-ink-950 hover:bg-flame-400",
            )}
          >
            {banner.ctaLabel}
            <ArrowRight
              aria-hidden="true"
              className="h-3.5 w-3.5 transition-transform duration-300 ease-(--ease-out-expo) group-hover:translate-x-1 motion-reduce:group-hover:translate-x-0"
            />
          </Link>
        ) : null}
      </div>
    </section>
  );
}

/**
 * Promo strip.
 *
 * Renders up to three campaigns side by side, or a single one full width, and
 * renders nothing at all when the database has no live promos.
 */
export function PromoBannerRow({ banners }: { banners: BannerView[] }) {
  const visible = banners.filter((banner) => banner.image).slice(0, 3);
  if (visible.length === 0) return null;

  return (
    <section aria-label="Current offers" className="container-page py-section">
      <div
        className={[
          "grid gap-4 lg:gap-5",
          visible.length === 1 ? "grid-cols-1" : "sm:grid-cols-2",
          visible.length >= 3 ? "lg:grid-cols-3" : "",
        ].join(" ")}
      >
        {visible.map((banner) => (
          <PromoBanner key={banner.id} banner={banner} />
        ))}
      </div>
    </section>
  );
}