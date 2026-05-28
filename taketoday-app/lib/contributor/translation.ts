import Anthropic from "@anthropic-ai/sdk";
import { appConfig } from "@/lib/config/app";
import { prisma } from "@/lib/db/prisma";
import type { InputJsonObject } from "@prisma/client/runtime/library";

const SUPPORTED_LANGUAGES: Record<string, string> = {
  es: "Spanish",
  fr: "French",
  de: "German",
  pt: "Portuguese",
  ar: "Arabic",
  hi: "Hindi",
  zh: "Chinese (Simplified)",
  ja: "Japanese",
  ru: "Russian",
  sw: "Swahili",
};

export { SUPPORTED_LANGUAGES };

function getClient(): Anthropic | null {
  if (!appConfig.anthropicApiKey) return null;
  return new Anthropic({ apiKey: appConfig.anthropicApiKey });
}

export async function translateText(
  text: string,
  targetLanguage: string,
): Promise<string | null> {
  const client = getClient();
  if (!client) return null;

  const langName = SUPPORTED_LANGUAGES[targetLanguage] ?? targetLanguage;

  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 2048,
    system: `You are a professional translator. Translate the provided text into ${langName}. Preserve formatting, tone, and journalistic style. Return only the translated text — no preamble, no explanation.`,
    messages: [{ role: "user", content: text }],
  });

  return message.content[0]?.type === "text" ? message.content[0].text.trim() : null;
}

export async function translateContributionSummary(
  contributionId: string,
  title: string,
  summary: string,
  targetLanguages: string[],
): Promise<Record<string, { title: string; summary: string }>> {
  const client = getClient();
  if (!client) return {};

  const results: Record<string, { title: string; summary: string }> = {};

  await Promise.all(
    targetLanguages.map(async (lang) => {
      try {
        const [translatedTitle, translatedSummary] = await Promise.all([
          translateText(title, lang),
          translateText(summary, lang),
        ]);
        if (translatedTitle && translatedSummary) {
          results[lang] = { title: translatedTitle, summary: translatedSummary };
        }
      } catch (err) {
        console.error(`[translation] Failed to translate to ${lang}:`, err);
      }
    }),
  );

  // Persist translated summaries to AIAnalysis
  if (Object.keys(results).length > 0) {
    await prisma.aIAnalysis.upsert({
      where: { contributionId },
      create: { contributionId, translatedSummaries: results as InputJsonObject },
      update: { translatedSummaries: results as InputJsonObject },
    });
  }

  return results;
}
