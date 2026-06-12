import OpenAI from "openai";
import { appConfig } from "@/lib/config/app";

const ARTICLE_SYSTEM = `You are an experienced news journalist. Write concise, factual, third-person news copy in AP style. No introductory meta-commentary. No headers. Output HTML paragraph tags only (<p>…</p>). 3–5 paragraphs.`;

function paragraphsToHtml(text: string): string {
  return text
    .split(/\n{2,}/)
    .map((p) => p.replace(/\n/g, " ").trim())
    .filter(Boolean)
    .map((p) => {
      const clean = p.startsWith("<p>") ? p : `<p>${p}</p>`;
      return clean;
    })
    .join("\n");
}

export async function generateArticleBody(
  headline: string,
  excerpt?: string,
): Promise<string> {
  if (!appConfig.openaiApiKey) {
    throw new Error("OPENAI_API_KEY not configured");
  }

  const client = new OpenAI({ apiKey: appConfig.openaiApiKey });

  const userPrompt = [
    `Headline: ${headline}`,
    excerpt ? `Context: ${excerpt}` : "",
    "",
    "Write the article body now.",
  ]
    .filter(Boolean)
    .join("\n");

  const res = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: ARTICLE_SYSTEM },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.65,
    max_tokens: 900,
  });

  const raw = res.choices[0]?.message.content ?? "";
  return paragraphsToHtml(raw);
}

export async function generateExcerpt(
  headline: string,
  body: string,
): Promise<string> {
  if (!appConfig.openaiApiKey) {
    throw new Error("OPENAI_API_KEY not configured");
  }

  const client = new OpenAI({ apiKey: appConfig.openaiApiKey });

  const res = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "Write a single-sentence news excerpt (max 25 words) for this article. Plain text only, no quotes.",
      },
      {
        role: "user",
        content: `Headline: ${headline}\n\nBody: ${body.slice(0, 600)}`,
      },
    ],
    temperature: 0.5,
    max_tokens: 60,
  });

  return res.choices[0]?.message.content?.trim() ?? "";
}
