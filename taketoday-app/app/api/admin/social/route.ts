import { NextRequest } from "next/server";
import { z } from "zod";
import { jsonError, jsonOk, rateLimit } from "@/lib/admin/api";
import { requireAdmin } from "@/lib/admin/authz";
import { logAuditAction } from "@/lib/admin/audit";

const socialSchema = z.object({
  platforms: z.array(z.enum(["X", "Instagram", "WhatsApp", "Telegram", "Facebook", "LinkedIn"])).min(1),
  copy: z.string().min(4),
  scheduledAt: z.string().optional(),
});

export async function POST(req: NextRequest) {
  // Check rate limit
  if (rateLimit(req)) {
    return jsonError("Rate limit exceeded. Please try again later.", 429);
  }

  const access = await requireAdmin("social:write");
  if (!access.ok) return access.response;

  const parsed = socialSchema.safeParse(await req.json());
  if (!parsed.success) return jsonError(parsed.error.message, 422);

  const postData = parsed.data;
  
  // Log the audit action
  await logAuditAction({
    action: "create_social_post",
    entity: "social_post",
    entityId: `soc_${Date.now()}`, // Temporary ID
    after: postData,
  });

  return jsonOk({
    postId: `soc_${Date.now()}`,
    status: postData.scheduledAt ? "scheduled" : "queued",
    platformPreviews: postData.platforms.map((platform) => ({
      platform,
      estimatedReach: Math.floor(4_000 + Math.random() * 16_000),
      retryPolicy: "3 attempts with exponential backoff",
    })),
  });
}
