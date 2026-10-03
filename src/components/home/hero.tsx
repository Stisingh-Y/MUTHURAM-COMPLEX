import { ArrowRight, Star } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { HeroEyebrow } from "@/components/home/hero-eyebrow";
import { HeroVideoBg } from "@/components/home/hero-video-bg";
import { HeroWatermark } from "@/components/home/hero-watermark";
import type { BannerView } from "@/lib/data/banners";

/**
 * Product-advertisement hero — Muthuram Complex.
 *
 * Copy on the left (columns 1-6), product zone kept clear on the right
 * (columns 7-12). The video is the fullscreen background of THIS hero only
 * (see `hero-video-bg`) — sections below keep their normal solid surfaces.
 */

const HEADLINE = ["GEAR UP.", "RIDE HARD."] as const;
const HEADLINE_ACCENT = "RIDE SAFE.";

export function Hero({
  banner,
  trustBar,
}: {
  banner?: BannerView;
  trustBar?: React.ReactNode;
}) {
  const ctaLabel = banner?.ctaLabel ?? "SHOP RIDING GEAR";
  const ctaHref = banner?.ctaHref ?? "/shop";
  const secondaryLabel = banner?.secondaryCtaLabel ?? "EXPLORE COLLECTION";
  const secondaryHref = banner?.secondaryCtaHref ?? "/shop";

  return (
    <section
      aria-labelledby="hero-title"
      className="hero-ad relative isolate overflow-hidden bg-[#111214] text-bone-50"
    >
      {/* Fullscreen hero video (first child, absolute, z-0) + grade */}
      <HeroVideoBg />

      {/* Watermark kept behind the copy, dimmed so it never fights the product */}
      <HeroWatermark />

      {/* 12-column grid inside safe margins; left copy, right product zone */}
      <div className="hero-ad-inner relative z-[2] mx-auto grid h-full w-full grid-cols-12">
        <div className="col-span-12 flex min-w-0 flex-col items-start justify-center lg:col-span-6">
          <HeroEyebrow text={banner?.eyebrow ?? "NEW SEASON 2026"} />

          <h1
            id="hero-title"
            className="mt-6 font-display text-[clamp(44px,7vw,112px)] leading-[0.95] font-black tracking-[-0.02em] text-white uppercase"
            style={{ marginBottom: "clamp(28px, 4vh, 48px)" }}
          >
            {HEADLINE.map((line, i) => (
              <span key={line} className="hero-mask block overflow-hidden">
                <span
                  className="block motion-safe:animate-[hero-mask_900ms_cubic-bezier(0.22,1,0.36,1)_both]"
                  style={{ animationDelay: `${270 + i * 120}ms` }}
                >
                  {line}
                </span>
              </span>
            ))}
            <span className="hero-mask block overflow-hidden">
              <span
                className="block text-flame-500 motion-safe:animate-[hero-mask_900ms_cubic-bezier(0.22,1,0.36,1)_both]"
                style={{ animationDelay: "510ms" }}
              >
                {HEADLINE_ACCENT}
              </span>
            </span>
          </h1>

          <div
            className="flex w-full flex-col gap-4 sm:w-auto sm:flex-row motion-safe:animate-[hero-rise_800ms_var(--ease-out-expo)_both]"
            style={{ animationDelay: "570ms", marginBottom: "24px" }}
          >
            <ButtonLink
              href={ctaHref}
              size="xl"
              className="hero-cta-primary group h-14 w-full px-9 text-[13px] font-bold tracking-[0.12em] sm:w-auto"
            >
              {ctaLabel}
              <ArrowRight
                aria-hidden="true"
                className="h-4 w-4 transition-transform duration-300 ease-(--ease-out-expo) group-hover:translate-x-1 motion-reduce:group-hover:translate-x-0"
              />
            </ButtonLink>
            <ButtonLink
              href={secondaryHref}
              variant="outline"
              size="xl"
              className="h-14 w-full border-white/40 bg-white/5 px-9 text-[13px] backdrop-blur-md hover:border-white hover:bg-white/12 sm:w-auto"
            >
              {secondaryLabel}
            </ButtonLink>
          </div>

          {/* Rating row */}
          <p
            className="inline-flex items-center gap-2 text-sm text-white/70 motion-safe:animate-[hero-rise_800ms_var(--ease-out-expo)_both]"
            style={{ animationDelay: "690ms" }}
          >
            <Star aria-hidden="true" className="h-4 w-4 fill-flame-500 text-flame-500" />
            <span>
              <span className="font-semibold text-white">4.6/5</span> from 2,400+ riders
            </span>
          </p>
        </div>

        {/* Right product zone (columns 7-12): kept clear for the video's product */}
        <div aria-hidden="true" className="hidden min-w-0 lg:col-span-6 lg:block" />
      </div>

      {/* Scroll cue, above the trust bar, inside the safe margin */}
      <div aria-hidden="true" className="hero-ad-cue absolute left-1/2 z-[2] -translate-x-1/2">
        <span className="hero-ad-cue-label">Scroll</span>
        <span className="hero-ad-cue-line">
          <span className="hero-ad-cue-dot" />
        </span>
      </div>

      {/* Trust strip overlay bar pinned to the hero bottom (video behind it) */}
      {trustBar ? (
        <div className="hero-ad-trust absolute inset-x-0 bottom-0 z-[2]">
          <div className="mx-auto w-full" style={{ maxWidth: "1360px", paddingInline: "clamp(20px, 5vw, 96px)" }}>
            {trustBar}
          </div>
        </div>
      ) : null}

      {/* Scoped hero styles: exact viewport height, safe margins, entrance, CTAs */}
      <style>{`
        .hero-ad{
          --header-h:72px;
          --trust-h:132px;
          position:relative;
          height:100vh;
          height:100svh;
          min-height:640px;
          overflow:hidden;
        }
        .hero-ad-inner{
          padding-inline:clamp(20px, 5vw, 96px);
          padding-top:calc(var(--header-h) + clamp(24px, 4vh, 48px));
          padding-bottom:calc(var(--trust-h) + 64px);
          align-content:center;
        }
        @keyframes hero-mask{
          from{ transform:translateY(100%); }
          to{ transform:translateY(0); }
        }
        /* Bottom edge melts into the next section — soft 120px fade, video continues behind */
        .hero-ad::after{
          content:""; position:absolute; inset-inline:0; bottom:0; height:120px; z-index:1;
          pointer-events:none; background:linear-gradient(to bottom, transparent, rgba(10,11,13,.6));
        }
        .hero-ad-trust{ z-index:2; }
        .hero-ad [stroke="rgba(255,255,255,0.07)"]{ stroke:rgba(255,255,255,.04); }
        .hero-ad .pointer-events-none svg{ opacity:.5; }
        .hero-cta-primary{ box-shadow:0 12px 40px rgba(255,90,31,.0); }
        .hero-cta-primary:hover{
          transform:translateY(-2px);
          box-shadow:0 12px 40px rgba(255,90,31,.45);
        }
        .hero-cta-primary:active{ transform:scale(.98); }
        .hero-cta-primary::after{
          content:""; position:absolute; top:0; bottom:0; width:55%; left:-75%;
          background:linear-gradient(100deg, transparent, rgba(255,255,255,.45), transparent);
          transform:skewX(-20deg); transition:left .55s ease; pointer-events:none;
        }
        .hero-cta-primary:hover::after{ left:135%; }
        .hero-ad-cue{ display:flex; flex-direction:column; align-items:center; gap:8px; bottom:calc(var(--trust-h) + 16px); }
        .hero-ad-cue-label{
          font-size:10px; letter-spacing:.3em; text-transform:uppercase; color:rgba(255,255,255,.65);
        }
        .hero-ad-cue-line{ position:relative; display:block; width:1px; height:40px; background:rgba(255,255,255,.25); overflow:hidden; }
        .hero-ad-cue-dot{ position:absolute; left:0; top:-40%; width:1px; height:40%; background:#fff; animation:hero-cue 1.8s ease-in-out infinite; }
        @keyframes hero-cue{ 0%{top:-40%} 100%{top:110%} }
        /* hero-rise is global (globals.css) — shared with nav/drawers */
        @media (max-width:1023px) and (min-width:768px){
          .hero-ad-inner{ align-content:center; }
          .hero-ad-inner p{ max-width:48ch; }
        }
        @media (max-width:767px){
          .hero-ad{ --trust-h:150px; min-height:600px; }
          .hero-ad-inner{ align-content:end; padding-top:calc(var(--header-h) + 24px); padding-bottom:calc(var(--trust-h) + 32px); }
          .hero-ad-cue{ display:none; }
        }
        @media (prefers-reduced-motion:reduce){
          .motion-safe\\:animate-\\[hero-rise_800ms_var(--ease-out-expo)_both\\]{ animation:none; }
          .hero-ad-cue-dot{ animation:none; }
        }
      `}</style>
    </section>
  );
}