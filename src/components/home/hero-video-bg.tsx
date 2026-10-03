"use client";

import { useEffect, useRef } from "react";

const VIDEO_SRC = "/media/hero-helmet.mp4";
const POSTER_SRC = "/media/hero-helmet-poster.webp";

/**
 * HeroVideoBg — fullscreen video backdrop, first child of the hero ONLY.
 *
 * - absolute inset-0, z-0; cover with `--product-x/y` so the product zone
 *   (right side) stays uncropped.
 * - Safe-area guard (ResizeObserver): if cover would cut the product box
 *   (--product-left/right/top/bottom, % of source frame), the wrapper flips
 *   to `data-contain="true"` — foreground video switches to contain while the
 *   poster underneath blurs/scales to fill the letterbox seamlessly.
 * - Grade: left-to-right readability gradient + vignette + orange
 *   spotlight (screen blend, 6s pulse) + faint static grain.
 * - Slow scroll parallax/scale on the video, content fade — transform and
 *   opacity only, rAF-throttled. Autoplay fallback + pause off-screen.
 *   Reduced motion: poster only, no video, no parallax.
 *
 * PRODUCT BOUNDING BOX (measured from the poster's first frame — the
 * helmet sits center-frame):
 *   --product-x: 55%        // horizontal focus point in source frame
 *   --product-y: 45%        // vertical focus point in source frame
 *   --product-left: 30%     // left edge of product box (% of source width)
 *   --product-right: 80%    // right edge of product box
 *   --product-top: 15%      // top edge of product box (% of source height)
 *   --product-bottom: 90%   // bottom edge of product box
 *
 * To tweak: inspect the video frame, find the product's box in source coords,
 * update the CSS variables above.
 */
