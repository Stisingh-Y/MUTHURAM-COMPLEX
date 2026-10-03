import Link from "next/link";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/lib/routes";

/**
 * Wordmark.
 *
 * Set as text rather than an image so it inherits the display face, stays crisp
 * at any size, and needs no `priority` hint or LCP image slot. The orange bar is
 * the same safety-orange used for every call to action.
 */
export function Logo({
  className,
  href = ROUTES.home,
  showSub = true,
}: {
  className?: string;
  href?: string;
  showSub?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group inline-flex items-center gap-2.5 rounded-xs",
        "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-flame-500",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xs bg-flame-500"
      >
        {/* Helmet silhouette — the brand mark. */}
        <svg viewBox="0 0 24 24" className="h-5 w-5 text-ink-950" fill="none" aria-hidden="true">
          <path
            d="M4 14a8 8 0 0 1 16 0v1.5a1.5 1.5 0 0 1-1.5 1.5H15v-3.2a1 1 0 0 0-.32-.73l-2-2.4a1 1 0 0 0-1.36 0l-2 2.4a1 1 0 0 0-.32.73V17H5.5A1.5 1.5 0 0 1 4 15.5V14Z"
            fill="currentColor"
          />
          <rect x="4" y="18.2" width="16" height="1.8" rx="0.9" fill="currentColor" opacity="0.45" />
        </svg>
      </span>

      <span className="flex min-w-0 flex-col overflow-visible pl-1 leading-none">
        <span className="logo-wordmark font-display relative overflow-visible text-[0.95rem] leading-none font-extrabold tracking-[-0.01em] whitespace-nowrap text-white">
          MUTHURAM
          <span aria-hidden="true" className="logo-sheen" />
          <span aria-hidden="true" className="logo-sparks">
            {Array.from({ length: 8 }, (_, i) => (
              <i key={i} className={`logo-spark logo-spark-${i + 1}`} />
            ))}
          </span>
        </span>
        <span
          className={cn(
            "font-display text-[0.6rem] leading-none font-bold tracking-[0.28em] text-ink-400",
            !showSub && "sr-only",
          )}
        >
          COMPLEX
        </span>
      </span>
    </Link>
  );
}