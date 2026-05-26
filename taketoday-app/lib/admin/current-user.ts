import type { Session } from "next-auth";
import { AdminRole as PrismaAdminRole } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import type { AdminRole } from "@/lib/admin/types";

const roleToPrisma: Record<AdminRole, PrismaAdminRole> = {
  "Super Admin": PrismaAdminRole.SUPER_ADMIN,
  Editor: PrismaAdminRole.EDITOR,
  "Content Manager": PrismaAdminRole.CONTENT_MANAGER,
  "Social Media Manager": PrismaAdminRole.SOCIAL_MEDIA_MANAGER,
  Analyst: PrismaAdminRole.ANALYST,
};

export async function getOrCreateAdminUser(session: Session) {
  const email = session.user?.email?.toLowerCase();
  if (!email) throw new Error("Authenticated admin session is missing an email address");

  return prisma.adminUser.upsert({
    where: { email },
    update: {
      name: session.user.name ?? email,
      image: session.user.image ?? undefined,
      role: roleToPrisma[session.user.role] ?? PrismaAdminRole.ANALYST,
      lastActiveAt: new Date(),
    },
    create: {
      email,
      name: session.user.name ?? email,
      image: session.user.image ?? undefined,
      role: roleToPrisma[session.user.role] ?? PrismaAdminRole.ANALYST,
      lastActiveAt: new Date(),
    },
  });
}
