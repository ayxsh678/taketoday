import { notifications } from "@/lib/admin/data";
import { jsonOk, rateLimit } from "@/lib/admin/api";
import { requireAdmin } from "@/lib/admin/authz";

export async function GET(request: Request) {
  // Check rate limit
  if (rateLimit(request)) {
    return jsonError("Rate limit exceeded. Please try again later.", 429);
  }

  const access = await requireAdmin("dashboard:read");
  if (!access.ok) return access.response;

  return jsonOk({ notifications, unread: notifications.filter((item) => !item.read).length });
}
