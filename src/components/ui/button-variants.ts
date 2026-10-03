import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Button primitives.
 *
 * `Button` is a client component because it owns the pending state of whatever
 * action it submits; `ButtonLink` and the rest are server-safe. Splitting the
 * two keeps the client boundary as small as possible — the entire catalogue
 * grid stays a server component.
 */

export const buttonVariants = cva(
  [
    "relative inline-flex items-center justify-center gap-2 whitespace-nowrap",
    "font-semibold uppercase tracking-[0.08em]",
    "transition-[background-color,color,border-color,transform,box-shadow] duration-200 ease-(--ease-out-expo)",
    "disabled:pointer-events-none disabled:opacity-45",
    "active:scale-[0.98] motion-reduce:active:scale-100",
    // A hairline lift on hover reads as "pressable" without a shadow-heavy look.
    "hover:-translate-y-px motion-reduce:hover:translate-y-0",
  ].join(" "),
  {
    variants: {
      variant: {
        primary:
          "bg-flame-500 text-ink-950 hover:bg-flame-400 shadow-elevate hover:shadow-float",
        secondary:
          "bg-ink-100 text-ink-950 hover:bg-white",
        outline:
          "border border-ink-600 bg-transparent text-bone-50 hover:border-ink-400 hover:bg-ink-800",
        ghost: "bg-transparent text-ink-200 hover:bg-ink-800 hover:text-bone-50",
        link: "bg-transparent text-flame-400 underline-offset-4 hover:text-flame-300 hover:underline",
        danger: "bg-danger-500 text-white hover:bg-danger-400",
        /* Sits on light/bone surfaces — used by the auth screens. */
        onBone: "border border-ink-900 bg-ink-900 text-bone-50 hover:bg-ink-800",
      },
      size: {
        sm: "h-9 px-3 text-2xs",
        md: "h-11 px-5 text-xs",
        lg: "h-13 px-7 text-xs",
        xl: "h-15 px-9 text-sm",
        icon: "h-10 w-10 p-0",
        iconLg: "h-12 w-12 p-0",
      },
      block: {
        true: "w-full",
        false: "",
      },
    },
    defaultVariants: { variant: "primary", size: "md", block: false },
  },
);

export type ButtonVariantProps = VariantProps<typeof buttonVariants>;

export function buttonClasses(
  props: ButtonVariantProps & { className?: string } = {},
): string {
  // `className` is not a cva variant — strip it before delegating so the
  // overload resolution picks `ConfigVariants`.
  const { className, ...variants } = props;
  return cn(buttonVariants(variants), className);
}