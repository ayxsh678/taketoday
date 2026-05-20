import { notifications } from "@/lib/admin/data";
import { jsonOk } from "@/lib/admin/api";
import { requireAdmin } from "@/lib/admin/authz";

export async function GET() {
  const access = await requireAdmin("dashboard:read");
  if (!access.ok) return access.response;

  return jsonOk({ notifications, unread: notifications.filter((item) => !item.read).length });
}
