import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { SafeImage } from "@/components/ui/safe-image";
import { getLqipOrTile } from "@/lib/image-placeholders";
import { categoryBlurFor, categoryImageFor } from "@/lib/data/image-map";
import { ROUTES } from "@/lib/routes";
import type { CategoryView } from "@/lib/data/products";

/**
 * CategoryCard — one of eight equal 4/5 plates.
 *
 * `src/components/home/category-card.tsx` (server-safe, no JS).
 * Best real photo of the category via `next/image` (cover, blur placeholder,
 * lazy below fold); underneath sits a plain dark gradient with no drawing and
 * no text, so a missing file can never flash a broken icon or a placeholder.
 */
export function CategoryCard({
  category,
  index,
}: {
  category: CategoryView;
  index: number;
}) {
  const count = `${category.productCount} ${category.productCount === 1 ? "item" : "items"}`;
  // Best real photo of the category; plain dark gradient when there is none.
  const src = categoryImageFor(category.slug, category.image);
  const blur = categoryBlurFor(category.slug) ?? getLqipOrTile(src);
  const hasPhoto = !src.includes("placeholder");

  return (
    <Link
      href={ROUTES.category(category.slug)}
      aria-label={`Shop ${category.name}, ${count}`}
      className="category-card group relative block overflow-hidden rounded-sm bg-[#1A1C20] transition-transform duration-300 ease-out focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-flame-600 active:scale-[0.98]"
    >
      {/* Fixed 4/5 frame — no layout shift, ever. */}
      <div className="relative aspect-4/5 w-full overflow-hidden">
        {/* Plain dark gradient under the photo (no drawing, no text). */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-b from-[#1A1C20] to-[#111214]"
        />

        {hasPhoto ? (
          <SafeImage
            src={src}
            alt=""
            fill
            loading="lazy"
            sizes="(min-width: 1024px) 25vw, 46vw"
            placeholder="blur"
            blurDataURL={blur}
            className="category-photo object-cover"
          />
        ) : null}

        {/* Bottom scrim — rises on hover (desktop only). */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-[#111214]/85 via-[#111214]/15 to-transparent"
        />

        {/* Ghost index, top-left. */}
        <span
          aria-hidden="true"
          className="absolute top-3 left-3 font-mono text-[12px] tracking-[0.08em] text-white/70 tabular-nums"
        >
          {String(index + 1).padStart(2, "0")}
        </span>

        {/* Copy block, bottom-left. */}
        <span className="absolute right-3 bottom-3 left-3 flex items-end justify-between gap-2">
          <span className="flex min-w-0 flex-col gap-1">
            <span className="truncate font-display text-lg font-extrabold tracking-tight text-white">
              {category.name}
            </span>
            <span className="text-[12px] font-medium text-white/70">{count}</span>
          </span>
          <span
            aria-hidden="true"
            className="category-arrow flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/25 text-white transition-all duration-300 ease-out"
          >
            <ArrowUpRight className="h-4 w-4" />
          </span>
        </span>
      </div>
    </Link>
  );
}
