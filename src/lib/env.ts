/**
 * Typed, validated access to the server environment.
 *
 * Everything the app needs is read exactly once, here, so a missing or
 * malformed variable fails fast with an actionable message instead of
 * surfacing as `undefined` deep inside a request.
 *
 * `server-only` is deliberately not imported: this module is also used by
 * build-time scripts (seed, image generation). Server-only secrets are
 * separated into `serverEnv()` below.
 */
import { z } from "zod";

/** Values that are safe to reference from the browser bundle. */
const publicSchema = z.object({
  appUrl: z.string().url(),
  whatsappNumber: z.string().min(1),
  storePhone: z.string().min(1),
  storeEmail: z.string().email(),
  storeName: z.string().min(1),
  instagramUrl: z.string().url(),
  facebookUrl: z.string().url(),
  youtubeUrl: z.string().url(),
  mapsEmbedUrl: z.string(),
});

/** Secrets. Never import `serverEnv()` from a Client Component. */
const serverSchema = z.object({
  databaseUrl: z.string().min(1),
  authSecret: z.string().min(16, "AUTH_SECRET must be at least 16 characters"),
  razorpayKeyId: z.string(),
  razorpayKeySecret: z.string(),
  razorpayWebhookSecret: z.string(),
  smtpUrl: z.string(),
  mailFrom: z.string().min(1),
  storageEndpoint: z.string(),
  storageRegion: z.string(),
  storageBucket: z.string(),
  storageAccessKeyId: z.string(),
  storageSecretAccessKey: z.string(),
  storagePublicUrl: z.string(),
});

function required(name: string, value: string | undefined): string {
  if (!value || value.trim().length === 0) {
    throw new Error(
      `Missing required environment variable ${name}. Copy .env.example to .env.local and fill it in.`,
    );
  }
  return value;
}

function parse<T>(schema: z.ZodType<T>, source: Record<string, string | undefined>, label: string): T {
  const result = schema.safeParse(source);
  if (result.success) return result.data;

  const issues = result.error.issues
    .map((issue) => `  - ${issue.path.join(".") || "(root)"}: ${issue.message}`)
    .join("\n");
  throw new Error(`Invalid ${label} configuration:\n${issues}`);
}

export function publicEnv(): z.infer<typeof publicSchema> {
  return parse(
    publicSchema,
    {
      appUrl: (process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL ?? "").replace(/\/$/, ""),
      whatsappNumber: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "",
      storePhone: process.env.NEXT_PUBLIC_STORE_PHONE ?? "",
      storeEmail: process.env.NEXT_PUBLIC_STORE_EMAIL ?? "",
      storeName: process.env.NEXT_PUBLIC_STORE_NAME ?? "Muthuram Complex",
      instagramUrl: process.env.NEXT_PUBLIC_INSTAGRAM_URL ?? "",
      facebookUrl: process.env.NEXT_PUBLIC_FACEBOOK_URL ?? "",
      youtubeUrl: process.env.NEXT_PUBLIC_YOUTUBE_URL ?? "",
      mapsEmbedUrl: process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_URL ?? "",
    },
    "public environment",
  );
}

export function serverEnv(): z.infer<typeof serverSchema> {
  return parse(
    serverSchema,
    {
      databaseUrl: required("DATABASE_URL", process.env.DATABASE_URL),
      authSecret: required("AUTH_SECRET", process.env.AUTH_SECRET),
      razorpayKeyId: process.env.RAZORPAY_KEY_ID ?? "",
      razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET ?? "",
      razorpayWebhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET ?? "",
      smtpUrl: process.env.SMTP_URL ?? "",
      mailFrom: process.env.MAIL_FROM ?? "Muthuram Complex <no-reply@muthuramcomplex.com>",
      storageEndpoint: process.env.STORAGE_ENDPOINT ?? "",
      storageRegion: process.env.STORAGE_REGION ?? "",
      storageBucket: process.env.STORAGE_BUCKET ?? "",
      storageAccessKeyId: process.env.STORAGE_ACCESS_KEY_ID ?? "",
      storageSecretAccessKey: process.env.STORAGE_SECRET_ACCESS_KEY ?? "",
      storagePublicUrl: process.env.STORAGE_PUBLIC_URL ?? "",
    },
    "server environment",
  );
}

/** True when the app is talking to PostgreSQL rather than the local SQLite file. */
export function isPostgresDatabase(): boolean {
  return /^(postgres|postgresql):/i.test(process.env.DATABASE_URL ?? "");
}

/** Razorpay is considered configured once both key halves are present. */
export function isRazorpayConfigured(): boolean {
  return Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
}

/** Object storage is optional; the admin uploader falls back to local disk. */
export function isObjectStorageConfigured(): boolean {
  return Boolean(
    process.env.STORAGE_ENDPOINT &&
      process.env.STORAGE_BUCKET &&
      process.env.STORAGE_ACCESS_KEY_ID &&
      process.env.STORAGE_SECRET_ACCESS_KEY,
  );
}

export type PublicEnv = z.infer<typeof publicSchema>;
export type ServerEnv = z.infer<typeof serverSchema>;