import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { jsonOk, jsonError } from "@/lib/admin/api";
import { hashToken } from "@/lib/tokens";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token || token.length !== 64) {
    return jsonError("Invalid verification link.", 400);
  }

  const tokenHash = hashToken(token);
  const record = await prisma.emailVerificationToken.findUnique({
    where: { tokenHash },
    include: { user: { select: { id: true, emailVerified: true } } },
  });

  if (!record) return jsonError("This verification link is invalid.", 400);
  if (record.usedAt) return jsonOk({ message: "Email already verified." });
  if (record.expiresAt < new Date()) {
    return jsonError("This verification link has expired. Request a new one.", 400);
  }

  await prisma.$transaction([
    prisma.emailVerificationToken.update({
      where: { tokenHash },
      data: { usedAt: new Date() },
    }),
    prisma.publicUser.update({
      where: { id: record.user.id },
      data: { emailVerified: new Date() },
    }),
  ]);

  // Redirect to profile with success flag
  return NextResponse.redirect(
    new URL("/contribute/onboarding?verified=1", req.url),
  );
}
