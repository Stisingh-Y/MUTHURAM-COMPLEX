"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";

/**
 * Newsletter signup.
 *
 * A single server action shared by the footer and the homepage band. Returns a
 * state object instead of throwing so the form can show inline feedback without
 * a navigation.
 *
 * On enumeration: subscribing an address that is already on the list is reported
 * as success, not as an error. Telling a stranger "that address is already
 * subscribed" turns a public form into a list-validation oracle.
 */

export type NewsletterState = {
  status: "idle" | "error" | "success";
  message?: string;
  fieldErrors?: Record<string, string>;
};

const schema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Enter your email address.")
    .email("That does not look like an email address."),
  source: z.string().trim().max(40).optional(),
});

export async function subscribeAction(
  _prev: NewsletterState,
  formData: FormData,
): Promise<NewsletterState> {
  const parsed = schema.safeParse({
    email: formData.get("email"),
    source: formData.get("source") ?? "footer",
  });

  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return {
      status: "error",
      fieldErrors: { email: issue?.message ?? "Check that address and try again." },
    };
  }

  const email = parsed.data.email.toLowerCase();

  try {
    await prisma.newsletterSubscriber.upsert({
      where: { email },
      update: {},
      create: { email, source: parsed.data.source ?? "footer" },
    });
  } catch {
    return {
      status: "error",
      message: "We could not save that address just now. Please try again, or email us directly.",
    };
  }

  revalidatePath("/");
  return {
    status: "success",
    message: "You are on the list. Look out for the next gear drop.",
  };
}