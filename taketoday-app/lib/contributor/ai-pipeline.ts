import Anthropic from "@anthropic-ai/sdk";
import type { InputJsonObject } from "@prisma/client/runtime/library";
import { appConfig } from "@/lib/config/app";
import { prisma } from "@/lib/db/prisma";
import { logTransparencyEvent } from "./workflow";
import { generateEmbedding, storeEmbedding, checkForDuplicates } from "./embeddings";

const anthropic = new Anthropic({ apiKey: appConfig.anthropicApiKey ?? "" });

interface AnalysisResult {
  biasScore: number;
  biasDetails: Record<string, unknown>;
  misinformationRisk: number;
  suggestedKeywords: string[];
  suggestedHeadlines: string[];
  readabilityScore: number;
  sentimentScore: number;
  sentimentLabel: string;
  factClaimsExtracted: string[];
  languageDetected: string;
  seoTitle: string;
  seoDescription: string;
  contentWarnings: string[];
}

const ANALYSIS_SYSTEM_PROMPT = `You are an AI journalism analysis engine. Analyze the given article/contribution and return a JSON object with the following fields:

{
  "biasScore": number 0-100 (0=no bias, 100=extreme bias),
  "biasDetails": {
    "politicalLean": "left|center|right|neutral",
    "framingIssues": string[],
    "missingPerspectives": string[]
  },
  "misinformationRisk": number 0-100 (0=low risk, 100=very high risk),
  "suggestedKeywords": string[] (8-12 SEO keywords),
  "suggestedHeadlines": string[] (exactly 3 alternative headlines),
  "readabilityScore": number 0-100 (Flesch-Kincaid adapted),
  "sentimentScore": number -1 to 1 (-1=very negative, 1=very positive),
  "sentimentLabel": "positive|negative|neutral|mixed",
  "factClaimsExtracted": string[] (specific verifiable claims that should be fact-checked),
  "languageDetected": string (ISO 639-1 code),
  "seoTitle": string (optimized title under 60 chars),
  "seoDescription": string (meta description under 160 chars),
  "contentWarnings": string[] (e.g. ["graphic content", "sensitive topic"])
}

Be objective and thorough. Only return the JSON, no explanation.`;

export async function runContributionAnalysis(
  contributionId: string,
  title: string,
  body: string,
): Promise<void> {
  if (!appConfig.anthropicApiKey) {
    console.warn("[ai-pipeline] ANTHROPIC_API_KEY not set — skipping analysis");
    return;
  }

  const input = `Title: ${title}\n\nContent:\n${body.slice(0, 6000)}`;

  try {
    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      system: ANALYSIS_SYSTEM_PROMPT,
      messages: [{ role: "user", content: input }],
    });

    const text = message.content[0]?.type === "text" ? message.content[0].text : null;
    if (!text) return;

    let result: AnalysisResult;
    try {
      result = JSON.parse(text.replace(/```json|```/g, "").trim()) as AnalysisResult;
    } catch {
      console.error("[ai-pipeline] Failed to parse analysis JSON");
      return;
    }

    await prisma.aIAnalysis.upsert({
      where: { contributionId },
      create: {
        contributionId,
        biasScore: result.biasScore,
        biasDetails: result.biasDetails as InputJsonObject,
        misinformationRisk: result.misinformationRisk,
        suggestedKeywords: result.suggestedKeywords,
        suggestedHeadlines: result.suggestedHeadlines,
        readabilityScore: result.readabilityScore,
        sentimentScore: result.sentimentScore,
        sentimentLabel: result.sentimentLabel,
        factClaimsExtracted: result.factClaimsExtracted,
        languageDetected: result.languageDetected,
        seoTitle: result.seoTitle,
        seoDescription: result.seoDescription,
        contentWarnings: result.contentWarnings,
      },
      update: {
        biasScore: result.biasScore,
        biasDetails: result.biasDetails as InputJsonObject,
        misinformationRisk: result.misinformationRisk,
        suggestedKeywords: result.suggestedKeywords,
        suggestedHeadlines: result.suggestedHeadlines,
        readabilityScore: result.readabilityScore,
        sentimentScore: result.sentimentScore,
        sentimentLabel: result.sentimentLabel,
        factClaimsExtracted: result.factClaimsExtracted,
        languageDetected: result.languageDetected,
        seoTitle: result.seoTitle,
        seoDescription: result.seoDescription,
        contentWarnings: result.contentWarnings,
      },
    });

    // Also update contribution with AI-computed scores
    await prisma.contribution.update({
      where: { id: contributionId },
      data: {
        biasScore: result.biasScore,
        riskScore: result.misinformationRisk,
        aiSummary: result.seoDescription,
      },
    });

    await logTransparencyEvent(
      contributionId,
      "AI_ANALYSIS_RUN",
      "system",
      "System",
      `AI analysis completed. Bias: ${result.biasScore}/100, Misinfo risk: ${result.misinformationRisk}/100`,
      { biasScore: result.biasScore, misinformationRisk: result.misinformationRisk },
    );
  } catch (err) {
    console.error("[ai-pipeline] Analysis failed:", err);
  }

  // Generate + store embedding, check duplicates (independent of Anthropic analysis)
  try {
    const embeddingText = `${title}\n\n${body}`;
    const embedding = await generateEmbedding(embeddingText);
    if (embedding) {
      await storeEmbedding(contributionId, embedding);
      const { isDuplicate, topSimilarity, similarContributions } = await checkForDuplicates(
        contributionId,
        embedding,
      );

      await prisma.aIAnalysis.upsert({
        where: { contributionId },
        create: {
          contributionId,
          duplicateSimilarity: topSimilarity,
          duplicateOf: isDuplicate ? similarContributions[0]?.contributionId : null,
        },
        update: {
          duplicateSimilarity: topSimilarity,
          duplicateOf: isDuplicate ? similarContributions[0]?.contributionId : null,
        },
      });

      if (isDuplicate) {
        await logTransparencyEvent(
          contributionId,
          "AI_ANALYSIS_RUN",
          "system",
          "System",
          `Potential duplicate detected (similarity: ${(topSimilarity * 100).toFixed(1)}%)`,
          { topSimilarity, duplicateOf: similarContributions[0]?.contributionId },
        );
      }
    }
  } catch (err) {
    console.error("[ai-pipeline] Embedding/duplicate check failed:", err);
  }
}

export async function extractFactClaims(
  title: string,
  body: string,
): Promise<string[]> {
  if (!appConfig.anthropicApiKey) return [];

  const message = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 512,
    system:
      "Extract the 5-10 most important verifiable factual claims from this article. Return a JSON array of strings — each string is one specific, verifiable claim. Only return the JSON array.",
    messages: [{ role: "user", content: `${title}\n\n${body.slice(0, 4000)}` }],
  });

  const text = message.content[0]?.type === "text" ? message.content[0].text : "[]";
  try {
    return JSON.parse(text.replace(/```json|```/g, "").trim()) as string[];
  } catch {
    return [];
  }
}

export async function generateAISummary(title: string, body: string): Promise<string> {
  if (!appConfig.anthropicApiKey) return "";

  const message = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 256,
    system:
      "Summarize this article in 2-3 tight sentences. Lead with the most important fact. No preamble. Return only the summary.",
    messages: [{ role: "user", content: `${title}\n\n${body.slice(0, 4000)}` }],
  });

  return message.content[0]?.type === "text" ? message.content[0].text.trim() : "";
}
