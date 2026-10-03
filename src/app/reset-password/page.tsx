import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthCard, AuthLink } from "@/components/auth/auth-card";
import { ResetPasswordForm } from "@/components/auth/auth-forms";
import { getCurrentUser } from "@/lib/auth/session";
import { ROUTES } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Set a new password",
  robots: { index: false, follow: false },
};

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const user = await getCurrentUser();
  if (user) redirect(ROUTES.account.overview);

  const { token } = await searchParams;

  if (!token) {
    return (
      <AuthCard
        eyebrow="Link missing"
        title="That reset link is incomplete"
        subtitle="Reset links carry a token. Open the full link from your email, or request a fresh one."
        footer={
          <>
            <AuthLink href={ROUTES.auth.forgotPassword}>Request a new link</AuthLink>
          </>
        }
      >
        <p className="border border-danger-500/45 bg-danger-500/10 px-3.5 py-3 text-sm text-danger-400" role="alert">
          No reset token was found in this URL.
        </p>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      eyebrow="Almost done"
      title="Set a new password"
      subtitle="Pick something strong — 10+ characters with upper, lower and a number."
      footer={
        <>
          Changed your mind? <AuthLink href={ROUTES.auth.login}>Back to sign in</AuthLink>
        </>
      }
    >
      <ResetPasswordForm token={token} />
    </AuthCard>
  );
}
