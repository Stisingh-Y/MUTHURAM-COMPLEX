import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthCard, AuthLink } from "@/components/auth/auth-card";
import { LoginForm } from "@/components/auth/auth-forms";
import { getCurrentUser } from "@/lib/auth/session";
import { ROUTES, safeNext } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to track orders, check out faster and sync your wishlist.",
  alternates: { canonical: ROUTES.auth.login },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const user = await getCurrentUser();
  const { next } = await searchParams;
  const forward = safeNext(next, ROUTES.account.overview);
  if (user) redirect(forward);

  return (
    <AuthCard
      eyebrow="Welcome back"
      title="Sign in"
      subtitle="Orders, faster checkout and your wishlist — all in one place."
      footer={
        <>
          New to Muthuram Complex? <AuthLink href={ROUTES.auth.register}>Create an account</AuthLink>
        </>
      }
    >
      <LoginForm next={next} />
      <p className="mt-4 text-center text-sm text-ink-400">
        Forgot your password? <AuthLink href={ROUTES.auth.forgotPassword}>Reset it</AuthLink>
      </p>
    </AuthCard>
  );
}
