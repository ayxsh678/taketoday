#!/usr/bin/env tsx
/**
 * TakeToday — AI Draft Generator
 *
 * Generates a ready-to-publish MDX article in the TakeToday voice.
 * Requires ANTHROPIC_API_KEY in the environment.
 *
 * Usage:
 *   npm run draft -- --topic "Fed raises rates again"
 *   npm run draft -- --url "https://example.com/article"
 *   npm run draft -- --topic "Nvidia earnings" --category Finance --format SmartBreakdown
 *   npm run draft -- --topic "..." --dry-run   (prints MDX, doesn't write file)
 */

import Anthropic from "@anthropic-ai/sdk";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { loadEnv } from "./utils/loadEnv.js";

loadEnv();

// ─── CLI args ────────────────────────────────────────────────────────────────

function parseArgs(argv: string[]): {
  topic?: string;
  url?: string;
  category?: string;
  format?: string;
  region?: string;
  dryRun: boolean;
} {
  const args = argv.slice(2);
  const get = (flag: string) => {
    const i = args.indexOf(flag);
    return i !== -1 && i + 1 < args.length ? args[i + 1] : undefined;
  };
  return {
    topic: get("--topic"),
    url: get("--url"),
    category: get("--category"),
    format: get("--format"),
    region: get("--region"),
    dryRun: args.includes("--dry-run"),
  };
}

// ─── URL fetcher ─────────────────────────────────────────────────────────────

async function fetchPageText(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { "User-Agent": "TakeToday-Drafter/1.0" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`);
  const html = await res.text();

  // Strip tags, collapse whitespace, trim to ~8000 chars to stay in budget
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 8000);

  return text;
}

// ─── MDX serialiser ──────────────────────────────────────────────────────────

interface ArticleDraft {
  slug: string;
  title: string;
  deck: string;
  category: string;
  format: string;
  region: string;
  quickTake: string;
  whyItMatters: string;
  takeaways: [string, string, string];
  body: string;
}

function toMDX(draft: ArticleDraft, publishedAt: string): string {
  const yaml = [
    `---`,
    `slug: ${draft.slug}`,
    `title: "${draft.title.replace(/"/g, '\\"')}"`,
    `deck: "${draft.deck.replace(/"/g, '\\"')}"`,
    `category: ${draft.category}`,
    `format: ${draft.format}`,
    `region: ${draft.region}`,
    `publishedAt: "${publishedAt}"`,
    `author:`,
    `  name: TakeToday Newsroom`,
    `  type: Organization`,
    `quickTake: "${draft.quickTake.replace(/"/g, '\\"')}"`,
    `whyItMatters: "${draft.whyItMatters.replace(/"/g, '\\"')}"`,
    `takeaways:`,
    ...draft.takeaways.map((t) => `  - "${t.replace(/"/g, '\\"')}"`),
    `---`,
  ].join("\n");

  return `${yaml}\n\n${draft.body.trim()}\n`;
}

// ─── Claude call ─────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a writer for TakeToday, an independent news publication.
Your job is to draft a single article from a topic or source material.

## Voice & style rules

