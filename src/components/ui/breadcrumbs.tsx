import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Breadcrumbs.
 *
 * Wrapped in `<nav aria-label="Breadcrumb">` over an ordered list so assistive
 * technology announces both the trail and the current page. The current item is
 * marked `aria-current="page"` and is not a link — there is nowhere to go.
 */

export type Crumb = { label: string; href?: string };

export function Breadcrumbs({ items, className }: { items: Crumb[]; className?: string }) {
  if (items.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className={cn("min-w-0", className)}>
      <ol className="no-scrollbar flex items-center gap-1 overflow-x-auto text-2xs text-ink-500">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={`${item.label}-${index}`} className="flex shrink-0 items-center gap-1">
              {index > 0 ? (
                <ChevronRight aria-hidden="true" className="h-3 w-3 text-ink-700" />
              ) : null}

              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="rounded-xs transition-colors duration-200 hover:text-flame-300"
                >
                  {item.label}
                </Link>
              ) : (
                <span aria-current={isLast ? "page" : undefined} className={isLast ? "text-ink-300" : undefined}>
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}