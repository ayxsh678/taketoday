import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";

// ─── Validation schemas ───────────────────────────────────────────────────────

const nonEmpty = z.string().min(1, "must not be empty");
const takeawaysSchema = z.tuple([nonEmpty, nonEmpty, nonEmpty]);

const enrichmentOutputSchema = z.object({
  quickTake: nonEmpty,
  whyItMatters: nonEmpty,
  takeaways: takeawaysSchema,
});

// ─── Types ────────────────────────────────────────────────────────────────────

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

// ─── Missing-field detection ──────────────────────────────────────────────────

function isMissingString(v: unknown): boolean {
  return !v || typeof v !== "string" || v.trim() === "";
}

function isMissingTakeaways(v: unknown): boolean {
  if (!Array.isArray(v) || v.length !== 3) return true;
  return v.some((t) => !t || typeof t !== "string" || t.trim() === "");
}

// ─── Claude call ──────────────────────────────────────────────────────────────

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
"This is a major development." ❌
"The company has announced something new." ❌`.trim();

async function callClaude(
  client: Anthropic,
  article: { title: string; deck: string; body: string },
): Promise<EnrichmentOutput> {
  const userMessage = `Title: ${article.title}
Deck: ${article.deck}

Body:
${article.body.trim()}

Generate the editorial metadata fields.`;

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    system: [
      {
        type: "text",
        text: SYSTEM_PROMPT,
        cache_control: { type: "ephemeral" },
      },
    ],
    tools: [
      {
        name: "write_metadata",
        description: "Write editorial metadata for the article.",
        input_schema: {
          type: "object" as const,
          properties: {
            quickTake: {
              type: "string",
              description: "One declarative sentence: key fact + implication",
            },
            whyItMatters: {
              type: "string",
              description: "2–3 sentences on business/industry impact (specific)",
            },
            takeaways: {
              type: "array",
              items: { type: "string" },
              minItems: 3,
              maxItems: 3,
              description: "Exactly 3 concrete, non-obvious bullets",
            },
          },
          required: ["quickTake", "whyItMatters", "takeaways"],
          additionalProperties: false,
        },
      },
    ],
    tool_choice: { type: "tool", name: "write_metadata" },
    messages: [{ role: "user", content: userMessage }],
  });

  const toolBlock = response.content.find((b) => b.type === "tool_use");
  if (!toolBlock || toolBlock.type !== "tool_use") {
    throw new Error("Claude did not return a tool_use block");
  }

  const parsed = toolBlock.input as Record<string, unknown>;

  // Normalise: ensure takeaways is exactly a 3-tuple
  if (!Array.isArray(parsed.takeaways) || parsed.takeaways.length !== 3) {
    throw new Error(
      `Expected 3 takeaways, got: ${JSON.stringify(parsed.takeaways)}`,
    );
  }

  const validated = enrichmentOutputSchema.safeParse(parsed);
  if (!validated.success) {
    throw new Error(
      `AI output failed Zod validation:\n${validated.error.message}`,
    );
  }

  return validated.data;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Enriches a raw MDX article by generating any missing AI fields.
 *
 * - By default, skips fields that are already populated.
 * - Pass `{ force: true }` to regenerate everything regardless.
 * - All AI output is validated against Zod before returning.
 * - Requires ANTHROPIC_API_KEY in the environment.
 */
export async function enrichArticle(
  raw: RawArticle,
  options: { force?: boolean } = {},
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
      throw new Error(
        `Existing fields failed validation:\n${validated.error.message}`,
      );
    }
    return { ...validated.data, generated: [] };
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");

  const client = new Anthropic({ apiKey });

  const title = frontmatter.title ? String(frontmatter.title) : "(untitled)";
  const deck = frontmatter.deck ? String(frontmatter.deck) : "";

  const aiOutput = await callClaude(client, { title, deck, body });

  // Merge: use AI output only for fields that needed generation.
  const result: EnrichmentOutput = {
    quickTake: needsQuickTake
      ? aiOutput.quickTake
      : (frontmatter.quickTake as string),
    whyItMatters: needsWhyItMatters
      ? aiOutput.whyItMatters
      : (frontmatter.whyItMatters as string),
    takeaways: needsTakeaways
      ? aiOutput.takeaways
      : (frontmatter.takeaways as [string, string, string]),
  };

  // Final validation pass on the merged result.
  const finalValidated = enrichmentOutputSchema.safeParse(result);
  if (!finalValidated.success) {
    throw new Error(
      `Final enrichment failed validation:\n${finalValidated.error.message}`,
    );
  }

  return { ...finalValidated.data, generated };
}
