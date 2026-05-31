import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { jsonOk, jsonError } from "@/lib/admin/api";
import { checkRateLimit } from "@/lib/rate-limit";
import { generateToken, resetTokenExpiry } from "@/lib/tokens";
import { sendPasswordResetEmail } from "@/lib/integrations/resend";
import { appConfig } from "@/lib/config/app";

const schema = z.object({ email: z.string().email() });

export async function POST(req: NextRequest) {
  // 5 requests per 15 minutes per IP
  const ip = req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "unknown";
  if (await checkRateLimit(`forgot:${ip}`, null)) {
    return jsonError("Too many requests. Please wait before trying again.", 429);
  }

  const body: unknown = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return jsonError(parsed.error.message, 422);

  const email = parsed.data.email.toLowerCase();

  // Always return success — prevents user enumeration
  const user = await prisma.publicUser.findUnique({
    where: { email },
    select: { id: true },
  });

  if (user) {
    // Invalidate any existing unused tokens for this user
    await prisma.passwordResetToken.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: new Date() },
    });

    const { plaintext, hash } = generateToken();
    await prisma.passwordResetToken.create({
      data: { userId: user.id, tokenHash: hash, expiresAt: resetTokenExpiry() },
    });

    const resetUrl = `${appConfig.siteUrl}/contribute/reset-password?token=${plaintext}`;

    // Non-blocking — email failure doesn't fail the request
    void sendPasswordResetEmail(email, resetUrl).catch(() => {
      console.error("[forgot-password] Failed to send reset email to", email);
    });
  }

  return jsonOk({
    message: "If that email is registered, you'll receive a reset link shortly.",
  });
}
