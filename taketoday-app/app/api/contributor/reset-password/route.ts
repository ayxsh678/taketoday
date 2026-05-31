import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { jsonOk, jsonError } from "@/lib/admin/api";
import { checkRateLimit } from "@/lib/rate-limit";
import { hashToken } from "@/lib/tokens";

const schema = z.object({
  token: z.string().length(64),
  password: z.string().min(8).max(128),
});

export async function POST(req: NextRequest) {
  // 10 attempts per IP per hour
  const ip = req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "unknown";
  if (await checkRateLimit(`reset:${ip}`, null)) {
    return jsonError("Too many attempts. Please wait before trying again.", 429);
  }

  const body: unknown = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid request", 422);

  const { token, password } = parsed.data;
  const tokenHash = hashToken(token);

  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    include: { user: { select: { id: true } } },
  });

  if (!record || record.usedAt || record.expiresAt < new Date()) {
    return jsonError("This reset link is invalid or has expired.", 400);
  }

  const bcrypt = await import("bcryptjs");
  const passwordHash = await bcrypt.hash(password, 12);

  // Mark token used + update password atomically
  await prisma.$transaction([
    prisma.passwordResetToken.update({
      where: { tokenHash },
      data: { usedAt: new Date() },
    }),
    prisma.publicUser.update({
      where: { id: record.user.id },
      data: { passwordHash },
    }),
  ]);

  return jsonOk({ message: "Password updated. You can now sign in." });
}
