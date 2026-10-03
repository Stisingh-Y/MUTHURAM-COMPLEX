"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

/**
 * SafeImage — `next/image` with a graceful fallback.
 *
 * - Soft fade-in when loaded (`opacity-0` → `opacity-100`, 500ms): the parent
 *   frame already paints a skeleton/shimmer behind, so there is no flash and
 *   no layout shift — the image simply settles in.
 * - On any load error the image is replaced by a plain dark skeleton (no
 *   text, no icon), so a missing file renders as backdrop, never as a
 *   broken-image icon. The frame sizing comes from the parent, so the swap is
 *   paint-only (CLS-safe).
 */
export function SafeImage(props: ImageProps & { fade?: boolean }) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  if (failed) {
    return (
      <div
        aria-hidden="true"
        className={cn("animate-pulse bg-ink-900", props.className)}
      />
    );
  }

  // `fade={false}` opts out of the load fade (e.g. hover-swap layers that
  // drive their own opacity) while keeping the error fallback.
  const { className, fade = true, ...rest } = props;

  return (
    <Image
      {...rest}
      alt={props.alt}
      onError={() => setFailed(true)}
      onLoad={() => setLoaded(true)}
      className={
        fade
          ? cn(
              className,
              "transition-opacity duration-500 ease-out",
              loaded ? "opacity-100" : "opacity-0",
            )
          : className
      }
    />
  );
}
