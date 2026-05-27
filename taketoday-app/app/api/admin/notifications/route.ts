import { NextRequest } from "next/server";
import { jsonError, jsonOk, rateLimit } from "@/lib/admin/api";
import { requireAdmin } from "@/lib/admin/authz";
import { prisma } from "@/lib/db/prisma";

export async function GET(request: NextRequest) {
  if (rateLimit(request)) return jsonError("Rate limit exceeded. Please try again later.", 429);

  const access = await requireAdmin("dashboard:read");
  if (!access.ok) return access.response;

  try {
    const notifications = await prisma.notification.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    const unread = notifications.filter((n) => !n.read).length;

    return jsonOk({ notifications, unread });
  } catch {
    return jsonError("Failed to fetch notifications", 500);
  }
}

// Mark all notifications as read
export async function PATCH(request: NextRequest) {
  if (rateLimit(request)) return jsonError("Rate limit exceeded. Please try again later.", 429);

  const access = await requireAdmin("dashboard:read");
  if (!access.ok) return access.response;

  try {
    const { count } = await prisma.notification.updateMany({
      where: { read: false },
      data: { read: true },
    });

    return jsonOk({ marked: count });
  } catch {
    return jsonError("Failed to mark notifications as read", 500);
  }
}
