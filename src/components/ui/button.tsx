import Link from "next/link";
import { cn } from "@/lib/utils";
import { buttonVariants, type ButtonVariantProps } from "@/components/ui/button-variants";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

type CommonProps = ButtonVariantProps & {
  className?: string;
  children: ReactNode;
};

/**
 * `className` last so it wins in the `cn` merge against the variant defaults.
 * Variant props are stripped from `rest` before it reaches the DOM, otherwise
 * React renders `variant="primary"` / `size="lg"` as invalid attributes on
 * `<button>`.
 */
function classesFor({
  className,
  children: _children,
  ...variants
}: CommonProps): string {
  return cn(buttonVariants(variants), className);
}

/** Next.js link styled as a button. Server-safe: no client boundary. */
export function ButtonLink({
  className,
  children,
  href,
  prefetch,
  scroll,
  ...variants
}: CommonProps & { href: string; prefetch?: boolean; scroll?: boolean }) {
  return (
    <Link
      href={href}
      prefetch={prefetch}
      scroll={scroll}
      className={classesFor({ ...variants, className, children })}
    >
      {children}
    </Link>
  );
}

/** External link: forces new tab, adds rel hardening and an accessible hint. */
export function ButtonLinkExternal({
  className,
  children,
  href,
  ...variants
}: CommonProps & { href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={classesFor({ ...variants, className, children })}
    >
      {children}
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}

/** Plain button for client components (menus, dialogs, forms). */
export function Button({
  className,
  children,
  variant,
  size,
  block: _block,
  ...props
}: CommonProps &
  Omit<ComponentPropsWithoutRef<"button">, "children" | "className" | "color">) {
  return (
    <button className={classesFor({ variant, size, className, children })} {...props}>
      {children}
    </button>
  );
}