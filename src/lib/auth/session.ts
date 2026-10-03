import "server-only";

import { cookies, headers } from "next/headers";
import { cache } from "react";
import { redirect } from "next/navigation";
import { compare, hash } from "bcryptjs";
import { prisma } from "@/lib/db";
import { serverEnv } from "@/lib/env";
import { isUserRole, type UserRole } from "@/lib/enums";

/**
 * Session strategy
 * ----------------
 * A random 32-byte token is generated per sign-in, stored hashed in the
 * database, and handed to the browser inside an httpOnly, SameSite=Lax,
 * Secure-in-production cookie. The cookie value is `<token>.<sessionId>` so
 * session lookups are a single indexed query, and rotating the cookie on every
 * privilege change (password change, sign-out-all) is trivial.
 *
 * No JWT is used: revocation has to be immediate for an admin surface, and a
 * server-side session record is the honest way to get that.
 */

const SESSION_COOKIE = "mc_session";
const SESSION_TTL_DAYS = 30;
const RESET_TTL_MINUTES = 60;

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: UserRole;
  sessionId: string;
};

function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_DAYS * 24 * 60 * 60,
  };
}

function randomToken(bytes = 32): string {
  const buffer = new Uint8Array(bytes);
  crypto.getRandomValues(buffer);
  return Buffer.from(buffer).toString("base64url");
}

/** SHA-256 is appropriate here: the token is already 256 bits of entropy. */
async function hashToken(token: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  return Buffer.from(digest).toString("hex");
}

async function requestContext(): Promise<{ userAgent: string | null; ipAddress: string | null }> {
  const headerList = await headers();
  const forwarded = headerList.get("x-forwarded-for");
  return {
    userAgent: headerList.get("user-agent"),
    ipAddress: forwarded ? (forwarded.split(",")[0] ?? "").trim() || null : null,
  };
}

// ── Sign in / out ────────────────────────────────────────────────────────────

export async function createSession(userId: string): Promise<void> {
  const token = randomToken();
  const tokenHash = await hashToken(token);
  const { userAgent, ipAddress } = await requestContext();
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 86_400_000);

  const session = await prisma.session.create({
    data: { userId, tokenHash, userAgent, ipAddress, expiresAt },
    select: { id: true },
  });

  await prisma.user.update({
    where: { id: userId },
    data: { lastLoginAt: new Date() },
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, `${token}.${session.id}`, cookieOptions());
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(SESSION_COOKIE)?.value;

  if (raw) {
    const [token, sessionId] = raw.split(".");
    if (token && sessionId) {
      await prisma.session
        .deleteMany({
          where: { id: sessionId, tokenHash: await hashToken(token) },
        })
        .catch(() => undefined);
    }
  }

  cookieStore.delete(SESSION_COOKIE);
}

/** Invalidate every session for a user, e.g. after a password change. */
export async function destroyAllSessions(userId: string): Promise<void> {
  await prisma.session.deleteMany({ where: { userId } });
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

/**
 * Resolves the current user from the session cookie.
 *
 * Wrapped in React `cache` so a layout, a page and two server actions in the
 * same render each hit the database at most once.
 */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const cookieStore = await cookies();
  const raw = cookieStore.get(SESSION_COOKIE)?.value;
  if (!raw) return null;

  const [token, sessionId] = raw.split(".");
  if (!token || !sessionId) return null;

  const session = await prisma.session.findFirst({
    where: { id: sessionId, tokenHash: await hashToken(token) },
    select: {
      id: true,
      expiresAt: true,
      user: {
        select: { id: true, email: true, name: true, phone: true, role: true, isBlocked: true },
      },
    },
  });

  if (!session || session.expiresAt < new Date() || session.user.isBlocked) return null;
  if (!isUserRole(session.user.role)) return null;

  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    phone: session.user.phone,
    role: session.user.role,
    sessionId: session.id,
  };
});

/** Throws a redirect when there is no signed-in user. Use in server actions. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/account");
  return user;
}

/** Throws a redirect unless the caller is staff or an admin. */
export async function requireAdmin(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/admin");
  if (user.role !== "ADMIN" && user.role !== "STAFF") redirect("/account");
  return user;
}

/** Throws a redirect unless the caller is a full admin (not staff). */
export async function requireSuperAdmin(): Promise<SessionUser> {
  const user = await requireAdmin();
  if (user.role !== "ADMIN") redirect("/admin");
  return user;
}

// ── Credentials ──────────────────────────────────────────────────────────────

export type CredentialsResult =
  | { ok: true; userId: string; role: UserRole }
  | { ok: false; error: "invalid" | "blocked" };

export async function verifyCredentials(
  email: string,
  password: string,
): Promise<CredentialsResult> {
  const user = await prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() },
    select: { id: true, passwordHash: true, isBlocked: true, role: true },
  });

  // Always run a comparison so a missing account and a wrong password take
  // roughly the same time, and cannot be told apart by a stopwatch.
  const hash = user?.passwordHash ?? "$2a$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidi";
  const matches = await compare(password, hash);

  if (!user || !matches) return { ok: false, error: "invalid" };
  if (user.isBlocked) return { ok: false, error: "blocked" };
  if (!isUserRole(user.role)) return { ok: false, error: "invalid" };
  return { ok: true, userId: user.id, role: user.role };
}

export async function hashPassword(password: string): Promise<string> {
  return hash(password, 10);
}

// ── Password reset ───────────────────────────────────────────────────────────

/**
 * Issues a reset token. The raw token is returned so the caller can email it;
 * only its hash is persisted.
 *
 * Nothing is returned for an unknown address, so this function cannot be used to
 * enumerate which emails have accounts.
 */
export async function issuePasswordResetToken(email: string): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() },
    select: { id: true },
  });
  if (!user) return null;

  const token = randomToken(24);
  const tokenHash = await hashToken(token);

  await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });
  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt: new Date(Date.now() + RESET_TTL_MINUTES * 60_000),
    },
  });

  return token;
}

export async function consumePasswordResetToken(token: string, newPassword: string): Promise<boolean> {
  const tokenHash = await hashToken(token);
  const record = await prisma.passwordResetToken.findFirst({
    where: { tokenHash },
    select: { id: true, userId: true, expiresAt: true },
  });

  if (!record || record.expiresAt < new Date()) return false;

  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { passwordHash: await hashPassword(newPassword) },
    }),
    prisma.passwordResetToken.delete({ where: { id: record.id } }),
  ]);

  // A password reset should also clear any other active sessions.
  await prisma.session.deleteMany({ where: { userId: record.userId } });

  return true;
}

/** Removes expired sessions and reset tokens. Called opportunistically. */
export async function pruneExpiredAuthRecords(): Promise<void> {
  const now = new Date();
  await prisma.session.deleteMany({ where: { expiresAt: { lt: now } } });
  await prisma.passwordResetToken.deleteMany({ where: { expiresAt: { lt: now } } });
}

/** Sanity check that the auth secret is usable, surfaced on boot. */
export function authConfigured(): boolean {
  return serverEnv().authSecret.length >= 16;
}
