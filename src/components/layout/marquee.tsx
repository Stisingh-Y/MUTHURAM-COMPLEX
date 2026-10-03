"use client";

import { Children, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Seamless marquee.
 *
 * Duplicates its children once and translates the track by exactly -50%, so the
 * second copy lands where the first began and the loop has no visible seam. The
 * translation is a transform, so it stays on the compositor.
 *
 * `animation-play-state: paused` on hover (via the parent `.group/announce`)
 * lets a rider read a specific line, and `prefers-reduced-motion` is honoured in
 * globals.css by collapsing the animation duration.
 */
export function Marquee({
  children,
  className,
  durationSeconds = 26,
}: {
  children: ReactNode;
  className?: string;
  durationSeconds?: number;
}) {
  return (
    <div className={cn("relative flex w-full overflow-hidden", className)}>
      <div
        className="flex w-max shrink-0 items-center motion-safe:[animation-ticker_var(--duration)_linear_infinite] group-hover/announce:[animation-play-state:paused] motion-reduce:animate-none"
        style={{ "--duration": `${durationSeconds}s` } as React.CSSProperties}
      >
        {children}
        <span aria-hidden="true" className="contents">
          {Children.toArray(children)}
        </span>
      </div>
    </div>
  );
}