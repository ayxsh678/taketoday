#!/usr/bin/env tsx
/**
 * TakeToday — Newsletter Brief Generator
 *
 * Compiles recent articles into a Buttondown-ready email draft using Claude
 * to write the editorial lede and story intros.
 *
 * Requires:
 *   ANTHROPIC_API_KEY  — Claude API key
 *   BUTTONDOWN_API_KEY — Buttondown API key (skipped in --dry-run mode)
 *
 * Usage:
 *   npm run newsletter                      # last 7 days → Buttondown draft
 *   npm run newsletter -- --days 14         # wider lookback window
 *   npm run newsletter -- --dry-run         # print email to stdout, no POST
 *   npm run newsletter -- --send            # create email + mark as about_to_send
 *   npm run newsletter -- --dry-run --days 30
 */

import Anthropic from "@anthropic-ai/sdk";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import matter from "gray-matter";
import { loadEnv } from "./utils/loadEnv.js";

loadEnv();

// ─── CLI args ────────────────────────────────────────────────────────────────

function parseArgs(argv: string[]): {
  days: number;
  dryRun: boolean;
  send: boolean;
} {
  const args = argv.slice(2);
  const get = (flag: string) => {
    const i = args.indexOf(flag);
    return i !== -1 && i + 1 < args.length ? args[i + 1] : undefined;
  };
  const rawDays = parseInt(get("--days") ?? "7", 10);
  const days = isNaN(rawDays) || rawDays < 1
    ? (console.warn("⚠️  Invalid --days value; defaulting to 7."), 7)
    : rawDays;
  return {
    days,
    dryRun: args.includes("--dry-run"),
    send: args.includes("--send"),
  };
}

// ─── Article loader ───────────────────────────────────────────────────────────

interface ArticleFrontmatter {
  slug: string;
  title: string;
  deck: string;
  category: string;
  region: string;
  format: string;
  publishedAt: string;
  quickTake: string;
  whyItMatters: string;
  takeaways: string[];
}

