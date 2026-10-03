import Image from "next/image";
import { getLqipOrTile } from "@/lib/image-placeholders";

/**
 * HeroVisual — full-bleed cinematic container (7 cols).
 *
 * No card border, no placeholder text. A `<video>` slot (cinematic loop /
 * scroll-driven canvas can mount on `#hero-canvas`) with a poster fallback
 * and a left-edge gradient fade into the page background. Two glass badges
 * sit INSIDE the frame, bottom-left (24px offsets desktop, 16px mobile) —
 * above the visual (z-[2]), below the header, never over copy.
 *
 * Clear 16px radius + `overflow-hidden` give the frame a hard bottom edge;
 * the hero grid's own bottom padding keeps 48px+ between content and the
 * watermark row so the next section never clips it.
 */
export function HeroVisual({ image, mobileImage }: { image: string; mobileImage: string }) {
  return (
    <div className="relative min-h-[22rem] overflow-hidden rounded-2xl sm:min-h-[28rem] lg:min-h-[calc(100svh-9rem)] lg:min-h-[640px]">
      {/* Cinematic slot: swap `src` for the final loop; poster keeps LCP clean. */}
      <video
        className="absolute inset-0 h-full w-full object-cover"
        autoPlay
        muted
        loop
        playsInline
        preload="none"
        poster={image}
        aria-label="Cinematic motorcycle riding film"
      >
        {/* <source src="/media/hero-loop.mp4" type="video/mp4" /> */}
      </video>
      {/* Scroll-driven 3D mount point (progressive enhancement). */}
      <canvas id="hero-canvas" aria-hidden="true" className="absolute inset-0 h-full w-full" />

      {/* Poster fallback (shows until video/canvases paint). */}
      <Image
        src={image}
        alt="Rider in premium protective gear on a motorcycle at dusk"
        fill
        priority
        fetchPriority="high"
        sizes="(max-width: 1024px) 100vw, 58vw"
        placeholder="blur"
        blurDataURL={getLqipOrTile(image)}
        className="hidden object-cover object-center sm:block"
      />
      <Image
        src={mobileImage}
        alt="Rider in premium protective gear on a motorcycle at dusk"
        fill
        priority
        fetchPriority="high"
        sizes="100vw"
        placeholder="blur"
        blurDataURL={getLqipOrTile(mobileImage)}
        className="object-cover object-center sm:hidden"
      />

      {/* Left-edge blend into the page + bottom seat for badges */}
      <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-r from-[#111214] via-[#111214]/25 to-transparent" />
      <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-[#111214]/85 via-transparent to-[#111214]/10" />

      {/* Two glass badges, pinned inside the frame — bottom-left. */}
      <div className="absolute bottom-4 left-4 z-[2] flex flex-wrap gap-2 lg:bottom-6 lg:left-6">
        {["ECE 22.06 Certified", "CE Level 2 Armour"].map((label) => (
          <span
            key={label}
            className="inline-flex h-8 items-center gap-2 rounded-full border border-white/[0.12] bg-[rgb(17_18_20/0.6)] px-[14px] text-[10px] font-bold tracking-[0.08em] text-[#F2F0EB] uppercase backdrop-blur-[10px] lg:text-[11px]"
          >
            <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 rounded-full bg-flame-500" />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
