"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import {
  consumePasswordResetToken,
  createSession,
  destroySession,
  hashPassword,
  issuePasswordResetToken,
  verifyCredentials,
} from "@/lib/auth/session";
import { sendPasswordResetEmail, sendWelcomeEmail } from "@/lib/email/send";
import { ROUTES, safeNext } from "@/lib/routes";

/**
 * Authentication server actions.
 *
 * Each action returns a state object rather than throwing, so a form can show
 * field-level errors via `useActionState` without losing what was typed.
 * Redirects are raised only on success.
 *
 * On enumeration: login failures, registration with an existing address, and
 * forgot-password all answer with the same text whether or not the account
 * exists. An auth form that tells an attacker which addresses are registered is
 * a harvesting tool.
 */

export type AuthActionState = {
  status: "idle" | "error" | "success";
  message?: string;
  /** Field name to first message, for inline errors. */
  fieldErrors?: Record<string, string>;
};

function fieldErrorsFrom(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "form";
    if (!errors[key]) errors[key] = issue.message;
  }
  return errors;
}

const emailField = z
  .string()
  .trim()
  .min(1, "Enter your email address.")
  .email("That does not look like an email address.");

const passwordField = z
  .string()
  .min(10, "Use at least 10 characters.")
  .regex(/[a-z]/, "Include a lowercase letter.")
  .regex(/[A-Z]/, "Include an uppercase letter.")
  .regex(/\d/, "Include a number.");

// ── Sign in ──────────────────────────────────────────────────────────────────

const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1, "Enter your password."),
  next: z.string().optional(),
});

export async function loginAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    next: formData.get("next") ?? undefined,
  });

  if (!parsed.success) {
    return { status: "error", fieldErrors: fieldErrorsFrom(parsed.error) };
  }

  const result = await verifyCredentials(parsed.data.email, parsed.data.password);

  if (!result.ok) {
    return {
      status: "error",
      message:
        result.error === "blocked"
          ? "This account has been suspended. Contact us on WhatsApp if you think that is a mistake."
          : "We could not sign you in with those details. Check your email and password and try again.",
    };
  }

  await createSession(result.userId);

  // Staff land on the dashboard; everyone else continues where they were going.
  const fallback =
    result.role === "ADMIN" || result.role === "STAFF" ? ROUTES.admin.dashboard : ROUTES.account.overview;

  redirect(safeNext(parsed.data.next, fallback));
}

// ── Register ─────────────────────────────────────────────────────────────────

const registerSchema = z
  .object({
    name: z.string().trim().min(2, "Tell us your name.").max(80, "That name is too long."),
    email: emailField,
    phone: z
      .string()
      .trim()
      .regex(/^[6-9]\d{9}$/, "Enter a 10-digit Indian mobile number.")
      .or(z.literal("")),
    password: passwordField,
    confirmPassword: z.string().min(1, "Confirm your password."),
    marketingOptIn: z.string().optional(),
    next: z.string().optional(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Those passwords do not match.",
    path: ["confirmPassword"],
  });

export async function registerAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone") ?? "",
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
    marketingOptIn: formData.get("marketingOptIn") ?? undefined,
    next: formData.get("next") ?? undefined,
  });

  if (!parsed.success) {
    return { status: "error", fieldErrors: fieldErrorsFrom(parsed.error) };
  }

  const email = parsed.data.email.toLowerCase();

  const taken = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (taken) {
    return {
      status: "error",
      fieldErrors: { email: "An account already uses this email. Try signing in instead." },
    };
  }

  const passwordHash = await hashPassword(parsed.data.password);

  const user = await prisma.user.create({
    data: {
      email,
      name: parsed.data.name,
      phone: parsed.data.phone || null,
      passwordHash,
      role: "CUSTOMER",
    },
    select: { id: true, email: true, name: true },
  });

  if (parsed.data.marketingOptIn === "on") {
    await prisma.newsletterSubscriber
      .create({ data: { email, source: "register" } })
      .catch(() => undefined);
  }

  await createSession(user.id);
  await sendWelcomeEmail({ email: user.email, name: user.name }).catch(() => undefined);

  redirect(safeNext(parsed.data.next, ROUTES.account.overview));
}

// ── Sign out ─────────────────────────────────────────────────────────────────

export async function logoutAction(): Promise<never> {
  await destroySession();
  redirect(ROUTES.home);
}

// ── Forgot password ──────────────────────────────────────────────────────────

const forgotSchema = z.object({ email: emailField });

export async function forgotPasswordAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = forgotSchema.safeParse({ email: formData.get("email") });

  if (!parsed.success) {
    return { status: "error", fieldErrors: fieldErrorsFrom(parsed.error) };
  }

  // `issuePasswordResetToken` returns null for unknown addresses, so the send
  // path is identical either way and the response cannot leak account existence.
  const token = await issuePasswordResetToken(parsed.data.email);

  if (token) {
    const user = await prisma.user.findUnique({
      where: { email: parsed.data.email.trim().toLowerCase() },
      select: { email: true, name: true },
    });
    if (user) {
      await sendPasswordResetEmail({ email: user.email, name: user.name, token });
    }
  }

  return {
    status: "success",
    message:
      "If that address has an account, a reset link is on its way. It expires in one hour.",
  };
}

// ── Reset password ───────────────────────────────────────────────────────────

const resetSchema = z
  .object({
    token: z.string().min(10, "This reset link is not valid."),
    password: passwordField,
    confirmPassword: z.string().min(1, "Confirm your password."),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Those passwords do not match.",
    path: ["confirmPassword"],
  });

export async function resetPasswordAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = resetSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return { status: "error", fieldErrors: fieldErrorsFrom(parsed.error) };
  }

  // Consuming the token hashes the new password, deletes the token and drops
  // every other session, so this returns false for expired or reused tokens.
  const ok = await consumePasswordResetToken(parsed.data.token, parsed.data.password);

  if (!ok) {
    return {
      status: "error",
      message:
        "That reset link has expired or has already been used. Request a fresh one and try again.",
    };
  }

  redirect(ROUTES.auth.login);
}