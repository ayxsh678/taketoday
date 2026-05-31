import { Resend } from "resend";
import { SITE } from "@/lib/site";

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

const FROM = `${SITE.name} <noreply@taketoday.com>`;

export async function sendPasswordResetEmail(
  to: string,
  resetUrl: string,
): Promise<void> {
  const resend = getResend();
  if (!resend) {
    console.warn("[resend] RESEND_API_KEY not set — password reset email not sent");
    return;
  }

  await resend.emails.send({
    from: FROM,
    to,
    subject: `Reset your ${SITE.name} password`,
    html: `
      <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px">
        <h1 style="font-size:20px;font-weight:700;margin:0 0 16px">${SITE.name}</h1>
        <p style="color:#374151;margin:0 0 24px">
          We received a request to reset your password. Click the link below to choose a new one.
          This link expires in <strong>1 hour</strong>.
        </p>
        <a href="${resetUrl}"
           style="display:inline-block;background:#111;color:#fff;text-decoration:none;padding:12px 24px;border-radius:6px;font-weight:600;font-size:14px">
          Reset password
        </a>
        <p style="color:#9ca3af;font-size:13px;margin:24px 0 0">
          If you didn't request this, you can safely ignore this email.
        </p>
      </div>
    `,
  });
}

export async function sendEmailVerificationEmail(
  to: string,
  verifyUrl: string,
): Promise<void> {
  const resend = getResend();
  if (!resend) {
    console.warn("[resend] RESEND_API_KEY not set — verification email not sent");
    return;
  }

  await resend.emails.send({
    from: FROM,
    to,
    subject: `Verify your ${SITE.name} email`,
    html: `
      <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px">
        <h1 style="font-size:20px;font-weight:700;margin:0 0 16px">${SITE.name}</h1>
        <p style="color:#374151;margin:0 0 24px">
          Verify your email address to unlock full contributor features.
          This link expires in <strong>24 hours</strong>.
        </p>
        <a href="${verifyUrl}"
           style="display:inline-block;background:#111;color:#fff;text-decoration:none;padding:12px 24px;border-radius:6px;font-weight:600;font-size:14px">
          Verify email
        </a>
        <p style="color:#9ca3af;font-size:13px;margin:24px 0 0">
          If you didn't create a ${SITE.name} account, you can safely ignore this email.
        </p>
      </div>
    `,
  });
}
