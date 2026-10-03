import Link from "next/link";
import { Badge, badgeToneFor } from "@/components/ui/badge";
import { StarRating } from "@/components/ui/star-rating";
import { CardActions } from "@/components/product/card-actions";
import { SafeImage } from "@/components/ui/safe-image";
import { cn, formatMoney } from "@/lib/utils";
import { ROUTES } from "@/lib/routes";
import { getLqipOrTile } from "@/lib/image-placeholders";
import type { ProductCardView } from "@/lib/data/products";

/**
 * Product card.
 *
 * Image-first and borderless. The previous version was a rounded tile with a
 * coloured panel and a badge stack competing for the same corner; this one lets
 * a single large product photograph sit above a type block, with the
 * information ranked the way a rider reads it — what it is, who makes it, what
 * it costs, then the action.
 *
 * Corner radius is `rounded-xs` (2px) throughout. On a grid of 24 items, even a
 * small radius becomes a strong repeating pattern, and the repetition is exactly
 * what makes a catalogue read as a template rather than a shop.
 *
 * Still a Server Component: only `CardActions` is a client island, so a full
 * grid ships one component definition instead of 24 client boundaries.
 *
 * Colour choices worth noting: orange appears only on the add-to-cart control,
 * never on the card surface. Green is reserved for a genuine markdown. Badges
 * are square and left-aligned to a shared edge so a grid of them aligns.
 */
