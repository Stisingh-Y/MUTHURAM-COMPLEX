import { cn } from "@/lib/utils";

/**
 * Badges.
 *
 * The accent colour is reserved for the one badge that means "buy this" —
 * SALE and LIMITED. Status badges use neutral or semantic colours so the eye
 * is not trained to ignore orange.
 */

const TONES = {
  neutral: "bg-ink-800 text-ink-200 border-ink-700",
  accent: "bg-flame-500 text-ink-950 border-flame-500",
  danger: "bg-danger-500/15 text-danger-400 border-danger-500/40",
  success: "bg-success-500/15 text-success-400 border-success-500/40",
  warning: "bg-warning-500/15 text-warning-400 border-warning-500/40",
  info: "bg-info-500/15 text-info-400 border-info-500/40",
  bone: "bg-bone-100 text-ink-900 border-bone-200",
} as const;

export type BadgeTone = keyof typeof TONES;

export function Badge({
  tone = "neutral",
  className,
  children,
}: {
  tone?: BadgeTone;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-xs border px-2 py-0.5",
        "font-semibold uppercase tracking-[0.1em] text-2xs leading-5",
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Map a domain badge token to a visual tone. */
export function badgeToneFor(token: string): BadgeTone {
  switch (token) {
    case "SALE":
    case "LIMITED":
      return "accent";
    case "OUT_OF_STOCK":
      return "danger";
    case "NEW":
      return "info";
    case "BESTSELLER":
      return "warning";
    default:
      return "neutral";
  }
}