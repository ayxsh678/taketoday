import { z } from "zod";

import { getAIProvider } from "@/lib/ai";

// ─── Validation schemas ───────────────────────────────────────────────────────

const nonEmpty = z.string().min(1, "must not be empty");
const takeawaysSchema = z.tuple([nonEmpty, nonEmpty, nonEmpty]);

const enrichmentOutputSchema = z.object({
  quickTake: nonEmpty,
  whyItMatters: nonEmpty,
  takeaways: takeawaysSchema,
});

// ─── Types ────────────────────────────────────────────────────────────────

export type EnrichmentOutput = z.infer<typeof enrichmentOutputSchema>;
export type EnrichableField = "quickTake" | "whyItMatters" | "takeaways";

export interface RawArticle {
  /** Parsed YAML frontmatter (fields may be missing or empty). */
  frontmatter: Record<string, unknown>;
  /** MDX body text (after the frontmatter block). */
  body: string;
}

export interface EnrichmentResult extends EnrichmentOutput {
  /** Which fields were AI-generated in this run (empty = nothing changed). */
  generated: EnrichableField[];
}

// ─── Missing-field detection ────────────────────────────────────────────────

function isMissingString(v: unknown): boolean {
  return !v || typeof v !== "string" || v.trim() === "";
}

function isMissingTakeaways(v: unknown): boolean {
  if (!Array.isArray(v) || v.length !== 3) return true;
  return v.some((t) => !t || typeof t !== "string" || t.trim() === "");
}

// ─── AI Pipeline ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are an editor for TakeToday, an independent news publication.
Given article content, generate structured editorial metadata.

Rules:
- quickTake: exactly one declarative sentence. Includes the key fact AND its implication. Never generic.
- whyItMatters: 2–3 sentences. Business/industry impact. Specific — name who, what changes, by how much.
- takeaways: exactly 3 bullets. Concrete and non-obvious. No padding.

Voice: smart, direct, slightly editorial. No fluff, no superlatives.

Good quickTake examples:
"Anthropic's agent framework now lets models explicitly escalate to a human — finally making long-running agents viable in production."
"The Fed held rates but revised its 2026 dot-plot upward — a hawkish signal markets read through the surface-level pause."

Bad quickTake examples:
"This is a major development."
"The company has announced something new."

You must respond with ONLY a valid JSON object, no markdown, no explanation. Schema:
{
  "quickTake": "string",
  "whyItMatters": "string",
  "takeaways": ["string", "string", "string"]
}`.trim();

async function callGemini(article: {
  title: string;
  deck: string;
  body: string;
  region: string;
}): Promise<EnrichmentOutput> {
  const provider = getAIProvider();

  const userMessage = `Title: ${article.title}
Deck: ${article.deck}
Target audience country: ${article.region}

Body:
${article.body.trim()}

Generate the editorial metadata fields. Ensure impact and framing reflect the target audience country.`;

  // Use generateStructured for automatic JSON parsing and validation
  const result = await provider.generateStructured(
    userMessage,
    enrichmentOutputSchema,
    {
      systemInstruction: SYSTEM_PROMPT,
      temperature: 0.4,
    }
  );

  return result;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Enriches a raw MDX article by generating any missing AI fields.
 *
 * - By default, skips fields that are already populated.
 * - Pass `{ force: true }` to regenerate everything regardless.
 * - All AI output is validated against Zod before returning.
 * - Requires GEMINI_API_KEY in the environment.
 */
export async function enrichArticle(
  raw: RawArticle,
  options: { force?: boolean } = {}
): Promise<EnrichmentResult> {
  const { frontmatter, body } = raw;
  const force = options.force ?? false;

  const needsQuickTake = force || isMissingString(frontmatter.quickTake);
  const needsWhyItMatters = force || isMissingString(frontmatter.whyItMatters);
  const needsTakeaways = force || isMissingTakeaways(frontmatter.takeaways);

  const generated: EnrichableField[] = [];
  if (needsQuickTake) generated.push("quickTake");
  if (needsWhyItMatters) generated.push("whyItMatters");
  if (needsTakeaways) generated.push("takeaways");

  // Nothing to do — validate existing fields and return early.
  if (generated.length === 0) {
    const existing = {
      quickTake: frontmatter.quickTake as string,
      whyItMatters: frontmatter.whyItMatters as string,
      takeaways: frontmatter.takeaways as [string, string, string],
    };
    const validated = enrichmentOutputSchema.safeParse(existing);
    if (!validated.success) {
      throw new Error(`Existing fields failed validation:\n${validated.error.message}`);
    }
    return { ...validated.data, generated: [] };
  }

  const title = frontmatter.title ? String(frontmatter.title) : "(untitled)";
  const deck = frontmatter.deck ? String(frontmatter.deck) : "";
  const region = frontmatter.region ? String(frontmatter.region) : "GLOBAL";

  const aiOutput = await callGemini({ title, deck, body, region });

  const result: EnrichmentOutput = {
    quickTake: needsQuickTake ? aiOutput.quickTake : (frontmatter.quickTake as string),
    whyItMatters: needsWhyItMatters ? aiOutput.whyItMatters : (frontmatter.whyItMatters as string),
    takeaways: needsTakeaways
      ? aiOutput.takeaways
      : (frontmatter.takeaways as [string, string, string]),
  };

  const finalValidated = enrichmentOutputSchema.safeParse(result);
  if (!finalValidated.success) {
    throw new Error(`Final enrichment failed validation:\n${finalValidated.error.message}`);
  }

  return { ...finalValidated.data, generated };
}