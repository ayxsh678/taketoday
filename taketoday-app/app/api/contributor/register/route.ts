import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { jsonOk, jsonError } from "@/lib/admin/api";

const registerSchema = z.object({
  email: z.string().email(),
  username: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-z0-9_-]+$/, "Username may only contain lowercase letters, numbers, _ and -"),
  displayName: z.string().min(2).max(60),
  password: z.string().min(8).max(128),
});

export async function POST(req: NextRequest) {
  const body: unknown = await req.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) return jsonError(parsed.error.message, 422);

  const { email, username, displayName, password } = parsed.data;

  const emailLower = email.toLowerCase();
  const usernameLower = username.toLowerCase();

  const existing = await prisma.publicUser.findFirst({
    where: { OR: [{ email: emailLower }, { username: usernameLower }] },
    select: { email: true, username: true },
  });

  if (existing?.email === emailLower) {
    return jsonError("Email already registered", 409);
  }
  if (existing?.username === usernameLower) {
    return jsonError("Username already taken", 409);
  }

  const bcrypt = await import("bcryptjs");
  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.publicUser.create({
    data: {
      email: emailLower,
      username: usernameLower,
      displayName,
      passwordHash,
      role: "CONTRIBUTOR",
      reputation: {
        create: {
          tier: "NEWCOMER",
          overallScore: 0,
        },
      },
    },
    select: {
      id: true,
      email: true,
      username: true,
      displayName: true,
      role: true,
      createdAt: true,
    },
  });

  return jsonOk({ user }, { status: 201 });
}
