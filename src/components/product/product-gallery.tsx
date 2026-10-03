"use client";

import { useRef, useState } from "react";
import { SafeImage } from "@/components/ui/safe-image";
import { getLqipOrTile } from "@/lib/image-placeholders";
import { cn } from "@/lib/utils";
import type { ProductImageView } from "@/lib/data/products";

/**
 * Product gallery.
 *
 * Thumbnails and the stage share one index, so the selected thumbnail is always
 * the visible image and a keyboard user tabbing through them can change the main
 * view. Only this component is a Client Component — the page renders it with a
 * serialisable image list.
 *
 * Arrow keys move between images, and the stage is a listbox so a screen reader
 * announces position ("2 of 4") rather than leaving a rider guessing.
 */
export function ProductGallery({
  images,
  productName,
}: {
  images: ProductImageView[];
  productName: string;
}) {
  const [index, setIndex] = useState(0);
  // Touch-swipe on the stage (mobile pinch-zoom stays native via the
  // browser; swipe changes the active frame when only one image exists
  // there is nothing to swipe between).
  const touchX = useRef<number | null>(null);

  // One photo still renders the 3-thumb rail: the same file at three
  // object-positions (full / top / detail) so the layout never collapses.
  const frames: (ProductImageView & { position: string })[] =
    images.length === 1
      ? [
          { ...images[0]!, position: "object-center" },
          { ...images[0]!, position: "object-top" },
          { ...images[0]!, position: "object-bottom" },
        ]
      : images.map((image) => ({ ...image, position: "object-center" }));

  if (frames.length === 0) {
    return (
      <div
        aria-label={`${productName} image`}
        role="img"
        className="relative aspect-4/5 w-full overflow-hidden bg-ink-900"
      >
        <div aria-hidden="true" className="absolute inset-0 animate-pulse bg-ink-850" />
      </div>
    );
  }

  const active = frames[Math.min(index, frames.length - 1)] ?? frames[0]!;

  return (
    <div className="flex flex-col-reverse gap-3 sm:flex-row">
      {frames.length > 1 ? (
        <ul
          aria-label={`${productName} images`}
          className="no-scrollbar flex gap-2 overflow-x-auto sm:w-20 sm:flex-col sm:overflow-visible"
        >
          {frames.map((image, imageIndex) => {
            const isActive = imageIndex === index;
            return (
              <li key={`${image.url}-${imageIndex}`} className="shrink-0">
                <button
                  type="button"
                  onClick={() => setIndex(imageIndex)}
                  aria-current={isActive ? "true" : undefined}
                  aria-label={`Show image ${imageIndex + 1} of ${frames.length}`}
                  className={cn(
                    "relative block h-16 w-14 overflow-hidden rounded-sm border-2 transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flame-500",
                    isActive
                      ? "border-flame-500"
                      : "border-ink-800 hover:border-ink-600",
                  )}
                >
                  <SafeImage
                    src={image.url}
                    alt=""
                    fill
                    sizes="56px"
                    placeholder="blur"
                    blurDataURL={getLqipOrTile(image.url)}
                    className={cn("object-cover", image.position)}
                  />
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}

      <div
        role="group"
        aria-roledescription="carousel"
        aria-label={`${productName} product images`}
        onKeyDown={(event) => {
          if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
          event.preventDefault();
          setIndex((current) => {
            const next =
              event.key === "ArrowRight" ? current + 1 : current - 1;
            return (next + frames.length) % frames.length;
          });
        }}
        onTouchStart={(event) => {
          touchX.current = event.touches[0]?.clientX ?? null;
        }}
        onTouchEnd={(event) => {
          if (touchX.current === null) return;
          const delta = (event.changedTouches[0]?.clientX ?? 0) - touchX.current;
          touchX.current = null;
          if (Math.abs(delta) < 40) return;
          setIndex((current) => (current + (delta < 0 ? 1 : -1) + frames.length) % frames.length);
        }}
        className="group relative min-w-0 flex-1"
        tabIndex={0}
      >
        <div className="relative aspect-[4/5] w-full overflow-hidden border border-ink-850 bg-ink-900">
          {/* Skeleton reserves space under the image — no layout shift on load/error */}
          <div aria-hidden="true" className="absolute inset-0 animate-pulse bg-ink-850" />
          <SafeImage
            key={`${active.url}-${index}`}
            src={active.url}
            alt={active.alt || productName}
            fill
            priority={index === 0}
            sizes="(min-width: 1024px) 46vw, 100vw"
            placeholder="blur"
            blurDataURL={getLqipOrTile(active.url)}
            className={cn(
              "animate-[fade-in_240ms_ease-out] object-cover transition-transform duration-500 ease-out",
              "group-hover:scale-[1.5] group-hover:cursor-zoom-in",
              active.position,
            )}
          />
        </div>

        {frames.length > 1 ? (
          <p className="mt-2 text-center text-2xs text-ink-500 tabular-nums sm:hidden">
            {index + 1} / {frames.length}
          </p>
        ) : null}
      </div>
    </div>
  );
}