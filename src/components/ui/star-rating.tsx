import { cn } from "@/lib/utils";

/**
 * Accessible rating display.
 *
 * The stars are decorative and the numeric value is exposed to assistive tech
 * as text, because "4.6 out of 5 from 128 riders" is far more useful than five
 * unlabelled glyphs. Colour is never the only signal: the numeric value is
 * always visible.
 */

function Star({ fill }: { fill: "full" | "half" | "empty" }) {
  const id = `star-${fill}`;
  return (
    <svg viewBox="0 0 20 20" className="h-3.5 w-3.5 shrink-0" aria-hidden="true">
      <defs>
        <linearGradient id={id}>
          <stop offset="50%" stopColor="currentColor" />
          <stop offset="50%" stopColor="transparent" />
        </linearGradient>
      </defs>
      <path
        d="M10 1.6l2.6 5.3 5.8.85-4.2 4.1 1 5.8L10 14.9l-5.2 2.75 1-5.8-4.2-4.1 5.8-.85L10 1.6Z"
        className={fill === "empty" ? "fill-ink-700" : "fill-current"}
        style={fill === "half" ? { fill: `url(#${id})` } : undefined}
      />
    </svg>
  );
}

export function StarRating({
  value,
  count,
  size = "sm",
  showValue = true,
  tone = "dark",
  className,
}: {
  value: number;
  count?: number;
  size?: "sm" | "md";
  showValue?: boolean;
  /** Which surface the rating sits on. The numeric value is text, not a
   *  glyph, so it has to be legible on both. */
  tone?: "dark" | "light";
  className?: string;
}) {
  const clamped = Math.max(0, Math.min(5, value));

  const stars = Array.from({ length: 5 }, (_, index) => {
    const position = index + 1;
    if (clamped >= position) return "full" as const;
    if (clamped >= position - 0.5) return "half" as const;
    return "empty" as const;
  });

  const label =
    count === undefined
      ? `Rated ${value.toFixed(1)} out of 5`
      : `Rated ${value.toFixed(1)} out of 5 from ${count} ${count === 1 ? "rider" : "riders"}`;

  return (
    <span className={cn("inline-flex max-w-full items-center gap-1.5 whitespace-nowrap", className)}>
      <span
        className={cn(
          "inline-flex items-center gap-0.5 text-warning-400",
          size === "md" && "gap-1 [&_svg]:h-4 [&_svg]:w-4",
        )}
        role="img"
        aria-label={label}
      >
        {stars.map((fill, index) => (
          <Star key={`${fill}-${index}`} fill={fill} />
        ))}
      </span>
      {showValue ? (
        <span
          className={cn(
            "font-semibold tabular-nums",
            size === "md" ? "text-sm" : "text-2xs",
            tone === "dark" ? "text-ink-200" : "text-ink-600",
          )}
        >
          {value.toFixed(1)}
        </span>
      ) : null}
      {count !== undefined ? (
        <span className={cn("tabular-nums", tone === "dark" ? "text-ink-400" : "text-ink-500")}>
          ({count})
        </span>
      ) : null}
    </span>
  );
}