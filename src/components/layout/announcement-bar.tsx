"use client";

import { useEffect, useState } from "react";
import { formatMoney } from "@/lib/utils";

/**
 * Slim rotating announcement bar.
 *
 * One message at a time (36px), auto-rotating every 4s, pausing on
 * hover/focus. Small uppercase muted text — it informs, never shouts.
 */
export function AnnouncementBar({
  freeShippingPaise,
  returnDays,
  className,
}: {
  freeShippingPaise: number;
  returnDays: number;
  className?: string;
}) {
  const messages = [
    `Free shipping over ${formatMoney(freeShippingPaise, { compact: true })}`,
    `${returnDays}-day returns on unused gear`,
    "Batch-verified CE armour, every order",
  ];

  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % messages.length), 4000);
    return () => clearInterval(timer);
    // `messages.length` is stable (3); deps intentionally minimal.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused]);

  return (
    <div
      className={className}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <p
        role="status"
        aria-live="polite"
        className="flex h-9 items-center justify-center px-4 text-center text-[11px] font-semibold tracking-[0.08em] text-ink-400 uppercase"
      >
        {messages[index]}
      </p>
    </div>
  );
}
