import { NextRequest } from "next/server";
import { z } from "zod";
import { captureApiError, jsonError, jsonOk } from "@/lib/admin/api";
import { requireAdmin } from "@/lib/admin/authz";
import { generateArticleBody, generateExcerpt } from "@/lib/ai/generate";

const schema = z.object({
  type: z.enum(["body", "excerpt"]),
  headline: z.string().min(4),
  excerpt: z.string().optional(),
  body: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const access = await requireAdmin("ai:run");
  if (!access.ok) return access.response;

  const raw: unknown = await req.json().catch(() => null);
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return jsonError(parsed.error.message, 422);

  try {
    if (parsed.data.type === "body") {
      const html = await generateArticleBody(parsed.data.headline, parsed.data.excerpt);
      return jsonOk({ html });
    }

    if (parsed.data.type === "excerpt") {
      const text = await generateExcerpt(
        parsed.data.headline,
        parsed.data.body ?? "",
      );
      return jsonOk({ text });
    }

    return jsonError("Unknown type", 400);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "AI generation failed";
    if (msg.includes("not configured")) return jsonError(msg, 503);
    return captureApiError(error);
  }
}
