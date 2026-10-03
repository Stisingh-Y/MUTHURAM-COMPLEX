import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { ButtonLink } from "@/components/ui/button";

/**
 * Empty state.
 *
 * Used wherever a query legitimately returns nothing: an empty cart, a wishlist
 * with no saves, a search with no hits, a category with nothing published yet.
 *
 * The point is that "empty" is a *designed* state, not a blank screen. Every
 * empty state names the situation and offers the one action that resolves it.
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
  className,
  compact = false,
}: {
  icon?: ReactNode;
  title: string;
  description?: ReactNode;
  action?: { href: string; label: string };
  secondaryAction?: { href: string; label: string };
  className?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        // Square, hairline, no fill: a dashed rounded box says "placeholder",
        // and the rest of the system does not use rounded boxes at all. An empty
        // state should still look like part of the site.
        "flex flex-col items-center justify-center border border-ink-800 bg-ink-900/40 text-center",
        compact ? "gap-3 px-6 py-10" : "gap-4 px-6 py-16 sm:py-20",
        className,
      )}
    >
      {icon ? (
        <span
          aria-hidden="true"
          className={cn(
            "flex items-center justify-center border border-ink-800 text-flame-500",
            "[&>svg]:h-5 [&>svg]:w-5",
            compact ? "h-11 w-11" : "h-14 w-14",
          )}
        >
          {icon}
        </span>
      ) : null}

      <div className="flex max-w-md flex-col gap-2">
        <h2
          className={cn(
            "font-display font-extrabold tracking-[-0.02em] text-bone-50",
            compact ? "text-lg" : "text-2xl",
          )}
        >
          {title}
        </h2>
        {description ? (
          <p className="text-sm leading-relaxed text-ink-400">{description}</p>
        ) : null}
      </div>

      {action || secondaryAction ? (
        <div className="mt-1 flex flex-wrap items-center justify-center gap-3">
          {action ? (
            <ButtonLink href={action.href} size="md">
              {action.label}
            </ButtonLink>
          ) : null}
          {secondaryAction ? (
            <ButtonLink href={secondaryAction.href} variant="outline" size="md">
              {secondaryAction.label}
            </ButtonLink>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}