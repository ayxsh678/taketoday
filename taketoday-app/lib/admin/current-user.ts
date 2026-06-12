import type { Session } from "next-auth";
import { AdminRole as PrismaAdminRole } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import type { AdminRole } from "@/lib/admin/types";

function toPrismaRole(role: AdminRole): PrismaAdminRole {
  return role === "Super Admin" || role === "Content Manager"
    ? PrismaAdminRole.ADMIN
    : PrismaAdminRole.EDITOR;
}

export async function getOrCreateAdminUser(session: Session) {
  const email = session.user?.email?.toLowerCase();
  if (!email) throw new Error("Authenticated admin session is missing an email address");

  return prisma.adminUser.upsert({
    where: { email },
    update: {
      name: session.user.name ?? email,
      image: session.user.image ?? undefined,
      role: toPrismaRole(session.user.role),
    },
    create: {
      email,
      name: session.user.name ?? email,
      image: session.user.image ?? undefined,
      role: toPrismaRole(session.user.role),
    },
  });
}
