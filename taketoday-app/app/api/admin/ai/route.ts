import { jsonError, jsonOk } from "@/lib/admin/api";
import { NextRequest } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/authz";
import { appConfig } from "@/lib/config/app";
import { getAIProvider } from "@/lib/ai";

const MODES = [
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
] as const;

type Mode = (typeof MODES)[number];

const aiRequestSchema = z.object({
  mode: z.enum(MODES),
  input: z.string().min(10).max(8000),
});

const SYSTEM_PROMPTS: Record<Mode, string> = {
  rewrite:
    "You are a senior journalist. Rewrite the input in a clear, engaging news style. Be concise. Return only the rewritten text, no preamble.",
  summarize:
    "You are a news editor. Summarize the input in 2–3 tight sentences. Lead with the most important fact. Return only the summary.",
  captions:
    "You are a social media strategist. Generate exactly 3 platform-optimized social media captions for the content below. Number them 1. 2. 3. Each under 280 characters. Hook-first style.",
  hashtags:
    "You are a digital media specialist. Generate 8–12 relevant hashtags for the content. Return only the hashtags space-separated, no explanation.",
  headlines:
    "You are a headline writer. Generate exactly 3 compelling news headlines for the content below. Number them 1. 2. 3. Each under 90 characters. No clickbait.",
  short_format:
    "You are a brevity expert. Convert the input into a short-form news item: 1 punchy lede sentence + 2 key context points as bullet points. Under 100 words total.",
  fact_check:
    "You are a fact-checker. List the key verifiable factual claims in the input that should be independently verified before publishing. Format as a numbered list.",
  sentiment:
    "You are a media analyst. Analyze the sentiment and tone of the input. Provide: overall sentiment (Positive/Negative/Neutral/Mixed), confidence score (0–100), and 2–3 key tonal observations.",
  bullish:
    "You are a financial analyst writing for an optimistic audience. Give a bullish perspective on the content. 2–3 sentences, specific, data-aware. No fluff.",
  bearish:
    "You are a risk analyst. Give a bearish perspective on the content — risks, challenges, or counterarguments. 2–3 sentences, specific.",
};

// Dev-only mock — never runs in production
function mockOutput(mode: Mode, input: string): string {
  const preview = input.slice(0, 100);
  if (mode === "hashtags") return "#TakeToday #AI #Markets #News #BreakingNews #Tech";
  if (mode === "bullish")
    return `Bullish view: ${preview}… shows strong adoption signals and distribution tailwinds.`;
  if (mode === "bearish")
    return `Bearish view: ${preview}… faces execution risk, regulatory headwinds, and trust challenges.`;
  if (mode === "captions")
    return `1. ${preview}… — what this means for you.\n2. Breaking: ${preview}…\n3. Thread on why ${preview}… matters right now.`;
  if (mode === "headlines")
    return `1. ${preview.slice(0, 60)}\n2. Why ${preview.slice(0, 50)} changes everything\n3. Inside ${preview.slice(0, 55)}`;
  return `${mode.replace("_", " ")} result: ${preview}…`;
}

export async function POST(req: NextRequest) {

  const access = await requireAdmin("ai:run");
  if (!access.ok) return access.response;

  const body: unknown = await req.json().catch(() => null);
  const parsed = aiRequestSchema.safeParse(body);
  if (!parsed.success) return jsonError(parsed.error.message, 422);

  const { mode, input } = parsed.data;

  if (!appConfig.geminiApiKey) {
    if (appConfig.isDevelopment) {
      return jsonOk({
        mode,
        provider: "mock",
        output: mockOutput(mode, input),
        warning: "Dev mock: set GEMINI_API_KEY to enable real outputs.",
      });
    }
    return jsonError("AI provider not configured. Contact your administrator.", 503);
  }

  try {
    const ai = getAIProvider();
    const response = await ai.generateText(input, {
      systemInstruction: SYSTEM_PROMPTS[mode],
      maxTokens: 512,
    });

    const output = response.text;

    if (!output) {
      return jsonError("AI returned an empty response. Please retry.", 502);
    }

    return jsonOk({
      mode,
      provider: "gemini",
      model: "gemini-2.0-flash",
      output,
      inputTokens: response.usage.promptTokens,
      outputTokens: response.usage.completionTokens,
    });
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : "Gemini API error";
    return jsonError(`AI request failed: ${errMsg}`, 502);
  }
}
