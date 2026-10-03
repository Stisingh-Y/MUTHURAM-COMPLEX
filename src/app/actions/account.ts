"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { ROUTES } from "@/lib/routes";

/**
 * Account self-service actions.
 *
 * Every mutation is scoped to the signed-in rider (`requireUser`), so one
 * customer can never touch another's profile or addresses by guessing ids.
 */

export type AccountActionState = {
  status: "idle" | "error" | "success";
  message?: string;
  fieldErrors?: Record<string, string>;
};

const IDLE_MESSAGE = "That did not look right — check the highlighted fields.";

function fieldErrorsFrom(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "form";
    if (!errors[key]) errors[key] = issue.message;
  }
  return errors;
}

// ── Profile ────────────────────────────────────────────────────────────────

const profileSchema = z.object({
  name: z.string().trim().min(2, "Tell us your name.").max(80, "That name is too long."),
  phone: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, "Enter a 10-digit Indian mobile number.")
    .or(z.literal("")),
});

export async function updateProfileAction(
  _prev: AccountActionState,
  formData: FormData,
): Promise<AccountActionState> {
  const user = await requireUser();
  const parsed = profileSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone") ?? "",
  });

  if (!parsed.success) {
    return { status: "error", message: IDLE_MESSAGE, fieldErrors: fieldErrorsFrom(parsed.error) };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { name: parsed.data.name, phone: parsed.data.phone || null },
  });

  revalidatePath(ROUTES.account.overview, "layout");
  return { status: "success", message: "Profile updated." };
}

// ── Addresses ──────────────────────────────────────────────────────────────

const addressSchema = z.object({
  label: z.string().trim().max(24).optional(),
  fullName: z.string().trim().min(2, "Enter the recipient's name.").max(80),
  phone: z.string().trim().regex(/^[6-9]\d{9}$/, "Enter a 10-digit Indian mobile number."),
  line1: z.string().trim().min(4, "Enter the street address.").max(160),
  line2: z.string().trim().max(160).optional(),
  landmark: z.string().trim().max(120).optional(),
  city: z.string().trim().min(2, "Enter the city.").max(80),
  state: z.string().trim().min(2, "Enter the state.").max(80),
  pincode: z.string().trim().regex(/^[1-9]\d{5}$/, "Enter a 6-digit pincode."),
});

const idSchema = z.object({ addressId: z.string().trim().min(1) });

export async function addAddressAction(
  _prev: AccountActionState,
  formData: FormData,
): Promise<AccountActionState> {
  const user = await requireUser();
  const parsed = addressSchema.safeParse({
    label: formData.get("label") || undefined,
    fullName: formData.get("fullName"),
    phone: formData.get("phone"),
    line1: formData.get("line1"),
    line2: formData.get("line2") || undefined,
    landmark: formData.get("landmark") || undefined,
    city: formData.get("city"),
    state: formData.get("state"),
    pincode: formData.get("pincode"),
  });

  if (!parsed.success) {
    return { status: "error", message: IDLE_MESSAGE, fieldErrors: fieldErrorsFrom(parsed.error) };
  }

  const existing = await prisma.address.count({ where: { userId: user.id } });

  await prisma.address.create({
    data: {
      userId: user.id,
      label: parsed.data.label || "Home",
      fullName: parsed.data.fullName,
      phone: parsed.data.phone,
      line1: parsed.data.line1,
      line2: parsed.data.line2 || null,
      landmark: parsed.data.landmark || null,
      city: parsed.data.city,
      state: parsed.data.state,
      pincode: parsed.data.pincode,
      // First address becomes the default so checkout has somewhere to send the order.
      isDefault: existing === 0,
    },
  });

  revalidatePath(ROUTES.account.addresses, "layout");
  return { status: "success", message: "Address saved." };
}

export async function setDefaultAddressAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const parsed = idSchema.safeParse({ addressId: formData.get("addressId") });
  if (!parsed.success) return;

  const owned = await prisma.address.findFirst({
    where: { id: parsed.data.addressId, userId: user.id },
    select: { id: true },
  });
  if (!owned) return;

  await prisma.$transaction([
    prisma.address.updateMany({ where: { userId: user.id }, data: { isDefault: false } }),
    prisma.address.update({ where: { id: owned.id }, data: { isDefault: true } }),
  ]);

  revalidatePath(ROUTES.account.addresses, "layout");
}

export async function deleteAddressAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const parsed = idSchema.safeParse({ addressId: formData.get("addressId") });
  if (!parsed.success) return;

  const owned = await prisma.address.findFirst({
    where: { id: parsed.data.addressId, userId: user.id },
    select: { id: true, isDefault: true },
  });
  if (!owned) return;

  await prisma.$transaction(async (tx) => {
    await tx.address.delete({ where: { id: owned.id } });
    if (owned.isDefault) {
      const next = await tx.address.findFirst({
        where: { userId: user.id },
        orderBy: { createdAt: "asc" },
        select: { id: true },
      });
      if (next) await tx.address.update({ where: { id: next.id }, data: { isDefault: true } });
    }
  });

  revalidatePath(ROUTES.account.addresses, "layout");
}
