"use client";

import { useEffect, useRef } from "react";

/**
 * Instant filter submit.
 *
 * The facet controls live in a plain GET form, so the filters work with
 * JavaScript disabled. This only removes the extra click: it submits the form
 * whenever a control changes, and clears the `page` field first so narrowing a
 * result set never lands the rider on an out-of-range page.
 *
 * Attached via a `change` listener on the form rather than an `onChange` on
 * every control, so the panel stays a server component and there is one place
 * to reason about submission.
 */
export function FilterAutoSubmit() {
  const anchorRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const form = anchorRef.current?.closest("form");
    if (!form) return;

    const onChange = (event: Event) => {
      const target = event.target as HTMLInputElement | HTMLSelectElement | null;
      if (!target) return;

      // Text inputs fire `change` on blur, which is fine, but a range/colour
      // input would fire on every drag step — those are not used here yet.
      if (target instanceof HTMLInputElement && target.type === "number") {
        return;
      }

      // Any filter edit starts the result set again from page one.
      for (const field of form.querySelectorAll<HTMLInputElement>('input[name="page"]')) {
        field.value = "";
      }

      form.requestSubmit();
    };

    form.addEventListener("change", onChange);
    return () => form.removeEventListener("change", onChange);
  }, []);

  return <span ref={anchorRef} aria-hidden="true" className="hidden" />;
}