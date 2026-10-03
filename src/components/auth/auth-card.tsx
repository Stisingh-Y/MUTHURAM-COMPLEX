import Link from "next/link";

/**
 * Centered card shell for the auth screens.
 *
 * Dark card on the dark page, square corners and a hairline border like every
 * other surface — the only orange is the submit button inside the form.
 */
export function AuthCard({
  eyebrow,
  title,
  subtitle,
  children,
  footer,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <div className="container-page py-12 sm:py-16">
      <div className="mx-auto w-full max-w-md border border-ink-850 bg-ink-900/50 p-6 sm:p-8">
        <p className="label-caps text-flame-500">{eyebrow}</p>
        <h1 className="mt-1 font-display text-2xl font-extrabold tracking-[-0.01em] text-bone-50 sm:text-3xl">
          {title}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-400">{subtitle}</p>
        <div className="mt-6">{children}</div>
        <div className="mt-6 border-t border-ink-800 pt-5 text-center text-sm text-ink-400">
          {footer}
        </div>
      </div>
    </div>
  );
}

export function AuthLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="font-semibold text-flame-400 underline-offset-4 transition-colors hover:text-flame-300 hover:underline">
      {children}
    </Link>
  );
}
