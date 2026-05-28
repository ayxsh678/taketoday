/**
 * Re-exports all task functions plus convenience helpers.
 */

export { generateCarousel, buildCarouselPrompt, CAROUSEL_SYSTEM_PROMPT } from "./carousel";
export type {
  CarouselSlide,
  CarouselOutput,
  CarouselGenerationOpts,
  CarouselFormat,
  CarouselSlideType,
} from "./carousel";

export { generateArticle } from "./article";
export type { ArticleGenerationOpts, GeneratedArticle } from "./article";

import { orchestrator } from "../core/orchestrator";

// ─── SEO Metadata ─────────────────────────────────────────────────────────────

export async function generateSEO(
  title: string,
  body: string
): Promise<{ title: string; description: string; keywords: string[] }> {
  const prompt = `Generate SEO metadata for the following article.
Title: ${title}

Body (excerpt):
${body.slice(0, 1000)}

Return ONLY valid JSON:
{
  "title": "SEO title, max 60 chars",
  "description": "meta description, max 160 chars",
  "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"]
}`;

  const result = await orchestrator.execute({
    type: "SEO_METADATA",
    prompt,
    jsonMode: true,
    temperature: 0.3,
    maxTokens: 512,
  });

  let cleaned = result.text.trim();
  if (cleaned.startsWith("```json")) cleaned = cleaned.slice(7);
  else if (cleaned.startsWith("```")) cleaned = cleaned.slice(3);
  if (cleaned.endsWith("```")) cleaned = cleaned.slice(0, -3);

  return JSON.parse(cleaned.trim()) as { title: string; description: string; keywords: string[] };
}

// ─── Headline Variants ────────────────────────────────────────────────────────

export async function generateHeadlines(
  title: string,
  body: string
): Promise<string[]> {
  const prompt = `Generate 5 compelling headline variants for this article.

Original title: ${title}

Article summary:
${body.slice(0, 500)}

Return ONLY valid JSON array of 5 headline strings:
["Headline 1", "Headline 2", "Headline 3", "Headline 4", "Headline 5"]`;

  const result = await orchestrator.execute({
    type: "HEADLINE_VARIANTS",
    prompt,
    jsonMode: true,
    temperature: 0.8,
    maxTokens: 512,
  });

  let cleaned = result.text.trim();
  if (cleaned.startsWith("```json")) cleaned = cleaned.slice(7);
  else if (cleaned.startsWith("```")) cleaned = cleaned.slice(3);
  if (cleaned.endsWith("```")) cleaned = cleaned.slice(0, -3);

  return JSON.parse(cleaned.trim()) as string[];
}

// ─── Social Captions ──────────────────────────────────────────────────────────

export async function generateCaptions(
  content: string,
  platforms: string[]
): Promise<Record<string, string>> {
  const prompt = `Generate social media captions for the following content.
Platforms: ${platforms.join(", ")}

Content:
${content.slice(0, 800)}

Return ONLY valid JSON with a caption for each platform:
{
  ${platforms.map((p) => `"${p}": "caption for ${p}"`).join(",\n  ")}
}`;

  const result = await orchestrator.execute({
    type: "SOCIAL_CAPTION",
    prompt,
    jsonMode: true,
    temperature: 0.8,
    maxTokens: 1024,
    metadata: { platforms },
  });

  let cleaned = result.text.trim();
  if (cleaned.startsWith("```json")) cleaned = cleaned.slice(7);
  else if (cleaned.startsWith("```")) cleaned = cleaned.slice(3);
  if (cleaned.endsWith("```")) cleaned = cleaned.slice(0, -3);

  return JSON.parse(cleaned.trim()) as Record<string, string>;
}

// ─── Summarization ────────────────────────────────────────────────────────────

export async function generateSummary(title: string, body: string): Promise<string> {
  const prompt = `Summarize the following article in 2-3 concise sentences.

Title: ${title}

Body:
${body.slice(0, 2000)}

Return only the summary text, no JSON, no formatting.`;

  const result = await orchestrator.execute({
    type: "SUMMARIZATION",
    prompt,
    temperature: 0.3,
    maxTokens: 256,
  });

  return result.text.trim();
}

// ─── Rewrite ──────────────────────────────────────────────────────────────────

export async function rewrite(text: string, tone: string): Promise<string> {
  const prompt = `Rewrite the following text with a ${tone} tone.
Preserve the core information but adjust the style and voice accordingly.

Text to rewrite:
${text}

Return only the rewritten text, no explanation.`;

  const result = await orchestrator.execute({
    type: "REWRITE",
    prompt,
    temperature: 0.6,
    maxTokens: Math.max(512, Math.ceil(text.length / 3)),
    metadata: { tone },
  });

  return result.text.trim();
}

// ─── Distribution Post ────────────────────────────────────────────────────────

export async function generateDistributionPost(
  content: string,
  platform: string
): Promise<string> {
  const prompt = `Create a distribution post for ${platform} to promote the following content.
Make it engaging, platform-appropriate, and include relevant hashtags if applicable.

Content:
${content.slice(0, 800)}

Return only the post text, no explanation.`;

  const result = await orchestrator.execute({
    type: "DISTRIBUTION_POST",
    prompt,
    temperature: 0.7,
    maxTokens: 512,
    metadata: { platform },
  });

  return result.text.trim();
}
