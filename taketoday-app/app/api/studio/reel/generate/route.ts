import { NextRequest } from "next/server";
import { z } from "zod";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { captureApiError, jsonError, jsonOk } from "@/lib/admin/api";
import { requireAdmin } from "@/lib/admin/authz";
import { appConfig } from "@/lib/config/app";
import { prisma } from "@/lib/db/prisma";

const schema = z.object({
  topic: z.string().min(3),
  duration: z.number().int().refine((v) => [15, 30, 60].includes(v), "Duration must be 15, 30, or 60"),
  hookStyle: z.enum(["Question", "Stat", "Controversy", "Story"]),
});

const SYSTEM = `You are a viral short-form video scriptwriter. Return ONLY valid JSON with no markdown, no code fences.`;

export async function POST(req: NextRequest) {
  const access = await requireAdmin("ai:run");
  if (!access.ok) return access.response;

  if (!appConfig.geminiApiKey) return jsonError("GEMINI_API_KEY not configured", 503);

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
    const genAI = new GoogleGenerativeAI(appConfig.geminiApiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent([SYSTEM, prompt]);
    const text = result.response.text().trim();

    let payload: unknown;
    try {
      const jsonStr = text.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
      payload = JSON.parse(jsonStr);
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
    return captureApiError(error, { topic, duration, hookStyle, detail: msg });
  }
}
