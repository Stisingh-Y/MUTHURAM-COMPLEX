"use client";

import { useActionState } from "react";
import { Field } from "@/components/ui/field";
import { FormMessage } from "@/components/ui/form-message";
import {
  forgotPasswordAction,
  loginAction,
  registerAction,
  resetPasswordAction,
  type AuthActionState,
} from "@/app/auth/actions";

const IDLE: AuthActionState = { status: "idle" };

const submitClasses =
  "inline-flex h-12 w-full items-center justify-center bg-flame-500 text-2xs font-bold uppercase tracking-[0.12em] text-ink-950 transition-colors hover:bg-flame-400 disabled:cursor-not-allowed disabled:opacity-55 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flame-500";

function Submit({ pending, label, pendingLabel = "Working…" }: { pending: boolean; label: string; pendingLabel?: string }) {
  return (
    <button type="submit" disabled={pending} className={submitClasses}>
      {pending ? pendingLabel : label}
    </button>
  );
}

export function LoginForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState(loginAction, IDLE);
  return (
    <form action={action} className="flex flex-col gap-4">
      {next ? <input type="hidden" name="next" value={next} /> : null}
      <FormMessage status={state.status} message={state.message} />
      <Field id="login-email" name="email" label="Email address" type="email" autoComplete="email" required placeholder="rider@example.in" error={state.fieldErrors?.email} />
      <Field id="login-password" name="password" label="Password" type="password" autoComplete="current-password" required placeholder="Your password" error={state.fieldErrors?.password} />
      <Submit pending={pending} label="Sign in" pendingLabel="Signing in…" />
    </form>
  );
}

export function RegisterForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState(registerAction, IDLE);
  return (
    <form action={action} className="flex flex-col gap-4">
      {next ? <input type="hidden" name="next" value={next} /> : null}
      <FormMessage status={state.status} message={state.message} />
      <Field id="register-name" name="name" label="Full name" autoComplete="name" required maxLength={80} placeholder="Aarav Sharma" error={state.fieldErrors?.name} />
      <Field id="register-email" name="email" label="Email address" type="email" autoComplete="email" required placeholder="rider@example.in" error={state.fieldErrors?.email} />
      <Field id="register-phone" name="phone" label="Mobile number" type="tel" autoComplete="tel" inputMode="tel" maxLength={10} placeholder="10-digit mobile (optional)" hint="Used for delivery updates." error={state.fieldErrors?.phone} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="register-password" name="password" label="Password" type="password" autoComplete="new-password" required placeholder="Min. 10 characters" hint="10+ characters, upper, lower and a number." error={state.fieldErrors?.password} />
        <Field id="register-confirm" name="confirmPassword" label="Confirm password" type="password" autoComplete="new-password" required placeholder="Repeat it" error={state.fieldErrors?.confirmPassword} />
      </div>
      <label htmlFor="register-marketing" className="flex cursor-pointer items-start gap-2.5 text-sm text-ink-300">
        <input id="register-marketing" name="marketingOptIn" type="checkbox" value="on" className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer appearance-none border border-ink-600 bg-ink-900 checked:bg-flame-500" />
        Email me about new gear and rider offers.
      </label>
      <Submit pending={pending} label="Create account" pendingLabel="Creating…" />
    </form>
  );
}

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(forgotPasswordAction, IDLE);
  return (
    <form action={action} className="flex flex-col gap-4">
      <FormMessage status={state.status} message={state.message} />
      <Field id="forgot-email" name="email" label="Email address" type="email" autoComplete="email" required placeholder="rider@example.in" error={state.fieldErrors?.email} />
      <Submit pending={pending} label="Send reset link" pendingLabel="Sending…" />
    </form>
  );
}

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(resetPasswordAction, IDLE);
  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="token" value={token} />
      <FormMessage status={state.status} message={state.message} />
      <Field id="reset-password" name="password" label="New password" type="password" autoComplete="new-password" required placeholder="Min. 10 characters" hint="10+ characters, upper, lower and a number." error={state.fieldErrors?.password} />
      <Field id="reset-confirm" name="confirmPassword" label="Confirm new password" type="password" autoComplete="new-password" required placeholder="Repeat it" error={state.fieldErrors?.confirmPassword} />
      <Submit pending={pending} label="Set new password" pendingLabel="Saving…" />
    </form>
  );
}
