import Anthropic from "@anthropic-ai/sdk";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ArticleDraft {
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

export interface DraftHints {
  category?: string;
  format?: string;
  region?: string;
}

// ─── URL fetcher ──────────────────────────────────────────────────────────────

export async function fetchPageText(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { "User-Agent": "TakeToday-Drafter/1.0" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`);
  const html = await res.text();

  return html
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
}

// ─── MDX serialiser ───────────────────────────────────────────────────────────

export function toMDX(draft: ArticleDraft, publishedAt: string): string {
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

// ─── System prompt ────────────────────────────────────────────────────────────

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

// ─── Claude call ──────────────────────────────────────────────────────────────

export async function draftArticle(
  client: Anthropic,
  input: string,
  hints: DraftHints,
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
            slug: { type: "string", description: "URL-safe kebab-case slug, ≤60 chars" },
            title: { type: "string", description: "Article headline" },
            deck: { type: "string", description: "One-sentence subtitle / so-what" },
            category: {
              type: "string",
              enum: ["AI", "Finance", "Tech", "Startups", "Briefings", "India", "International"],
            },
            format: {
              type: "string",
              enum: ["QuickNews", "SmartBreakdown", "DeepDive", "SocialPost"],
            },
            region: {
              type: "string",
              enum: ["IN", "US", "GLOBAL"],
              description: "Geographic audience",
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
              description: "MDX prose body, H3 section headers, word count matching format",
            },
          },
          required: ["slug", "title", "deck", "category", "format", "region", "quickTake", "whyItMatters", "takeaways", "body"],
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

  if (!Array.isArray(draft.takeaways) || draft.takeaways.length !== 3) {
    throw new Error(`Expected 3 takeaways, got ${JSON.stringify(draft.takeaways)}`);
  }

  return draft;
}
