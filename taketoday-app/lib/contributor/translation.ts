import { appConfig } from "@/lib/config/app";
import { prisma } from "@/lib/db/prisma";
import type { InputJsonObject } from "@prisma/client/runtime/library";
import { getAIProvider } from "@/lib/ai";

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

export async function translateText(
  text: string,
  targetLanguage: string,
): Promise<string | null> {
  if (!appConfig.geminiApiKey) return null;

  const langName = SUPPORTED_LANGUAGES[targetLanguage] ?? targetLanguage;

  try {
    const ai = getAIProvider();
    const response = await ai.generateText(text, {
      systemInstruction: `You are a professional translator. Translate the provided text into ${langName}. Preserve formatting, tone, and journalistic style. Return only the translated text — no preamble, no explanation.`,
      maxTokens: 2048,
    });
    return response.text.trim() || null;
  } catch {
    return null;
  }
}

export async function translateContributionSummary(
  contributionId: string,
  title: string,
  summary: string,
  targetLanguages: string[],
): Promise<Record<string, { title: string; summary: string }>> {
  if (!appConfig.geminiApiKey) return {};

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

  if (Object.keys(results).length > 0) {
    await prisma.aIAnalysis.upsert({
      where: { contributionId },
      create: { contributionId, translatedSummaries: results as InputJsonObject },
      update: { translatedSummaries: results as InputJsonObject },
    });
  }

  return results;
}
