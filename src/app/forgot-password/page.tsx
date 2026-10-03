import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthCard, AuthLink } from "@/components/auth/auth-card";
import { ForgotPasswordForm } from "@/components/auth/auth-forms";
import { getCurrentUser } from "@/lib/auth/session";
import { ROUTES } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Forgot password",
  description: "Get a password reset link for your Muthuram Complex account.",
  alternates: { canonical: ROUTES.auth.forgotPassword },
};

export default async function ForgotPasswordPage() {
  const user = await getCurrentUser();
  if (user) redirect(ROUTES.account.overview);

  return (
    <AuthCard
      eyebrow="Locked out"
      title="Reset your password"
      subtitle="Enter the email you signed up with. If it has an account, a reset link good for one hour is on its way."
      footer={
        <>
          Remembered it? <AuthLink href={ROUTES.auth.login}>Back to sign in</AuthLink>
        </>
      }
    >
      <ForgotPasswordForm />
    </AuthCard>
  );
}
