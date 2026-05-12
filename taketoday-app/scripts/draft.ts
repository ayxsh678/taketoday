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
import { draftArticle, fetchPageText, toMDX } from "../lib/pipeline/draftArticle.js";

loadEnv();

// ─── CLI args ─────────────────────────────────────────────────────────────────

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

// ─── Enum normalisation ───────────────────────────────────────────────────────

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

// ─── Main ─────────────────────────────────────────────────────────────────────

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
