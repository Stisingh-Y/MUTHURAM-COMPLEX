"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Loader2, Mail } from "lucide-react";
import { cn } from "@/lib/utils";
import { subscribeAction, type NewsletterState } from "@/app/actions/newsletter";

/**
 * Newsletter form.
 *
 * Progressive enhancement: the `<form>` posts to the server action, so it works
 * without JavaScript. `useActionStatus` supplies the pending state; the message
 * is announced through `role="status"` / `aria-live="polite"` so a screen-reader
 * user hears the confirmation without losing their place.
 */
/**
 * Declared here rather than imported: a `"use server"` module may only export
 * async functions, so the idle seed cannot live next to `subscribeAction`.
 */
const IDLE_NEWSLETTER_STATE: NewsletterState = { status: "idle" };

export function NewsletterForm({
  source = "footer",
  className,
  id = "newsletter",
  tone = "dark",
}: {
  source?: string;
  className?: string;
  id?: string;
  tone?: "dark" | "light";
}) {
  const [state, formAction] = useActionState<NewsletterState, FormData>(
    subscribeAction,
    IDLE_NEWSLETTER_STATE,
  );

  return (
    <form action={formAction} className={cn("flex flex-col gap-2.5", className)}>
      <input type="hidden" name="source" value={source} />

      <div className="flex flex-col gap-2.5 sm:flex-row">
        <div className="relative flex-1">
          <Mail
            aria-hidden="true"
            className={cn(
              "pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2",
              tone === "light" ? "text-ink-500" : "text-ink-500",
            )}
          />
          <label htmlFor={`${id}-email`} className="sr-only">
            Email address
          </label>
          <input
            id={`${id}-email`}
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="you@example.com"
            aria-invalid={state.fieldErrors?.email ? true : undefined}
            aria-describedby={cn(
              state.fieldErrors?.email && `${id}-error`,
              state.message && `${id}-message`,
            ) || undefined}
            className={cn(
              "h-11 w-full rounded-sm border pl-9 pr-3.5 text-sm transition-colors duration-200",
              "focus:outline-none focus:ring-2",
              tone === "light"
                ? "border-ink-900/25 bg-white/60 text-ink-900 placeholder:text-ink-500 focus:border-ink-900 focus:ring-ink-900/20"
                : "border-ink-700 bg-ink-900 text-bone-50 placeholder:text-ink-500 focus:border-flame-500 focus:ring-flame-500/30",
              state.fieldErrors?.email &&
                (tone === "light"
                  ? "border-danger-500 focus:border-danger-500"
                  : "border-danger-500 focus:border-danger-500"),
            )}
          />
        </div>

        <NewsletterSubmit tone={tone} />
      </div>

      <p className="sr-only" role="status" aria-live="polite">
        {state.status === "success" ? state.message : ""}
      </p>

      {state.fieldErrors?.email ? (
        <p id={`${id}-error`} role="alert" className="text-2xs font-medium text-danger-400">
          {state.fieldErrors.email}
        </p>
      ) : null}

      {state.status === "error" && state.message ? (
        <p id={`${id}-message`} className="text-2xs font-medium text-danger-400">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}

function NewsletterSubmit({ tone }: { tone: "dark" | "light" }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={cn(
        "inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-sm px-5",
        "text-2xs font-bold uppercase tracking-[0.1em]",
        "transition-colors duration-200 active:translate-y-px",
        "disabled:pointer-events-none disabled:opacity-60",
        tone === "light"
          ? "bg-ink-950 text-bone-50 hover:bg-ink-900"
          : "bg-flame-500 text-ink-950 hover:bg-flame-400",
      )}
    >
      {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : null}
      {pending ? "Joining" : "Join the list"}
    </button>
  );
}