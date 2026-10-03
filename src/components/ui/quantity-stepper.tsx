"use client";

import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Quantity stepper.
 *
 * A real `<input type="number">` under the chrome, so it stays keyboard
 * accessible, announces its value to screen readers and is submitted with the
 * surrounding form. The −/+ buttons are `type="button"` and only nudge the
 * value; the browser's native number spinners are hidden because they are
 * unusable on touch.
 */
export function QuantityStepper({
  name,
  value,
  min = 1,
  max = 10,
  onChange,
  disabled = false,
  label = "Quantity",
  size = "md",
  className,
}: {
  name?: string;
  value: number;
  min?: number;
  max?: number;
  onChange?: (next: number) => void;
  disabled?: boolean;
  label?: string;
  size?: "sm" | "md";
  className?: string;
}) {
  const clamp = (next: number) => Math.min(max, Math.max(min, next));
  const height = size === "sm" ? "h-8" : "h-10";
  const buttonSize = size === "sm" ? "h-8 w-8" : "h-10 w-10";

  const nudge = (delta: number) => {
    const next = clamp(value + delta);
    if (next !== value) onChange?.(next);
  };

  return (
    <div
      className={cn(
        "inline-flex items-stretch overflow-hidden rounded-sm border border-ink-700 bg-ink-900",
        "focus-within:border-flame-500 focus-within:ring-2 focus-within:ring-flame-500/30",
        height,
        className,
      )}
    >
      <button
        type="button"
        onClick={() => nudge(-1)}
        disabled={disabled || value <= min}
        aria-label={`Decrease ${label.toLowerCase()}`}
        className={cn(
          "flex shrink-0 items-center justify-center border-r border-ink-700 text-ink-300",
          "transition-colors duration-200 hover:bg-ink-800 hover:text-bone-50",
          "disabled:pointer-events-none disabled:opacity-35",
          buttonSize,
        )}
      >
        <Minus className="h-3.5 w-3.5" aria-hidden="true" />
      </button>

      <input
        type="number"
        name={name}
        value={value}
        min={min}
        max={max}
        step={1}
        disabled={disabled}
        readOnly={!onChange}
        onChange={(event) => {
          const parsed = Number.parseInt(event.target.value, 10);
          if (Number.isFinite(parsed)) onChange?.(clamp(parsed));
        }}
        aria-label={label}
        className={cn(
          "w-12 bg-transparent text-center text-sm font-semibold tabular-nums text-bone-50",
          "[appearance:textfield] focus:outline-none",
          "[&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
          size === "sm" ? "w-10" : "w-14",
        )}
      />

      <button
        type="button"
        onClick={() => nudge(1)}
        disabled={disabled || value >= max}
        aria-label={`Increase ${label.toLowerCase()}`}
        className={cn(
          "flex shrink-0 items-center justify-center border-l border-ink-700 text-ink-300",
          "transition-colors duration-200 hover:bg-ink-800 hover:text-bone-50",
          "disabled:pointer-events-none disabled:opacity-35",
          buttonSize,
        )}
      >
        <Plus className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
    </div>
  );
}