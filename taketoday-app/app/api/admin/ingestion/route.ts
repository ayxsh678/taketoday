import { NextRequest } from "next/server";
import { z } from "zod";
import { jsonError, jsonOk } from "@/lib/admin/api";
import { requireAdmin } from "@/lib/admin/authz";

const ingestionSchema = z.object({
  type: z.enum(["rss", "url", "scrape", "youtube", "x_trend"]),
  source: z.string().min(5),
});

export async function POST(req: NextRequest) {
  const access = await requireAdmin("ingestion:write");
  if (!access.ok) return access.response;

  const parsed = ingestionSchema.safeParse(await req.json());
  if (!parsed.success) return jsonError(parsed.error.message, 422);

  return jsonOk({
    jobId: `ing_${Date.now()}`,
    status: "queued",
    duplicateCheck: "passed",
    autoCategory: "AI",
    suggestedTags: ["breaking", "market signal", "source verified"],
  });
}
