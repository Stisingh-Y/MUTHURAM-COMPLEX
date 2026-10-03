import "server-only";

import { publicEnv, serverEnv } from "@/lib/env";
import { ROUTES } from "@/lib/routes";

/**
 * Transactional email.
 *
 * Delivery is best effort and never allowed to break a user-facing flow: if SMTP
 * is not configured the message is written to the server log instead, so local
 * development works without credentials. Reset links are logged at `info` level
 * because there is no inbox to receive them in development.
 */

type EmailResult = { delivered: boolean; reason?: string };

const RESET_SUBJECT = "Reset your Muthuram Complex password";
const WELCOME_SUBJECT = "Welcome to Muthuram Complex";

async function sendMail(input: {
  to: string;
  subject: string;
  text: string;
  html: string;
}): Promise<EmailResult> {
  const env = serverEnv();

  if (!env.smtpUrl) {
    console.info(`[email:skipped] to=${input.to} subject=${input.subject}`);
    return { delivered: false, reason: "smtp-not-configured" };
  }

  try {
    // nodemailer is loaded lazily so the app boots without SMTP configured.
    const { createTransport } = await import("nodemailer");
    const transport = createTransport(env.smtpUrl);

    await transport.sendMail({
      from: env.mailFrom,
      to: input.to,
      subject: input.subject,
      text: input.text,
      html: input.html,
    });

    return { delivered: true };
  } catch (error) {
    console.error("[email:failed]", error);
    return { delivered: false, reason: "send-failed" };
  }
}

function shell(title: string, body: string): string {
  return `<!doctype html>
<html lang="en">
  <body style="margin:0;padding:24px;background:#121417;font-family:system-ui,-apple-system,Segoe UI,sans-serif;color:#121417">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr><td align="center">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background:#FFFFFF;border-radius:8px;overflow:hidden">
          <tr><td style="background:#121417;padding:20px 28px">
            <span style="color:#FF5A1F;font-weight:700;letter-spacing:.08em;font-size:13px">MUTHURAM COMPLEX</span>
          </td></tr>
          <tr><td style="padding:28px">
            <h1 style="margin:0 0 16px;font-size:20px">${title}</h1>
            ${body}
            <p style="margin:28px 0 0;font-size:12px;color:#6B7280">
              Muthuram Complex, 42 Race Course Road, Coimbatore 641001.
              Questions? WhatsApp +91 98765 43210.
            </p>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
}

export async function sendPasswordResetEmail(input: {
  email: string;
  name: string;
  token: string;
}): Promise<EmailResult> {
  const appUrl = publicEnv().appUrl;
  const link = `${appUrl}${ROUTES.auth.resetPassword}?token=${encodeURIComponent(input.token)}`;

  console.info(`[email:password-reset] ${link}`);

  return sendMail({
    to: input.email,
    subject: RESET_SUBJECT,
    text: [
      `Hi ${input.name},`,
      "",
      "Use the link below to choose a new password. It expires in one hour and can only be used once.",
      "",
      link,
      "",
      "If you did not ask to reset your password you can ignore this email.",
    ].join("\n"),
    html: shell(
      "Reset your password",
      [
        `<p style="margin:0 0 20px;font-size:15px;line-height:1.6">Hi ${input.name},</p>`,
        `<p style="margin:0 0 20px;font-size:15px;line-height:1.6">Use the button below to choose a new password. It expires in one hour and can only be used once.</p>`,
        `<p style="margin:0 0 24px"><a href="${link}" style="display:inline-block;background:#FF5A1F;color:#FFFFFF;text-decoration:none;padding:13px 24px;border-radius:4px;font-weight:600;font-size:15px">Choose a new password</a></p>`,
        `<p style="margin:0 0 8px;font-size:13px;color:#6B7280">Or paste this link into your browser:</p>`,
        `<p style="margin:0;font-size:13px;word-break:break-all"><a href="${link}" style="color:#0B5FFF">${link}</a></p>`,
        `<p style="margin:24px 0 0;font-size:13px;color:#6B7280">If you did not ask to reset your password, ignore this email and nothing changes.</p>`,
      ].join(""),
    ),
  });
}

export async function sendWelcomeEmail(input: { email: string; name: string }): Promise<EmailResult> {
  const appUrl = publicEnv().appUrl;

  return sendMail({
    to: input.email,
    subject: WELCOME_SUBJECT,
    text: [
      `Hi ${input.name},`,
      "",
      "Your Muthuram Complex account is ready.",
      "",
      `Shop riding gear: ${appUrl}${ROUTES.shop}`,
    ].join("\n"),
    html: shell(
      "Welcome to Muthuram Complex",
      [
        `<p style="margin:0 0 20px;font-size:15px;line-height:1.6">Hi ${input.name},</p>`,
        `<p style="margin:0 0 20px;font-size:15px;line-height:1.6">Your account is ready. Every order ships with a traceable batch number, and our team in Coimbatore is one WhatsApp message away.</p>`,
        `<p style="margin:0"><a href="${appUrl}${ROUTES.shop}" style="display:inline-block;background:#FF5A1F;color:#FFFFFF;text-decoration:none;padding:13px 24px;border-radius:4px;font-weight:600;font-size:15px">Start shopping</a></p>`,
      ].join(""),
    ),
  });
}