interface LoadedArticle extends ArticleFrontmatter {
  body: string;
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ARTICLES_DIR = path.join(__dirname, "../content/articles");
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL?.trim() ?? "https://taketoday.vercel.app";

async function loadRecentArticles(withinDays: number): Promise<LoadedArticle[]> {
  const cutoff = new Date(Date.now() - withinDays * 24 * 60 * 60 * 1000);
  const files = await fs.readdir(ARTICLES_DIR);
  const mdxFiles = files.filter((f) => f.endsWith(".mdx"));

  const articles: LoadedArticle[] = [];

  for (const file of mdxFiles) {
    const raw = await fs.readFile(path.join(ARTICLES_DIR, file), "utf-8");
    const { data, content } = matter(raw);
    const fm = data as Partial<ArticleFrontmatter>;

    if (!fm.publishedAt || !fm.slug || !fm.title) continue;

    const published = new Date(fm.publishedAt);
    if (isNaN(published.getTime()) || published < cutoff) continue;

    articles.push({
      slug: fm.slug,
      title: fm.title,
      deck: fm.deck ?? "",
      category: fm.category ?? "Briefings",
      region: fm.region ?? "GLOBAL",
      format: fm.format ?? "QuickNews",
      publishedAt: fm.publishedAt,
      quickTake: fm.quickTake ?? "",
      whyItMatters: fm.whyItMatters ?? "",
      takeaways: fm.takeaways ?? [],
      body: content.trim(),
    });
  }

  // Most recent first; cap at 6 stories
  return articles
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    .slice(0, 6);
}

// ─── Date formatting ──────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

function briefDate(): string {
  return new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

// ─── Claude editorial generation ─────────────────────────────────────────────

interface EditorialCopy {
  subject: string;
  lede: string;
  storyIntros: string[]; // one per article, same order
}

const EDITORIAL_SYSTEM = `You are the editor of TakeToday, a sharp independent news publication.
Your writing is confident, specific, and slightly wry — no filler, no fluff.
You write for smart, time-poor readers who want insight, not just information.

Voice rules:
- Short sentences. Strong verbs. No passive voice if avoidable.
- No superlatives ("most important", "biggest ever") unless literally true
- Don't say "in a world where..." or "as we navigate..."
- Be specific — name the thing, name the number, name the consequence
- One idea per sentence`;

async function generateEditorial(
  articles: LoadedArticle[],
  client: Anthropic,
): Promise<EditorialCopy> {
  const articleSummaries = articles
    .map(
      (a, i) =>
        `Story ${i + 1}: ${a.title}\nCategory: ${a.category} | Region: ${a.region}\nDeck: ${a.deck}\nQuickTake: ${a.quickTake}\nWhy it matters: ${a.whyItMatters}`,
    )
    .join("\n\n---\n\n");

  const prompt = `Here are the ${articles.length} stories in this week's TakeToday brief:

${articleSummaries}

Write three things:

1. SUBJECT — A single email subject line (max 60 chars). Make it specific to the most compelling story or theme in this batch. Not "TakeToday Weekly" — something that makes the reader open it.

2. LEDE — A 3–4 sentence editorial intro that ties these stories together thematically. Start with the most interesting throughline, not a list of what's inside. Don't say "this week" or "in today's brief".

3. STORY_INTROS — One sentence per story (${articles.length} total), in the same order as above. Each is a tightly written editorial intro that contextualizes why this particular story belongs in this issue. Not just a restatement of the deck — add a perspective or link to the broader theme.

Format your response exactly like this:
SUBJECT: [subject line]
LEDE: [lede text]
STORY_INTROS:
1. [intro for story 1]
2. [intro for story 2]
...`;

  const msg = await client.messages.create({
    model: "claude-opus-4-7",
    max_tokens: 1024,
    system: EDITORIAL_SYSTEM,
    messages: [{ role: "user", content: prompt }],
  });

  const text = msg.content
    .filter((b) => b.type === "text")
    .map((b) => (b as { type: "text"; text: string }).text)
    .join("");

  return parseEditorialResponse(text, articles.length);
}

function parseEditorialResponse(text: string, count: number): EditorialCopy {
  const subjectMatch = text.match(/^SUBJECT:\s*(.+)$/m);
  const ledeMatch = text.match(/^LEDE:\s*([\s\S]+?)(?=\nSTORY_INTROS:|$)/m);

  const subject = subjectMatch?.[1]?.trim() ?? `TakeToday — ${briefDate()}`;
  const lede = ledeMatch?.[1]?.trim() ?? "";

  // Extract the STORY_INTROS block first, then parse numbered lines within it.
  // Accepting both "1." and "1)" styles, optional leading whitespace.
  const introBlockMatch = text.match(/^STORY_INTROS:\s*\n([\s\S]+?)(?=\n[A-Z_]+:|$)/m);
  const introBlock = introBlockMatch?.[1] ?? text;

  const storyIntros: string[] = [];
  for (let i = 1; i <= count; i++) {
    const match = introBlock.match(new RegExp(`^\\s*${i}[.)]\\s+(.+)$`, "m"));
    const intro = match?.[1]?.trim() ?? "";
    if (!intro) {
      console.warn(`⚠️  No intro found for story ${i}; email will omit it.`);
    }
    storyIntros.push(intro);
  }

  return { subject, lede, storyIntros };
}

// ─── Email composer ───────────────────────────────────────────────────────────

function composeEmail(articles: LoadedArticle[], copy: EditorialCopy): string {
  const date = briefDate();

  const storySections = articles
    .map((a, i) => {
      const intro = copy.storyIntros[i] ? `${copy.storyIntros[i]}\n\n` : "";
      const url = `${SITE_URL}/article/${a.slug}`;
      const takeawayLines = a.takeaways.length
        ? `\n${a.takeaways.map((t) => `- ${t}`).join("\n")}\n`
        : "";

      return [
        `## ${a.title}`,
        `*${a.deck}*`,
        "",
        intro + `**${a.quickTake}**`,
        takeawayLines,
        `[Read the full brief →](${url})`,
      ]
        .filter((l) => l !== undefined)
        .join("\n")
        .trim();
    })
    .join("\n\n---\n\n");

  return [
    `# TakeToday — ${date}`,
    "",
    copy.lede,
    "",
    "---",
    "",
    storySections,
    "",
    "---",
    "",
    `*You're receiving this because you subscribed at [taketoday.vercel.app](${SITE_URL}). [Unsubscribe]({{ unsubscribe_url }})*`,
  ].join("\n");
}

// ─── Buttondown API ───────────────────────────────────────────────────────────

const BUTTONDOWN_EMAILS_URL = "https://api.buttondown.com/v1/emails";

async function postToButtondown(
  subject: string,
  body: string,
  send: boolean,
): Promise<{ id: string; absolute_url?: string }> {
  const apiKey = process.env.BUTTONDOWN_API_KEY;
  if (!apiKey) {
    throw new Error("BUTTONDOWN_API_KEY is not set in the environment.");
  }

  const payload: Record<string, unknown> = {
    subject,
    body,
    status: send ? "about_to_send" : "draft",
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15_000);

  let res: Response;
  try {
    res = await fetch(BUTTONDOWN_EMAILS_URL, {
      method: "POST",
      headers: {
        Authorization: `Token ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }

  const data = (await res.json()) as Record<string, unknown>;

  if (!res.ok) {
    const detail = typeof data.detail === "string" ? data.detail : JSON.stringify(data);
    throw new Error(`Buttondown API error ${res.status}: ${detail}`);
  }

  return data as { id: string; absolute_url?: string };
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const { days, dryRun, send } = parseArgs(process.argv);

  console.log(`\n📰 TakeToday Newsletter Generator`);
  console.log(`   Looking back: ${days} days`);
  console.log(`   Mode: ${dryRun ? "dry-run (stdout only)" : send ? "send immediately" : "create draft"}\n`);

  // 1. Load articles
  const articles = await loadRecentArticles(days);
  if (articles.length === 0) {
    console.error(`❌ No articles found in the last ${days} days. Try --days 30.`);
    process.exit(1);
  }
  console.log(`✓ Found ${articles.length} article${articles.length !== 1 ? "s" : ""}:`);
  articles.forEach((a) => console.log(`  • ${a.title} (${a.category}, ${a.publishedAt.slice(0, 10)})`));

  // 2. Generate editorial copy
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (!anthropicKey) {
    console.error("\n❌ ANTHROPIC_API_KEY is not set.");
    process.exit(1);
  }

  console.log("\n✍️  Generating editorial copy via Claude…");
  const client = new Anthropic({ apiKey: anthropicKey });
  const copy = await generateEditorial(articles, client);

  console.log(`\n   Subject: "${copy.subject}"`);

  // 3. Compose email
  const emailBody = composeEmail(articles, copy);

  if (dryRun) {
    console.log("\n" + "─".repeat(72));
    console.log(`SUBJECT: ${copy.subject}`);
    console.log("─".repeat(72));
    console.log(emailBody);
    console.log("─".repeat(72));
    console.log("\n✓ Dry run complete. Nothing was sent to Buttondown.\n");
    return;
  }

  // 4. Post to Buttondown
  console.log("\n📤 Posting to Buttondown…");
  const result = await postToButtondown(copy.subject, emailBody, send);

  const status = send ? "queued to send" : "saved as draft";
  console.log(`\n✅ Email ${status}.`);
  console.log(`   ID: ${result.id}`);
  if (result.absolute_url) {
    console.log(`   URL: ${result.absolute_url}`);
  }
  console.log(`\n   Review it at: https://buttondown.com/emails\n`);
}

main().catch((err) => {
  console.error("\n❌", err instanceof Error ? err.message : err);
  process.exit(1);
});
