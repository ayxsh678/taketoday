import { NextRequest } from "next/server";
import { z } from "zod";
import { captureApiError, jsonError, jsonOk } from "@/lib/admin/api";
import { requireAdmin } from "@/lib/admin/authz";
import { appConfig } from "@/lib/config/app";
import { prisma } from "@/lib/db/prisma";
import { generateJSON } from "@/lib/ai/studio-generate";

const schema = z.object({
  topic: z.string().min(3),
  duration: z.number().int().refine((v) => [15, 30, 60].includes(v), "Duration must be 15, 30, or 60"),
  hookStyle: z.enum(["Question", "Stat", "Controversy", "Story"]),
});

export async function POST(req: NextRequest) {
  const access = await requireAdmin("ai:run");
  if (!access.ok) return access.response;

  if (!appConfig.geminiApiKey && !appConfig.openaiApiKey) {
    return jsonError("No AI provider configured. Set GEMINI_API_KEY or OPENAI_API_KEY.", 503);
  }

  const raw: unknown = await req.json().catch(() => null);
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return jsonError(parsed.error.message, 422);

  const { topic, duration, hookStyle } = parsed.data;

  const prompt = `Write a ${duration}-second Reel script about: "${topic}"
Hook style: ${hookStyle}

Return exactly this JSON:
{
  "hook": { "on_screen": "Text shown on screen (max 8 words)", "voiceover": "What the creator says (1-2 sentences)" },
  "body": [
    { "on_screen": "Screen text", "voiceover": "Voiceover for this beat" }
  ],
  "cta": { "on_screen": "Follow / Like / Share prompt", "voiceover": "Closing voiceover" },
  "estimated_duration": ${duration}
}

Body should have ${Math.round(duration / 10)} beats. Each beat ≈ 8-10 seconds.`;

  try {
    const { text } = await generateJSON(prompt);

    let payload: unknown;
    try {
      payload = JSON.parse(text);
    } catch {
      return jsonError("AI returned malformed JSON", 502);
    }

    const draft = await prisma.contentDraft.create({
      data: {
        type: "REEL_SCRIPT",
        topic,
        payload: payload as object,
        createdById: access.session.user.id ?? undefined,
      },
    });

    return jsonOk({ draftId: draft.id, ...(payload as object) });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "AI generation failed";
    if (msg.includes("quota") || msg.includes("429")) {
      return jsonError("AI quota exceeded. Add billing at ai.google.dev or set OPENAI_API_KEY as fallback.", 429);
    }
    return captureApiError(error, { topic, duration, hookStyle });
  }
}
