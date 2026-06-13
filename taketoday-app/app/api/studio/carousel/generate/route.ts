import { NextRequest } from "next/server";
import { z } from "zod";
import { captureApiError, jsonError, jsonOk } from "@/lib/admin/api";
import { requireAdmin } from "@/lib/admin/authz";
import { appConfig } from "@/lib/config/app";
import { prisma } from "@/lib/db/prisma";
import { generateJSON } from "@/lib/ai/studio-generate";

const schema = z.object({
  topic: z.string().min(3),
  articleId: z.string().optional(),
  tone: z.enum(["Breaking", "Explainer", "Opinion", "Listicle"]),
  slideCount: z.number().int().min(3).max(10),
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

  const { topic, articleId, tone, slideCount } = parsed.data;

  let articleContext = "";
  if (articleId) {
    const article = await prisma.article.findUnique({
      where: { id: articleId },
      select: { headline: true, excerpt: true, body: true },
    });
    if (article) {
      articleContext = `\nSource article headline: ${article.headline}\nExcerpt: ${article.excerpt ?? ""}\nBody snippet: ${(article.body ?? "").slice(0, 800)}`;
    }
  }

  const prompt = `Create a ${slideCount}-slide Instagram carousel about: "${topic}"
Tone: ${tone}${articleContext}

Return exactly this JSON structure (${slideCount} slides):
{
  "slides": [
    { "headline": "Short punchy headline (max 8 words)", "body": "2-3 sentence supporting copy", "cta": "Call to action text" }
  ],
  "hashtags": ["#tag1", "#tag2", "#tag3", "#tag4", "#tag5"],
  "caption": "Instagram caption (150-300 chars) with emojis"
}`;

  try {
    const { text } = await generateJSON(prompt);

    let payload: unknown;
    try {
      payload = JSON.parse(text);
    } catch {
      return jsonError("AI returned malformed JSON", 502);
    }

    const payloadObj = payload as { slides: unknown[]; hashtags: string[]; caption: string };
    if (!Array.isArray(payloadObj.slides) || payloadObj.slides.length !== slideCount) {
      return jsonError("AI generation failed: wrong slide count", 502);
    }

    const draft = await prisma.contentDraft.create({
      data: {
        type: "CAROUSEL",
        topic,
        payload: payloadObj as object,
        createdById: access.session.user.id ?? undefined,
      },
    });

    return jsonOk({ draftId: draft.id, ...payloadObj });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "AI generation failed";
    if (msg.includes("quota") || msg.includes("429")) {
      return jsonError("AI quota exceeded. Add billing at ai.google.dev or set OPENAI_API_KEY as fallback.", 429);
    }
    return captureApiError(error, { topic, tone, slideCount });
  }
}
