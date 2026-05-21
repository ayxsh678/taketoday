import { prisma } from "@/lib/prisma";
import { getSession } from "@/auth";

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
  before?: Record<string, any> | null;
  after?: Record<string, any> | null;
}) {
  try {
    const session = await getSession();
    
    await prisma.auditLog.create({
      data: {
        actorId: session?.user?.id,
        action,
        entity,
        entityId,
        before: before ? JSON.stringify(before) : null,
        after: after ? JSON.stringify(after) : null,
        ipAddress: "", // In a real app, you'd extract this from request headers
      },
    });
  } catch (error) {
    console.error("Failed to log audit action:", error);
    // Don't throw - we don't want audit logging failures to break the main functionality
  }
}