export function HeroVideoBg() {
  const wrapRef = useRef<HTMLDivElement>(null);

  /* React renders `muted` as an attribute but browsers gate autoplay on the
     DOM *property* — set both imperatively so autoplay is never blocked. */
  const attachVideo = (video: HTMLVideoElement | null) => {
    if (video) {
      video.muted = true;
      video.defaultMuted = true;
    }
  };

  useEffect(() => {
    const wrap = wrapRef.current;
    const video = wrap?.querySelector<HTMLVideoElement>("video.hero-bg-media");
    if (!wrap || !video) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduced.matches) return;

    video.play().catch(() => {});
    const retry = () => video.play().catch(() => {});
    window.addEventListener("pointerdown", retry, { once: true });
    window.addEventListener("keydown", retry, { once: true });

    /* ── Safe-area guard: cover-crop vs product box ── */
    const pct = (name: string, fallback: number) => {
      const raw = getComputedStyle(wrap).getPropertyValue(name).trim().replace("%", "");
      const value = Number.parseFloat(raw);
      return Number.isFinite(value) ? value : fallback;
    };
    const guard = () => {
      const rect = wrap.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      const vw = video.videoWidth || 1920;
      const vh = video.videoHeight || 1080;
      const mobile = window.innerWidth < 768;
      // Object-position focus: helmet is center-frame; mobile centres up.
      const fx = mobile ? 0.5 : pct("--product-x", 55) / 100;
      const fy = mobile ? 0.32 : pct("--product-y", 45) / 100;
      const scale = Math.max(rect.width / vw, rect.height / vh);
      const overflowX = Math.max(0, vw * scale - rect.width);
      const overflowY = Math.max(0, vh * scale - rect.height);
      // Product box in source-frame fractions.
      const box = {
        left: pct("--product-left", 30) / 100,
        right: pct("--product-right", 80) / 100,
        top: pct("--product-top", 15) / 100,
        bottom: pct("--product-bottom", 90) / 100,
      };
      const cropLeft = overflowX * fx;
      const cropTop = overflowY * fy;
      const cut =
        box.left * vw * scale < cropLeft ||
        box.top * vh * scale < cropTop ||
        box.right * vw * scale > cropLeft + rect.width ||
        box.bottom * vh * scale > cropTop + rect.height;
      if (cut) wrap.dataset.contain = "true";
      else delete wrap.dataset.contain;
    };
    guard();
    const ro = new ResizeObserver(guard);
    ro.observe(wrap);
    video.addEventListener("loadedmetadata", guard);
    video.addEventListener("resize", guard);

    /* ── Pause off-screen ── */
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      },
      { threshold: 0.15 },
    );
    io.observe(wrap);

    /* ── Slow parallax: video 1 → 1.04, content fades as it leaves.
       Desktop only — mobile keeps native scroll with zero transform cost. ── */
    const section = wrap.closest("section");
    const coarse = window.matchMedia("(max-width: 767px), (prefers-reduced-motion: reduce)");
    const content = section?.querySelector<HTMLElement>(".hero-ad-inner");
    const cue = section?.querySelector<HTMLElement>(".hero-ad-cue");
    let frame: number | null = null;
    const parallax = () => {
      frame = null;
      if (!section) return;
      const rect = section.getBoundingClientRect();
      const progress = Math.min(1, Math.max(0, -rect.top / Math.max(1, rect.height)));
      video.style.transform = `scale(${(1 + 0.04 * progress).toFixed(4)})`;
      if (content) {
        content.style.opacity = `${(1 - 0.65 * progress).toFixed(3)}`;
        content.style.transform = `translate3d(0, ${(-40 * progress).toFixed(1)}px, 0)`;
      }
      if (cue) cue.style.opacity = `${(1 - progress * 2).toFixed(3)}`;
    };
    const onScroll = () => {
      if (frame !== null || coarse.matches) return;
      frame = requestAnimationFrame(parallax);
    };
    if (!coarse.matches) window.addEventListener("scroll", onScroll, { passive: true });

    /* ── Entrance: fade the VIDEO in over the poster (poster is visible
       from first paint — no JS needed for it). ── */
    const revealVideo = () => video.classList.add("is-live");
    video.addEventListener("canplay", revealVideo, { once: true });

    return () => {
      window.removeEventListener("pointerdown", retry);
      window.removeEventListener("keydown", retry);
      window.removeEventListener("scroll", onScroll);
      if (frame !== null) cancelAnimationFrame(frame);
      ro.disconnect();
      io.disconnect();
      video.removeEventListener("loadedmetadata", guard);
      video.removeEventListener("resize", guard);
      video.removeEventListener("canplay", revealVideo);
    };
  }, []);

  return (
    <div
      ref={wrapRef}
      className="hero-bg-wrap absolute inset-0 z-0"
    >
      {/* Static poster: visible from first paint (no JS needed). The video
          fades in over it once it can play. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={POSTER_SRC}
        alt=""
        fetchPriority="high"
        className="hero-bg-poster"
      />
      <video
        ref={attachVideo}
        className="hero-bg-media"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        poster={POSTER_SRC}
      >
        <source src={VIDEO_SRC} type="video/mp4" media="(max-width: 768px)" />
        <source src={VIDEO_SRC} type="video/mp4" />
      </video>
      <div className="hero-bg-grade" />
      <div className="hero-bg-spot" />
      <div className="hero-bg-grain" />
      <div className="hero-bg-vignette" />
      <style>{`
        .hero-bg-wrap{
          will-change:opacity;
          --product-x:55%; --product-y:45%;
          --product-left:30%; --product-right:80%;
          --product-top:15%; --product-bottom:90%;
        }
        .hero-bg-poster,.hero-bg-media{
          position:absolute; inset:0; width:100%; height:100%;
          object-fit:cover; object-position:var(--product-x) var(--product-y);
        }
        .hero-bg-poster{ z-index:0; }
        .hero-bg-media{
          z-index:1; will-change:transform;
          opacity:0; transition:opacity 1.2s ease-out;
        }
        .hero-bg-media.is-live{ opacity:1; }
        /* Contain fallback: foreground letterboxes, blurred poster fills behind */
        .hero-bg-wrap[data-contain="true"] .hero-bg-media{ object-fit:contain; }
        .hero-bg-wrap[data-contain="true"] .hero-bg-poster{
          object-fit:cover; filter:blur(40px) brightness(.5); transform:scale(1.2);
        }
        .hero-bg-grade{
          position:absolute; inset:0; z-index:2;
          background:linear-gradient(to right, rgba(10,11,13,.75) 0%, rgba(10,11,13,.4) 38%, rgba(10,11,13,.05) 70%, rgba(10,11,13,.05) 100%);
        }
        .hero-bg-spot{
          position:absolute; inset:0; z-index:2; pointer-events:none;
          background:radial-gradient(circle at 55% 45%, rgba(255,90,31,.18), transparent 55%);
          mix-blend-mode:screen; animation:hero-spot 6s ease-in-out infinite;
        }
        @keyframes hero-spot{ 0%,100%{opacity:.7} 50%{opacity:1} }
        .hero-bg-grain{
          position:absolute; inset:0; z-index:2; pointer-events:none; opacity:.05;
          background-image:url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22120%22 height=%22120%22><filter id=%22n%22><feTurbulence type=%22fractalNoise%22 baseFrequency=%220.9%22 numOctaves=%222%22/><\/filter><rect width=%22120%22 height=%22120%22 filter=%22url(%23n)%22 opacity=%221%22/><\/svg>');
        }
        .hero-bg-vignette{
          position:absolute; inset:0; z-index:2; pointer-events:none;
          background:radial-gradient(120% 100% at 50% 50%, transparent 60%, rgba(0,0,0,.4) 100%);
        }
        @media (max-width:1023px) and (min-width:768px){
          .hero-bg-poster,.hero-bg-media{ object-position:55% 42%; }
        }
        @media (max-width:767px){
          .hero-bg-poster,.hero-bg-media{ object-position:50% 30%; }
          .hero-bg-grade{
            background:linear-gradient(to top, rgba(10,11,13,.94) 0%, rgba(10,11,13,.55) 45%, rgba(10,11,13,.05) 75%, transparent 100%);
          }
        }
        @media (prefers-reduced-motion:reduce){
          .hero-bg-media{ display:none; }
          .hero-bg-spot{ animation:none; }
        }
      `}</style>
    </div>
  );
}
