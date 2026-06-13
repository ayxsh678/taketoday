import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";
import { appConfig } from "@/lib/config/app";

const GEMINI_SYSTEM = `You are a social media content strategist. Return ONLY valid JSON with no markdown, no code fences.`;

function stripFences(text: string): string {
  return text.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
}

function isQuotaError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return msg.includes("429") || msg.toLowerCase().includes("quota");
}

async function generateWithGemini(prompt: string): Promise<string> {
  if (!appConfig.geminiApiKey) throw new Error("GEMINI_API_KEY not configured");
  const genAI = new GoogleGenerativeAI(appConfig.geminiApiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
  const result = await model.generateContent([GEMINI_SYSTEM, prompt]);
  return result.response.text().trim();
}

async function generateWithOpenAI(prompt: string): Promise<string> {
  if (!appConfig.openaiApiKey) throw new Error("OPENAI_API_KEY not configured");
  const client = new OpenAI({ apiKey: appConfig.openaiApiKey });
  const res = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: GEMINI_SYSTEM },
      { role: "user", content: prompt },
    ],
    temperature: 0.7,
    response_format: { type: "json_object" },
  });
  return res.choices[0]?.message.content ?? "";
}

// Tries Gemini first; falls back to OpenAI on quota/rate-limit errors.
export async function generateJSON(prompt: string): Promise<{ text: string; provider: string }> {
  if (appConfig.geminiApiKey) {
    try {
      const text = await generateWithGemini(prompt);
      return { text, provider: "gemini" };
    } catch (err) {
      if (!isQuotaError(err)) throw err;
      // quota hit — fall through to OpenAI
    }
  }

  const text = await generateWithOpenAI(prompt);
  return { text, provider: "openai" };
}
