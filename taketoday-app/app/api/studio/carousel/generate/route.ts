import { NextRequest } from "next/server";
import { z } from "zod";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { captureApiError, jsonError, jsonOk } from "@/lib/admin/api";
import { requireAdmin } from "@/lib/admin/authz";
import { appConfig } from "@/lib/config/app";
import { prisma } from "@/lib/db/prisma";

const schema = z.object({
  topic: z.string().min(3),
  articleId: z.string().optional(),
  tone: z.enum(["Breaking", "Explainer", "Opinion", "Listicle"]),
  slideCount: z.number().int().min(3).max(10),
});

const SYSTEM = `You are a social media content strategist. Return ONLY valid JSON with no markdown, no code fences.`;

export async function POST(req: NextRequest) {
  const access = await requireAdmin("ai:run");
  if (!access.ok) return access.response;

  if (!appConfig.geminiApiKey) return jsonError("GEMINI_API_KEY not configured", 503);

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
    return captureApiError(error, { topic, tone, slideCount, detail: msg });
  }
}
