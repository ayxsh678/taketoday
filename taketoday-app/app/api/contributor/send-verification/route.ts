import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { jsonOk, jsonError } from "@/lib/admin/api";
import { requireContributor } from "@/lib/contributor/authz";
import { checkRateLimit } from "@/lib/rate-limit";
import { generateToken, verifyTokenExpiry } from "@/lib/tokens";
import { sendEmailVerificationEmail } from "@/lib/integrations/resend";
import { appConfig } from "@/lib/config/app";

export async function POST(_req: NextRequest) {
  const access = await requireContributor();
  if (!access.ok) return access.response;

  // 3 sends per hour per user
  if (await checkRateLimit(`verify-send:${access.session.id}`, null)) {
    return jsonError("Too many requests. Please wait before requesting another email.", 429);
  }

  const user = await prisma.publicUser.findUnique({
    where: { id: access.session.id },
    select: { id: true, email: true, emailVerified: true },
  });

  if (!user) return jsonError("User not found", 404);
  if (user.emailVerified) return jsonOk({ message: "Email already verified." });

  // Invalidate existing unused tokens
  await prisma.emailVerificationToken.updateMany({
    where: { userId: user.id, usedAt: null },
    data: { usedAt: new Date() },
  });

  const { plaintext, hash } = generateToken();
  await prisma.emailVerificationToken.create({
    data: { userId: user.id, tokenHash: hash, expiresAt: verifyTokenExpiry() },
  });

  const verifyUrl = `${appConfig.siteUrl}/contribute/verify-email?token=${plaintext}`;

  void sendEmailVerificationEmail(user.email, verifyUrl).catch(() => {
    console.error("[send-verification] Failed to send email to", user.email);
  });

  return jsonOk({ message: "Verification email sent." });
}