- Headlines are specific and slightly wry — never generic ("Company Announces X")
- Write for a smart, time-poor reader: no fluff, no throat-clearing
- Explain WHY something happened and WHY it matters — not just what
- No jargon unless unavoidable; when used, define inline
- No superlatives ("biggest", "most important", "revolutionary") unless literally true
- Short paragraphs (2–4 sentences max)
- Body uses H3 headers for sections (###) — make them statements or pointed questions
- Punchy first sentence — drop the reader in mid-scene or mid-consequence

## Structural requirements

- slug: URL-safe kebab-case, ≤60 chars, derived from the headline
- title: specific and slightly editorial (not a wire headline)
- deck: one sentence, contextualises the headline — gives the "so what"
- category: exactly one of: AI, Finance, Tech, Startups, Briefings, India, International
- format: exactly one of: QuickNews (60–100w body), SmartBreakdown (150–300w body), DeepDive (400–700w body), SocialPost
- region: exactly one of: IN (India-focused), US (US-focused), GLOBAL (cross-regional). Frame impact, examples, and implications for that audience.
- quickTake: exactly one sentence. Declarative. Includes the key fact and its implication.
- whyItMatters: 2–3 sentences. Business/industry impact. No "this is big" — be specific about who, what changes.
- takeaways: exactly 3 bullets. Each is concrete and non-obvious. No padding.
- body: MDX prose. H3 headers for sections. Match word count to the chosen format.

## Examples of good quickTakes

"Anthropic's new agent framework lets models explicitly give up and escalate to a human — a feature that finally makes long-running agents viable in production."
"The Fed held rates for the third consecutive meeting, but revised its 2026 dot-plot upward — a signal markets read as a hawkish tilt despite the surface-level pause."

## Examples of bad quickTakes

"This is a major development in the tech industry." ❌
"Anthropic has announced a new feature." ❌`.trim();

async function draftArticle(
  client: Anthropic,
  input: string,
  hints: { category?: string; format?: string; region?: string },
): Promise<ArticleDraft> {
  const hintText =
    [
      hints.category && `Preferred category: ${hints.category}`,
      hints.format && `Preferred format: ${hints.format}`,
      hints.region && `Target region: ${hints.region}`,
    ]
      .filter(Boolean)
      .join("\n") || "";

  const userMessage = [
    hintText,
    `Draft a TakeToday article from the following:\n\n${input}`,
  ]
    .filter(Boolean)
    .join("\n\n");

  const response = await client.messages.create({
    model: "claude-opus-4-7",
    max_tokens: 4096,
    thinking: { type: "adaptive" },
    system: [
      {
        type: "text",
        text: SYSTEM_PROMPT,
        cache_control: { type: "ephemeral" },
      },
    ],
    tools: [
      {
        name: "write_article_draft",
        description: "Write a structured TakeToday article draft.",
        input_schema: {
          type: "object" as const,
          properties: {
            slug: {
              type: "string",
              description: "URL-safe kebab-case slug, ≤60 chars",
            },
            title: { type: "string", description: "Article headline" },
            deck: {
              type: "string",
              description: "One-sentence subtitle / so-what",
            },
            category: {
              type: "string",
              enum: ["AI", "Finance", "Tech", "Startups", "Briefings", "India", "International"],
            },
            format: {
              type: "string",
              enum: [
                "QuickNews",
                "SmartBreakdown",
                "DeepDive",
                "SocialPost",
              ],
            },
            region: {
              type: "string",
              enum: ["IN", "US", "GLOBAL"],
              description: "Geographic audience: IN (India), US (United States), GLOBAL (cross-regional)",
            },
            quickTake: {
              type: "string",
              description: "One declarative sentence with fact + implication",
            },
            whyItMatters: {
              type: "string",
              description: "2–3 sentences on business/industry impact",
            },
            takeaways: {
              type: "array",
              items: { type: "string" },
              minItems: 3,
              maxItems: 3,
              description: "Exactly 3 concrete, non-obvious bullets",
            },
            body: {
              type: "string",
              description:
                "MDX prose body, H3 section headers, word count matching format",
            },
          },
          required: [
            "slug",
            "title",
            "deck",
            "category",
            "format",
            "region",
            "quickTake",
            "whyItMatters",
            "takeaways",
            "body",
          ],
          additionalProperties: false,
        },
      },
    ],
    tool_choice: { type: "tool", name: "write_article_draft" },
    messages: [{ role: "user", content: userMessage }],
  });

  const toolBlock = response.content.find((b) => b.type === "tool_use");
  if (!toolBlock || toolBlock.type !== "tool_use") {
    throw new Error("Claude did not return a tool_use block");
  }

  const draft = toolBlock.input as ArticleDraft;

  // Normalise takeaways — Claude occasionally returns 3 but typed as string[]
  if (!Array.isArray(draft.takeaways) || draft.takeaways.length !== 3) {
    throw new Error(`Expected 3 takeaways, got ${JSON.stringify(draft.takeaways)}`);
  }

  return draft;
}

// ─── Main ────────────────────────────────────────────────────────────────────

const ALLOWED_CATEGORIES = ["AI", "Finance", "Tech", "Startups", "Briefings", "India", "International"] as const;
const ALLOWED_FORMATS = ["QuickNews", "SmartBreakdown", "DeepDive", "SocialPost"] as const;
const ALLOWED_REGIONS = ["IN", "US", "GLOBAL"] as const;

function normalizeEnum<T extends string>(
  value: string | undefined,
  allowed: readonly T[],
  name: string,
): T | undefined {
  if (!value) return undefined;
  const match = allowed.find((opt) => opt.toLowerCase() === value.toLowerCase());
  if (!match) {
    console.error(`Invalid --${name} "${value}". Expected one of: ${allowed.join(", ")}`);
    process.exit(1);
  }
  return match;
}

async function main() {
  const { topic, url, category, format, region, dryRun } = parseArgs(process.argv);

  if (!topic && !url) {
    console.error("Usage: npm run draft -- --topic \"...\" | --url \"https://...\"");
    console.error("Exactly one of --topic or --url must be provided.");
    console.error("Options: --category AI|Finance|Tech|Startups|Briefings|India|International");
    console.error("         --format QuickNews|SmartBreakdown|DeepDive|SocialPost");
    console.error("         --region IN|US|GLOBAL  (default: GLOBAL)");
    console.error("         --dry-run   (print MDX to stdout, don't write file)");
    process.exit(1);
  }

  if (topic && url) {
    console.error("--topic and --url are mutually exclusive. Provide exactly one.");
    process.exit(1);
  }

  const normalizedCategory = normalizeEnum(category, ALLOWED_CATEGORIES, "category");
  const normalizedFormat = normalizeEnum(format, ALLOWED_FORMATS, "format");
  const normalizedRegion = normalizeEnum(region, ALLOWED_REGIONS, "region") ?? "GLOBAL";

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error("ANTHROPIC_API_KEY is not set");
    process.exit(1);
  }

  const client = new Anthropic({ apiKey });

  // Build the input text for Claude
  let inputText: string;
  if (url) {
    console.log(`Fetching ${url}…`);
    const pageText = await fetchPageText(url);
    inputText = `Source URL: ${url}\n\nPage content:\n${pageText}`;
  } else {
    inputText = `Topic: ${topic}`;
  }

  console.log("Drafting article…");
  const draft = await draftArticle(client, inputText, {
    category: normalizedCategory,
    format: normalizedFormat,
    region: normalizedRegion,
  });

  const publishedAt = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
  const mdx = toMDX(draft, publishedAt);

  if (dryRun) {
    console.log("\n" + "─".repeat(60));
    console.log(mdx);
    console.log("─".repeat(60));
    console.log("\n[dry-run] File not written.");
    return;
  }

  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const outDir = path.join(__dirname, "..", "content", "articles");
  const outPath = path.join(outDir, `${draft.slug}.mdx`);

  // Guard against accidental overwrite
  try {
    await fs.access(outPath);
    console.error(`\nFile already exists: ${outPath}`);
    console.error("Use --dry-run to preview, or rename the slug manually.");
    process.exit(1);
  } catch {
    // File doesn't exist — safe to write
  }

  await fs.writeFile(outPath, mdx, "utf8");

  console.log(`\nWritten: ${path.relative(process.cwd(), outPath)}`);
  console.log(`Title:   ${draft.title}`);
  console.log(`Slug:    ${draft.slug}`);
  console.log(`Cat:     ${draft.category} / ${draft.format}`);
  console.log(`Region:  ${draft.region}`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
