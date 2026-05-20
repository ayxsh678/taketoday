import { NextRequest } from "next/server";
import { z } from "zod";
import { jsonError, jsonOk } from "@/lib/admin/api";
import { requireAdmin } from "@/lib/admin/authz";

const socialSchema = z.object({
  platforms: z.array(z.enum(["X", "Instagram", "WhatsApp", "Telegram", "Facebook", "LinkedIn"])).min(1),
  copy: z.string().min(4),
  scheduledAt: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const access = await requireAdmin("social:write");
  if (!access.ok) return access.response;

  const parsed = socialSchema.safeParse(await req.json());
  if (!parsed.success) return jsonError(parsed.error.message, 422);

  return jsonOk({
    postId: `soc_${Date.now()}`,
    status: parsed.data.scheduledAt ? "scheduled" : "queued",
    platformPreviews: parsed.data.platforms.map((platform) => ({
      platform,
      estimatedReach: Math.floor(4_000 + Math.random() * 16_000),
      retryPolicy: "3 attempts with exponential backoff",
    })),
  });
}
