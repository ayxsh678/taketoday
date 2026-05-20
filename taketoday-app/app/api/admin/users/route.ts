import { NextRequest } from "next/server";
import { z } from "zod";
import { adminUsers } from "@/lib/admin/data";
import { ADMIN_ROLES } from "@/lib/admin/types";
import { jsonError, jsonOk } from "@/lib/admin/api";
import { requireAdmin } from "@/lib/admin/authz";

const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(ADMIN_ROLES),
});

export async function GET() {
  const access = await requireAdmin("users:manage");
  if (!access.ok) return access.response;

  return jsonOk({ users: adminUsers });
}

export async function POST(req: NextRequest) {
  const access = await requireAdmin("users:manage");
  if (!access.ok) return access.response;

  const parsed = inviteSchema.safeParse(await req.json());
  if (!parsed.success) return jsonError(parsed.error.message, 422);
  return jsonOk({ invitationId: `inv_${Date.now()}`, ...parsed.data, status: "invited" }, { status: 201 });
}
