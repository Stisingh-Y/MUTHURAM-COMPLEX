"use client";

import { useId, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Disclosure accordion.
 *
 * Built on a real `<button>` controlling the panel's `hidden` attribute, with
 * `aria-expanded` and `aria-controls` wired to the panel id. That is enough for
 * screen readers without pulling in a full disclosure widget library.
 *
 * `allowMultiple` lets a rider open two answers at once — useful when comparing
 * shipping against returns.
 */
export function Accordion({
  items,
  allowMultiple = false,
  className,
}: {
  items: { id: string; question: string; answer: React.ReactNode }[];
  allowMultiple?: boolean;
  className?: string;
}) {
  const baseId = useId();
  const [open, setOpen] = useState<string[]>([]);

  const toggle = (id: string) => {
    setOpen((current) => {
      if (current.includes(id)) return current.filter((entry) => entry !== id);
      return allowMultiple ? [...current, id] : [id];
    });
  };

  return (
    <div className={cn("divide-y divide-ink-800 border-y border-ink-800", className)}>
      {items.map((item) => {
        const isOpen = open.includes(item.id);
        const buttonId = `${baseId}-${item.id}-button`;
        const panelId = `${baseId}-${item.id}-panel`;

        return (
          <div key={item.id}>
            <h3>
              <button
                type="button"
                id={buttonId}
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => toggle(item.id)}
                className={cn(
                  "flex w-full items-center justify-between gap-4 py-5 text-left",
                  "font-display text-base font-bold tracking-[-0.01em] text-bone-50 transition-colors duration-200",
                  "hover:text-flame-300 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-flame-500",
                )}
              >
                <span>{item.question}</span>
                <ChevronDown
                  aria-hidden="true"
                  className={cn(
                    "h-4 w-4 shrink-0 text-ink-500 transition-transform duration-300 ease-(--ease-out-expo)",
                    isOpen && "rotate-180 text-flame-400",
                  )}
                />
              </button>
            </h3>

            <div
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              hidden={!isOpen}
              className="grid-rows-[0fr]"
            >
              <div className={cn(isOpen && "pb-5")}>
                <div className="max-w-2xl text-sm leading-relaxed text-ink-300">{item.answer}</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}