import { NextRequest } from "next/server";
import { z } from "zod";
import { jsonError, jsonOk, rateLimit } from "@/lib/admin/api";
import { requireAdmin } from "@/lib/admin/authz";

const aiRequestSchema = z.object({
  mode: z.enum([
    "rewrite",
    "summarize",
    "captions",
    "hashtags",
    "headlines",
    "short_format",
    "fact_check",
    "sentiment",
    "bullish",
    "bearish",
  ]),
  input: z.string().min(10),
});

export async function POST(req: NextRequest) {
  // Check rate limit
  if (rateLimit(req)) {
    return jsonError("Rate limit exceeded. Please try again later.", 429);
  }

  const access = await requireAdmin("ai:run");
  if (!access.ok) return access.response;

  const parsed = aiRequestSchema.safeParse(await req.json());
  if (!parsed.success) return jsonError(parsed.error.message, 422);

  const { mode, input } = parsed.data;
  return jsonOk({
    mode,
    provider: process.env.ANTHROPIC_API_KEY ? "claude" : process.env.OPENAI_API_KEY ? "openai" : "mock",
    output: createMockAiOutput(mode, input),
    tokensEstimated: Math.ceil(input.length / 4),
  });
}

function createMockAiOutput(mode: string, input: string) {
  const preview = input.slice(0, 120);
  if (mode === "bullish") return `Bullish view: ${preview} has strong adoption, timing, and distribution tailwinds.`;
  if (mode === "bearish") return `Bearish view: ${preview} may face execution, regulation, or audience-trust risk.`;
  if (mode === "hashtags") return ["#TakeToday", "#AI", "#Markets", "#News"].join(" ");
  return `${mode.replace("_", " ")} result: ${preview}`;
}