export function ProductCard({
  product,
  className,
  tone,
  priority = false,
  showBadges = true,
  isSaved = false,
}: {
  product: ProductCardView;
  className?: string;
  /** Set on the first row so the largest contentful paint is not deferred. */
  priority?: boolean;
  showBadges?: boolean;
  /** Server-known wishlist state, passed through from the wishlist route. */
  isSaved?: boolean;
  /**
   * Which surface the card sits on. Required rather than defaulted, because the
   * card is borderless — the type colour is all that separates it from the page,
   * so getting this wrong on a light band makes the product name invisible.
   */
  tone: "dark" | "light";
}) {
  const href = ROUTES.product(product.slug);
  const lqip = product.blurDataURL ?? getLqipOrTile(product.image.url);
  const dark = tone === "dark";

  // All surface-dependent colours resolve from these few values, so switching a
  // card between bands is a one-argument change rather than a class audit.
  // Muted grey reads acceptably on both surfaces and is the one tone shared.
  const title = dark ? "text-bone-50" : "text-ink-950";
  const titleHover = dark ? "hover:text-flame-300" : "hover:text-flame-600";
  const placeholderBg = dark ? "bg-ink-850" : "bg-ink-200/60";

  return (
    <article
      className={cn(
        "group relative flex flex-col bg-transparent",
        "transition-transform duration-400 ease-(--ease-out-expo)",
        "hover:-translate-y-1 motion-reduce:hover:translate-y-0",
        "active:scale-[0.98]",
        className,
      )}
    >
      <Link
        href={href}
        className={cn(
          "relative block overflow-hidden rounded-xs focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-flame-500",
          placeholderBg,
        )}
        tabIndex={-1}
        aria-hidden="true"
      >
        {/*
          4:5 portrait. Gear is photographed vertically and the taller frame
          gives the shell more room to read at grid density, where a square crop
          turns a helmet into an unreadable grey shape.
        */}
        <div className="relative aspect-4/5 w-full">
          <SafeImage
            src={product.image.url}
            alt={product.image.alt}
            fill
            sizes="(max-width:768px) 50vw, (max-width:1280px) 33vw, 25vw"
            priority={priority}
            loading={priority ? undefined : "lazy"}
            placeholder="blur"
            blurDataURL={lqip}
            className={cn(
              "object-cover transition-all duration-500 ease-(--ease-out-expo)",
              "[@media(hover:hover)]:group-hover:scale-105",
              product.secondaryImage && "[@media(hover:hover)]:group-hover:opacity-0",
            )}
          />

          {/* Second angle fades in on hover. Opacity only — no scale on the
              primary image, because scaling product photography to make it feel
              responsive makes it visibly soft. */}
          {product.secondaryImage ? (
            <SafeImage
              src={product.secondaryImage.url}
              alt=""
              aria-hidden="true"
              fade={false}
              fill
              sizes="(max-width:768px) 50vw, (max-width:1280px) 33vw, 25vw"
              loading="lazy"
              className="object-cover opacity-0 transition-opacity duration-500 ease-(--ease-out-expo) [@media(hover:hover)]:group-hover:opacity-100"
            />
          ) : null}

          {/* Bottom gradient + Quick View slide-up. `group-hover` never
              fires on touch pointers, so this is desktop-only by nature and
              nothing sticks after a tap. */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink-950/80 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          />
          <span className="absolute inset-x-3 bottom-3 hidden translate-y-3 opacity-0 transition-all duration-300 ease-(--ease-out-expo) group-hover:translate-y-0 group-hover:opacity-100 motion-reduce:group-hover:translate-y-0 [@media(hover:hover)]:block">
            <span className="block rounded-xs bg-bone-50/95 py-2.5 text-center text-2xs font-bold tracking-[0.1em] text-ink-950 uppercase backdrop-blur-sm">
              Quick View
            </span>
          </span>

          {/* Scrim for sold-out only. Always present in a dark band, so the
              "Sold out" label never has to fight the image for contrast. */}
          {!product.isInStock ? (
            <div className="absolute inset-0 flex items-center justify-center bg-ink-950/60 backdrop-blur-[2px]">
              <Badge tone="neutral" className="rounded-xs border-bone-300/40 bg-ink-950/85 text-bone-100">
                Sold out
              </Badge>
            </div>
          ) : null}

          {/* Thin orange edge that appears on hover. A hairline rather than a
              glow: the card should look considered, not powered. */}
          <span
            aria-hidden="true"
            className="absolute inset-0 rounded-xs ring-1 ring-inset ring-transparent transition-[--tw-ring-color] duration-400 group-hover:ring-flame-500/45"
          />
        </div>

        {showBadges && product.badges.length > 0 ? (
          <ul className="absolute top-3 left-3 flex flex-col items-start gap-1.5">
            {product.badges.slice(0, 2).map((badge) => (
              <li key={badge}>
                <Badge tone={badgeToneFor(badge)} className="rounded-xs">
                  {badge === "LIMITED" ? "Only a few left" : badge}
                </Badge>
              </li>
            ))}
          </ul>
        ) : null}

        {/* Markdown sits bottom-right, opposite the badge stack, so the two
            never collide regardless of how many badges there are. */}
        {product.discountPercent ? (
          <span
            className="absolute right-3 bottom-3 inline-flex items-center gap-1 rounded-xs bg-success-500 px-2 py-1 text-2xs font-bold tabular-nums text-ink-950"
            aria-hidden="true"
          >
            −{product.discountPercent}%
          </span>
        ) : null}
      </Link>

      {/* Type block. Vertical flex stack: brand -> name (2-line clamp) -> rating single line -> price. */}
      <div className="flex min-w-0 flex-1 flex-col pt-4">
        <p className="label-caps truncate text-ink-500">{product.brandName}</p>

        <h3 className={cn("mt-1.5 min-w-0 text-sm leading-snug font-semibold", title)}>
          {/* Stretched link: the whole card is the click target, so the heart and
              the button below are the only things that are not. z-index keeps
              the overlay beneath the action row. */}
          <Link
            href={href}
            className={cn("after:absolute after:inset-0 after:z-10 after:content-[''] line-clamp-2", titleHover)}
          >
            {product.name}
          </Link>
        </h3>

        <div className="mt-2 min-w-0">
          <StarRating
            value={product.ratingAverage}
            count={product.ratingCount}
            className="flex-nowrap whitespace-nowrap"
          />
        </div>

        <div className="mt-auto flex flex-wrap items-baseline gap-x-2 gap-y-0.5 pt-3">
          <span className={cn("font-display text-base font-extrabold tabular-nums", title)}>
            {formatMoney(product.pricePaise)}
          </span>
          {product.compareAtPricePaise ? (
            <span className="text-sm tabular-nums text-ink-500 line-through">
              {formatMoney(product.compareAtPricePaise)}
            </span>
          ) : null}
        </div>

        {/* Colour swatches. The row reserves its height even with 0–1 colours
            so price and Add to Cart align across cards in a row. */}
        <div className="mt-2 flex min-h-3 items-center">
          {product.colorOptions.length > 1 ? (
            <ul
              className="flex items-center gap-1.5"
              aria-label={`${product.colorOptions.length} colours available`}
            >
              {product.colorOptions.slice(0, 4).map((color) => (
                <li
                  key={color.name}
                  title={color.name}
                  className="h-3 w-3 rounded-full border border-white/25"
                  style={{ backgroundColor: color.hex }}
                />
              ))}
              {product.colorOptions.length > 4 ? (
                <li className="text-2xs text-ink-500">+{product.colorOptions.length - 4}</li>
              ) : null}
            </ul>
          ) : null}
        </div>

        {/* Above the stretched link, so both controls stay independently
            clickable. */}
        <div className="relative z-20">
          <CardActions
            productId={product.id}
            productName={product.name}
            isInStock={product.isInStock}
            initialSaved={isSaved}
            tone={tone}
          />
        </div>
      </div>
    </article>
  );
}

/** Loading placeholder. Mirrors the card's structure so the grid does not jump
 *  when the real cards replace it. */
/**
 * Loading placeholder.
 *
 * Mirrors the card's structure so the grid does not jump when the real cards
 * replace it. Takes the same `tone` prop so a light band does not flash a dark
 * skeleton.
 */
export function ProductCardSkeleton({ tone = "dark" }: { tone?: "dark" | "light" }) {
  const block = tone === "dark" ? "bg-ink-850" : "bg-ink-200/60";
  const line = tone === "dark" ? "bg-ink-800" : "bg-ink-200";

  return (
    <div className="flex flex-col bg-transparent">
      <div className={cn("aspect-4/5 w-full animate-pulse rounded-xs", block)} />
      <div className="flex flex-col gap-2 pt-4">
        <div className={cn("h-2.5 w-1/3 animate-pulse rounded-xs", line)} />
        <div className={cn("h-3.5 w-4/5 animate-pulse rounded-xs", line)} />
        <div className={cn("h-3 w-1/2 animate-pulse rounded-xs", block)} />
        <div className={cn("h-4 w-1/3 animate-pulse rounded-xs", line)} />
        <div className={cn("mt-4 h-11 w-full animate-pulse rounded-xs", block)} />
      </div>
    </div>
  );
}