import { captureApiError, jsonOk } from "@/lib/admin/api";
import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/admin/authz";
import { prisma } from "@/lib/db/prisma";

export async function GET(_request: NextRequest) {

  const access = await requireAdmin("dashboard:read");
  if (!access.ok) return access.response;

  try {
    const notifications = await prisma.notification.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    const unread = notifications.filter((n) => !n.read).length;

    return jsonOk({ notifications, unread });
  } catch (error) {
    return captureApiError(error);
  }
}

// Mark all notifications as read
export async function PATCH(_request: NextRequest) {

  const access = await requireAdmin("dashboard:read");
  if (!access.ok) return access.response;

  try {
    const { count } = await prisma.notification.updateMany({
      where: { read: false },
      data: { read: true },
    });

    return jsonOk({ marked: count });
  } catch (error) {
    return captureApiError(error);
  }
}
