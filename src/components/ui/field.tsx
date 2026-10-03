import { cn } from "@/lib/utils";

/**
 * Text inputs.
 *
 * The label is always rendered (visually hidden is allowed for icon-only
 * contexts) and the error is wired through `aria-describedby` + `aria-invalid`
 * so screen readers announce the problem, not just sighted users see red.
 */

export type FieldProps = {
  id: string;
  name: string;
  label: string;
  error?: string;
  hint?: string;
  className?: string;
  wrapperClassName?: string;
  required?: boolean;
  defaultValue?: string | number;
  autoComplete?: string;
  type?: "text" | "email" | "password" | "tel" | "number" | "search" | "url";
  inputMode?: "text" | "email" | "tel" | "numeric" | "search" | "url";
  placeholder?: string;
  disabled?: boolean;
  readOnly?: boolean;
  maxLength?: number;
  min?: number;
  max?: number;
  step?: number;
  children?: React.ReactNode;
};

const controlBase = [
  "w-full rounded-sm bg-ink-900 text-bone-50",
  "border border-ink-700 px-3.5 py-2.5 text-sm",
  "placeholder:text-ink-500",
  "transition-colors duration-200",
  "hover:border-ink-600",
  "focus:border-flame-500 focus:outline-none focus:ring-2 focus:ring-flame-500/35",
  "disabled:cursor-not-allowed disabled:opacity-55",
].join(" ");

export function Field({
  id,
  name,
  label,
  error,
  hint,
  className,
  wrapperClassName,
  required,
  defaultValue,
  autoComplete,
  type = "text",
  inputMode,
  placeholder,
  disabled,
  readOnly,
  maxLength,
  min,
  max,
  step,
  children,
}: FieldProps) {
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;

  return (
    <div className={cn("flex flex-col gap-1.5", wrapperClassName)}>
      <label htmlFor={id} className="label-caps text-ink-300">
        {label}
        {required ? <span className="ml-1 text-flame-500">*</span> : null}
      </label>

      {children ?? (
        <input
          id={id}
          name={name}
          type={type}
          defaultValue={defaultValue}
          required={required}
          autoComplete={autoComplete}
          inputMode={inputMode}
          placeholder={placeholder}
          disabled={disabled}
          readOnly={readOnly}
          maxLength={maxLength}
          min={min}
          max={max}
          step={step}
          aria-invalid={error ? true : undefined}
          aria-describedby={cn(error && errorId, hint && hintId) || undefined}
          className={cn(controlBase, error && "border-danger-500 focus:border-danger-500 focus:ring-danger-500/30", className)}
        />
      )}

      {hint && !error ? (
        <p id={hintId} className="text-2xs text-ink-400">
          {hint}
        </p>
      ) : null}

      {error ? (
        <p id={errorId} role="alert" className="text-2xs font-medium text-danger-400">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function Textarea({
  id,
  name,
  label,
  error,
  hint,
  required,
  rows = 4,
  placeholder,
  defaultValue,
  className,
}: Omit<FieldProps, "inputMode" | "autoComplete" | "disabled" | "readOnly" | "inputMode"> & {
  rows?: number;
}) {
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="label-caps text-ink-300">
        {label}
        {required ? <span className="ml-1 text-flame-500">*</span> : null}
      </label>

      <textarea
        id={id}
        name={name}
        rows={rows}
        required={required}
        placeholder={placeholder}
        defaultValue={defaultValue}
        aria-invalid={error ? true : undefined}
        aria-describedby={cn(error && errorId, hint && hintId) || undefined}
        className={cn(controlBase, "resize-y", error && "border-danger-500", className)}
      />

      {hint && !error ? (
        <p id={hintId} className="text-2xs text-ink-400">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} role="alert" className="text-2xs font-medium text-danger-400">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function Select({
  id,
  name,
  label,
  error,
  defaultValue,
  options,
  required,
  className,
  children,
}: {
  id: string;
  name: string;
  label?: string;
  error?: string;
  defaultValue?: string;
  required?: boolean;
  className?: string;
  options?: { value: string; label: string; disabled?: boolean }[];
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      {label ? (
        <label htmlFor={id} className="label-caps text-ink-300">
          {label}
        </label>
      ) : null}

      <div className="relative">
        <select
          id={id}
          name={name}
          defaultValue={defaultValue}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className={cn(controlBase, "cursor-pointer appearance-none pr-9", error && "border-danger-500", className)}
        >
          {options?.map((option) => (
            <option key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </option>
          ))}
          {children}
        </select>
        {/* Chevron drawn with borders so it inherits the text colour. */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 border-ink-400 [border-width:0_1.5px_1.5px_0] [height:6px] [width:6px] rotate-45"
        />
      </div>

      {error ? (
        <p id={`${id}-error`} role="alert" className="text-2xs font-medium text-danger-400">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function Checkbox({
  id,
  name,
  label,
  defaultChecked,
  hint,
  error,
}: {
  id: string;
  name: string;
  label: React.ReactNode;
  defaultChecked?: boolean;
  hint?: string;
  error?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-start gap-2.5">
        <input
          id={id}
          name={name}
          type="checkbox"
          value="on"
          defaultChecked={defaultChecked}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
          className={[
            "mt-0.5 h-4 w-4 shrink-0 cursor-pointer appearance-none rounded-xs",
            "border border-ink-600 bg-ink-900",
            "checked:border-flame-500 checked:bg-flame-500",
            "bg-[length:11px] bg-center bg-no-repeat",
            "checked:bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 12 12%22><path d=%22M1.5 6.2l3 3L10.5 3%22 fill=%22none%22 stroke=%22%2308090a%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22/></svg>')]",
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flame-500",
          ].join(" ")}
        />
        <label htmlFor={id} className="cursor-pointer text-sm leading-5 text-ink-200">
          {label}
        </label>
      </div>

      {hint && !error ? (
        <p id={`${id}-hint`} className="text-2xs text-ink-400">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-2xs font-medium text-danger-400">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export { controlBase };