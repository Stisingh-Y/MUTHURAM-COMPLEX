"use client";

import { useEffect, useRef, useState } from "react";

/**
 * HeroWatermark — clean outline-only "MUTHURAM" with one soft light sweep.
 *
 * `src/components/home/hero-watermark.tsx`, bottom of the hero, fully inside
 * the section with a 24px gap above its bottom edge, behind content (z-0,
 * pointer-events-none). The bottom edge fades via `mask-image` so there is
 * never a hard cut line.
 *
 * - Base: single continuous SVG `<text>` outline, `fill="none"`, 1px
 *   `rgba(255,255,255,0.07)` stroke with `vector-effect="non-scaling-stroke"`
 *   for crisp lines. No dashes, no dots, no dash animation — that was the
 *   source of the scattered-speckle noise.
 * - Light: ONE smooth sweep — a 30%-wide gradient (transparent →
 *   `rgba(255,90,31,0.55)` → transparent) travelling left → right on an 8s
 *   ease-in-out SMIL loop, with a soft `feGaussianBlur` (stdDeviation 2) at
 *   low opacity so no hard-edged speckles can appear.
 * - Only gradient position animates. `IntersectionObserver` pauses the SMIL
 *   timeline off-screen. `prefers-reduced-motion` (and mobile) render the
 *   static outline only; mobile also drops to 0.05 opacity.
 */
export function HeroWatermark() {
  const svgRef = useRef<SVGSVGElement>(null);
  const [staticOnly, setStaticOnly] = useState(false);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const mobile = window.matchMedia("(max-width: 1023px)");
    const compute = () => setStaticOnly(reduced.matches || mobile.matches);
    compute();
    reduced.addEventListener("change", compute);
    mobile.addEventListener("change", compute);
    return () => {
      reduced.removeEventListener("change", compute);
      mobile.removeEventListener("change", compute);
    };
  }, []);

  // Pause the sweep while the hero is off-screen.
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg || staticOnly) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) svg.unpauseAnimations();
        else svg.pauseAnimations();
      },
      { threshold: 0 },
    );
    observer.observe(svg);
    return () => observer.disconnect();
  }, [staticOnly]);

  const textProps = {
    x: 600,
    y: 150,
    textAnchor: "middle" as const,
    textLength: 1160,
    lengthAdjust: "spacingAndGlyphs" as const,
    fontFamily: "Archivo, 'Arial Black', system-ui, sans-serif",
    fontWeight: 900,
    fontSize: 168,
    letterSpacing: -4,
  };

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 bottom-6 z-0 overflow-hidden"
      style={{ maskImage: "linear-gradient(to bottom, black 65%, transparent 100%)" }}
    >
      <svg
        ref={svgRef}
        viewBox="0 0 1200 200"
        preserveAspectRatio="xMidYMax meet"
        className="block h-auto w-full opacity-70 lg:opacity-100"
        role="presentation"
      >
        <defs>
          {/* Single soft band, ~30% wide: transparent → orange → transparent. */}
          <linearGradient id="wm-sweep" gradientUnits="objectBoundingBox" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#FF5A1F" stopOpacity="0" />
            <stop offset="0.35" stopColor="#FF5A1F" stopOpacity="0" />
            <stop offset="0.5" stopColor="#FF5A1F" stopOpacity="0.55" />
            <stop offset="0.65" stopColor="#FF5A1F" stopOpacity="0" />
            <stop offset="1" stopColor="#FF5A1F" stopOpacity="0" />
            {!staticOnly ? (
              <animateTransform
                attributeName="gradientTransform"
                type="translate"
                values="-1 0; 1 0"
                keyTimes="0; 1"
                calcMode="spline"
                keySplines="0.42 0 0.58 1"
                dur="8s"
                repeatCount="indefinite"
              />
            ) : null}
          </linearGradient>
          {/* Soft glow, low opacity — blur 2, no hard edges. */}
          <filter id="wm-glow" x="-20%" y="-60%" width="140%" height="220%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* The one and only outline: continuous, thin, no fill, no dashes. */}
        <text
          {...textProps}
          fill="none"
          stroke="rgba(255,255,255,0.07)"
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
        >
          MUTHURAM
        </text>

        {!staticOnly ? (
          <text
            {...textProps}
            fill="none"
            stroke="url(#wm-sweep)"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
            filter="url(#wm-glow)"
            opacity="0.8"
          >
            MUTHURAM
          </text>
        ) : null}
      </svg>
    </div>
  );
}
