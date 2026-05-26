import { prisma } from "@/lib/db/prisma";
import { auth } from "@/auth";
import { Prisma } from "@prisma/client";

/**
 * Log an audit entry for admin actions
 */
export async function logAuditAction({
  action,
  entity,
  entityId,
  before,
  after,
}: {
  action: string;
  entity: string;
  entityId?: string;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
}) {
  try {
    const session = await auth();
    const actor = session?.user?.email
      ? await prisma.adminUser.findUnique({ where: { email: session.user.email } })
      : null;
    
     await prisma.auditLog.create({
       data: {
         actorId: actor?.id,
         action,
         entity,
         entityId,
         before: before != null ? JSON.stringify(before) : Prisma.JsonNull,
         after: after != null ? JSON.stringify(after) : Prisma.JsonNull,
         ipAddress: "", // In a real app, you'd extract this from request headers
       },
     });
  } catch (error) {
    console.error("Failed to log audit action:", error);
    // Don't throw - we don't want audit logging failures to break the main functionality
  }
}
