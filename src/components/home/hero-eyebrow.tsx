/**
 * HeroEyebrow — bold "RIDE WITH CONFIDENCE" statement.
 *
 * 16px mobile / 20px desktop, weight 800, uppercase, 0.18em tracking,
 * safety-orange with glow, 48×3px bar before, pulsing dot after,
 * and a faint oversized outlined "CONFIDENCE" watermark behind.
 */

export function HeroEyebrow({ text = "Ride with confidence" }: { text?: string }) {
  return (
    <div className="relative">
      {/* Watermark — stroke only, no fill, behind content */}
      <p
        aria-hidden="true"
        className="pointer-events-none absolute -top-16 left-0 z-0 font-display text-[120px] leading-none font-black tracking-tight whitespace-nowrap text-transparent select-none [-webkit-text-stroke:1px_rgb(255_255_255/0.05)]"
      >
        CONFIDENCE
      </p>

      <p
        className="relative z-[1] inline-flex items-center gap-4 text-[16px] font-extrabold tracking-[0.18em] text-flame-500 uppercase motion-safe:animate-[hero-rise_600ms_var(--ease-out-expo)_both] lg:text-[20px]"
        style={{ textShadow: "0 0 24px rgb(255 90 31 / 0.45)" }}
      >
        <span aria-hidden="true" className="h-[3px] w-12 shrink-0 bg-flame-500" />
        {text}
        <span
          aria-hidden="true"
          className="h-1.5 w-1.5 shrink-0 rounded-full bg-flame-500 motion-safe:animate-[hero-pulse_2s_ease-in-out_infinite]"
        />
      </p>

      {/* hero-pulse keyframes are global (globals.css) */}
    </div>
  );
}
