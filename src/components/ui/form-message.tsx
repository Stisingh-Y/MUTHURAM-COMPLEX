import { cn } from "@/lib/utils";

/**
 * Form-level status banner.
 *
 * `role="alert"` means a failed submit is announced immediately rather than
 * waiting for the rider to hunt for the red text. Errors are not colour-only:
 * there is an icon and a word ("Something went wrong") alongside the colour.
 */
export function FormMessage({
  status,
  message,
  className,
}: {
  status: "idle" | "error" | "success";
  message?: string;
  className?: string;
}) {
  if (status === "idle" || !message) return null;

  const isError = status === "error";

  return (
    <div
      role="alert"
      aria-live="polite"
      className={cn(
        "flex items-start gap-2.5 rounded-sm border px-3.5 py-3 text-sm",
        isError
          ? "border-danger-500/45 bg-danger-500/10 text-danger-400"
          : "border-success-500/45 bg-success-500/10 text-success-400",
        className,
      )}
    >
      <span aria-hidden="true" className="mt-0.5 shrink-0">
        {isError ? (
          <svg viewBox="0 0 20 20" className="h-4 w-4 fill-current">
            <path d="M10 1.6 19 17H1L10 1.6Zm0 4.6a.9.9 0 0 0-.9.95l.25 4.1a.65.65 0 0 0 1.3 0l.25-4.1A.9.9 0 0 0 10 6.2Zm0 8.1a1 1 0 1 0 0 2 1 1 0 0 0 0-2Z" />
          </svg>
        ) : (
          <svg viewBox="0 0 20 20" className="h-4 w-4 fill-current">
            <path d="M10 1a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm4.7 6.7-5.4 5.4a1 1 0 0 1-1.4 0L5.3 10.5a1 1 0 1 1 1.4-1.4l2.1 2.1 4.7-4.7a1 1 0 1 1 1.4 1.4Z" />
          </svg>
        )}
      </span>
      <div className="flex flex-col gap-0.5">
        <span className="label-caps">
          {isError ? "Something went wrong" : "Done"}
        </span>
        <span className="text-sm text-bone-100">{message}</span>
      </div>
    </div>
  );
}

/** Two-column layout for paired fields on a bone background. */
export function FormShell({
  children,
  title,
  subtitle,
  className,
}: {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  className?: string;
}) {
  return (
    <div className={cn("mx-auto w-full max-w-md", className)}>
      <header className="mb-7">
        <h1 className="text-2xl text-ink-950">{title}</h1>
        {subtitle ? <p className="mt-1.5 text-sm text-ink-600">{subtitle}</p> : null}
      </header>
      {children}
    </div>
  );
}