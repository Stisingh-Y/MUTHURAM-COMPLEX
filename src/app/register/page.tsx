import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthCard, AuthLink } from "@/components/auth/auth-card";
import { RegisterForm } from "@/components/auth/auth-forms";
import { getCurrentUser } from "@/lib/auth/session";
import { ROUTES, safeNext } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Create an account",
  description: "Join Muthuram Complex for faster checkout, order tracking and synced wishlists.",
  alternates: { canonical: ROUTES.auth.register },
};

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const user = await getCurrentUser();
  const { next } = await searchParams;
  if (user) redirect(safeNext(next, ROUTES.account.overview));

  return (
    <AuthCard
      eyebrow="Join the ride"
      title="Create an account"
      subtitle="One account for faster checkout, order tracking and a wishlist that follows you."
      footer={
        <>
          Already have an account? <AuthLink href={ROUTES.auth.login}>Sign in</AuthLink>
        </>
      }
    >
      <RegisterForm next={next} />
    </AuthCard>
  );
}
