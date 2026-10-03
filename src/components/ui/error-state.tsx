import { AlertTriangle, RotateCcw } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Inline error state.
 *
 * For failures a rider can retry in place — a failed section fetch, a rejected
 * wishlist toggle, a copy that failed to render. Deliberately distinct from
 * `error.tsx`, which is the last-resort boundary for a whole route.
 */
export function ErrorState({
  title = "Something went wrong",
  description,
  action,
  className,
  compact = false,
  children,
}: {
  title?: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
  compact?: boolean;
  children?: ReactNode;
}) {
  return (
    <div
      role="alert"
      className={cn(
        // Square and flush-left, matching `EmptyState`. A rounded pill icon on a
        // tinted panel was the one place the site still looked like a component
        // library rather than an art-directed page.
        "flex flex-col items-start gap-3 border border-danger-500/35 bg-danger-500/[0.07]",
        compact ? "p-4" : "p-6 sm:p-8",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center bg-danger-500/15 text-danger-400"
        >
          <AlertTriangle className="h-4 w-4" />
        </span>

        <div className="flex flex-col gap-1.5">
          <h2
            className={cn(
              "font-display font-extrabold tracking-[-0.02em] text-bone-50",
              compact ? "text-base" : "text-xl",
            )}
          >
            {title}
          </h2>
          {description ? (
            <p className="text-sm leading-relaxed text-ink-300">{description}</p>
          ) : null}
          {children}
        </div>
      </div>

      {action ? <div className="pl-11">{action}</div> : null}
    </div>
  );
}

/** Retry affordance used next to an `ErrorState`. */
export function RetryButton({ onRetry, pending }: { onRetry?: () => void; pending?: boolean }) {
  if (!onRetry) return null;
  return (
    <button
      type="button"
      onClick={onRetry}
      disabled={pending}
      className={cn(
        "inline-flex h-9 items-center gap-2 border border-ink-600 px-3",
        "text-2xs font-semibold uppercase tracking-[0.08em] text-bone-50",
        "transition-colors duration-200 hover:border-ink-400 hover:bg-ink-800",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flame-500",
        "disabled:pointer-events-none disabled:opacity-50",
      )}
    >
      <RotateCcw
        aria-hidden="true"
        className={cn("h-3.5 w-3.5 motion-safe:animate-none", pending && "motion-safe:animate-spin")}
      />
      {pending ? "Retrying" : "Try again"}
    </button>
  );
}