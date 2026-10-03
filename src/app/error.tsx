"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Home, RotateCcw } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { ROUTES } from "@/lib/routes";

/**
 * Route error boundary.
 *
 * Next.js renders this instead of the segment when a Server Component throws, so
 * it must be a Client Component with its own `reset`. The message shown to the
 * rider is deliberately generic; `error.message` goes to the console for
 * developers, never to the page, because it can carry query fragments.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[route error]", error);
  }, [error]);

  return (
    <div className="container-page py-20 sm:py-28">
      <div className="mx-auto flex max-w-xl flex-col items-center gap-6 text-center">
        <span
          aria-hidden="true"
          className="font-display text-6xl leading-none font-extrabold tracking-[-0.03em] text-ink-800"
        >
          500
        </span>

        <div className="flex flex-col gap-3">
          <h1 className="text-3xl text-bone-50 sm:text-4xl">Something broke on our side</h1>
          <p className="text-sm leading-relaxed text-ink-300 sm:text-base">
            This page failed to load. It is almost certainly our problem rather than yours — try again in a
            moment, and if it keeps happening, call the shop and we will take your order over the phone.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <ButtonLink href={ROUTES.shop} size="lg">
            <Home aria-hidden="true" className="h-4 w-4" />
            Back to the shop
          </ButtonLink>

          <button
            type="button"
            onClick={reset}
            className="inline-flex h-13 items-center gap-2 rounded-md border border-ink-600 px-7 text-xs font-semibold uppercase tracking-[0.08em] text-bone-50 transition-[background-color,border-color,transform] duration-200 hover:border-ink-400 hover:bg-ink-800 active:translate-y-px"
          >
            <RotateCcw aria-hidden="true" className="h-4 w-4" />
            Try again
          </button>
        </div>

        <Link
          href={ROUTES.content.contact}
          className="text-2xs text-ink-500 underline-offset-4 transition-colors hover:text-ink-300 hover:underline"
        >
          Still stuck? Contact the shop →
        </Link>

        {error.digest ? (
          <p className="font-mono text-2xs text-ink-700">Reference: {error.digest}</p>
        ) : null}
      </div>
    </div>
  );
}