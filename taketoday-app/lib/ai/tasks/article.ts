/**
 * Article generation task.
 */

import { orchestrator } from "../core/orchestrator";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ArticleGenerationOpts {
  tone?: string;
  length?: "short" | "medium" | "long";
  audience?: string;
  angle?: string;
  keywords?: string[];
  includeQuotes?: boolean;
  dateline?: string;
}

export interface GeneratedArticle {
  headline: string;
  body: string;
  summary: string;
  seoTitle: string;
  seoDesc: string;
  keywords: string[];
}

// ─── System Prompt ─────────────────────────────────────────────────────────────

const ARTICLE_SYSTEM_PROMPT = `You are a professional journalist and editor with expertise in digital news writing.
Your articles are accurate, engaging, well-structured, and optimized for both readers and search engines.

Return ONLY valid JSON matching this structure — no markdown, no explanation:
{
  "headline": "string — compelling news headline",
  "body": "string — full article body with HTML paragraph breaks (use \\n\\n between paragraphs)",
  "summary": "string — 2-3 sentence summary",
  "seoTitle": "string — SEO-optimized title, max 60 chars",
  "seoDesc": "string — meta description, max 160 chars",
  "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"]
}`;

// ─── Length Guidance ───────────────────────────────────────────────────────────

const LENGTH_WORDS: Record<string, string> = {
  short: "300-500 words",
  medium: "600-900 words",
  long: "1000-1500 words",
};

// ─── Main Function ─────────────────────────────────────────────────────────────

export async function generateArticle(
  topic: string,
  context: string,
  opts: ArticleGenerationOpts = {}
): Promise<GeneratedArticle> {
  const parts: string[] = [`Write a professional news article about: ${topic}`];

  if (context) {
    parts.push(`\nBackground context:\n${context}`);
  }

  if (opts.angle) {
    parts.push(`\nAngle/perspective: ${opts.angle}`);
  }

  if (opts.tone) {
    parts.push(`Tone: ${opts.tone}`);
  }

  if (opts.audience) {
    parts.push(`Target audience: ${opts.audience}`);
  }

  const wordCount = LENGTH_WORDS[opts.length ?? "medium"] ?? LENGTH_WORDS.medium;
  parts.push(`Article length: ${wordCount}`);

  if (opts.keywords && opts.keywords.length > 0) {
    parts.push(`Keywords to incorporate: ${opts.keywords.join(", ")}`);
  }

  if (opts.includeQuotes) {
    parts.push(
      `Include 1-2 relevant quotes (can be fabricated for demonstration purposes, clearly attributed).`
    );
  }

  if (opts.dateline) {
    parts.push(`Dateline: ${opts.dateline}`);
  }

  parts.push(
    `\nReturn ONLY valid JSON. No markdown. No code fences. Start with { and end with }.`
  );

  const result = await orchestrator.execute({
    type: "ARTICLE_GENERATION",
    prompt: parts.join("\n"),
    systemPrompt: ARTICLE_SYSTEM_PROMPT,
    jsonMode: true,
    temperature: 0.7,
    maxTokens: 4096,
    metadata: { topic, length: opts.length },
  });

  let cleaned = result.text.trim();
  if (cleaned.startsWith("```json")) cleaned = cleaned.slice(7);
  else if (cleaned.startsWith("```")) cleaned = cleaned.slice(3);
  if (cleaned.endsWith("```")) cleaned = cleaned.slice(0, -3);

  return JSON.parse(cleaned.trim()) as GeneratedArticle;
}
