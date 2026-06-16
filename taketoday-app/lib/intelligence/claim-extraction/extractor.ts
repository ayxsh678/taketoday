import 'server-only';
import { callLLMWithTool } from '@/lib/ai/llm';
import type { ClaimType } from '@prisma/client';
import type { ExtractedClaim } from '@/lib/intelligence/types';

const CLAIM_TYPES: ClaimType[] = [
  'QUANTITATIVE', 'CAUSAL', 'ATTRIBUTIONAL', 'PREDICTIVE', 'HISTORICAL', 'COMPARATIVE',
];

const HEDGING_WORDS = [
  'allegedly', 'reportedly', 'according to', 'sources say', 'may', 'might', 'could',
  'is said to', 'is believed to', 'claims', 'unconfirmed', 'appears to', 'seems to',
];

const SYSTEM_PROMPT = `You are a fact-checker extracting verifiable claims from news articles.

Claim types:
- QUANTITATIVE: numeric claims ("revenue grew 45%", "1.2 million users")
- CAUSAL: cause-effect claims ("X happened because of Y", "led to", "caused")
- ATTRIBUTIONAL: quotes or statements attributed to a person/org ("CEO said...", "company announced...")
- PREDICTIVE: forward-looking claims ("expects", "will reach", "projected to")
- HISTORICAL: past-tense factual claims ("in 2019, they filed...", "previously earned...")
- COMPARATIVE: relative claims ("largest ever", "fastest growth", "first to...")

For each claim:
- subject: who/what the claim is about
- predicate: the action or assertion
- object: what is being claimed about the subject
- Extract the exact claim text as it appears in the article
- confidence: how clearly stated (0.5-1.0)

Rules:
- Only extract verifiable factual claims, not opinions
- Do NOT extract vague claims ("the situation is serious")
- Maximum 8 claims per article — prioritize the most important/verifiable
- Set confidence < 0.7 for hedged or vague claims`;

const EXTRACTION_SCHEMA = {
  type: 'object',
  properties: {
    claims: {
      type: 'array',
      maxItems: 8,
      items: {
        type: 'object',
        properties: {
          text: { type: 'string', description: 'Exact claim text from article' },
          claimType: { type: 'string', enum: CLAIM_TYPES },
          subject: { type: 'string' },
          predicate: { type: 'string' },
          object: { type: 'string' },
          confidence: { type: 'number', minimum: 0.5, maximum: 1.0 },
        },
        required: ['text', 'claimType', 'subject', 'predicate', 'object', 'confidence'],
      },
    },
  },
  required: ['claims'],
};

interface RawExtractionResult {
  claims: Array<{
    text: string;
    claimType: string;
    subject: string;
    predicate: string;
    object: string;
    confidence: number;
  }>;
}

function detectHedgingFlags(text: string): string[] {
  const lower = text.toLowerCase();
  const flags: string[] = [];
  if (HEDGING_WORDS.some((w) => lower.includes(w))) flags.push('hedged_language');
  if (!text.includes('"') && !text.match(/said|announced|stated|confirmed/i)) {
    // Attributional claims without direct attribution marker
  }
  return flags;
}

export async function extractClaims(
  headline: string,
  body: string,
): Promise<ExtractedClaim[]> {
  const cleanBody = body.replace(/<[^>]+>/g, '').slice(0, 4000);
  const text = `Headline: ${headline}\n\nArticle:\n${cleanBody}`;

  const result = await callLLMWithTool<RawExtractionResult>({
    system: SYSTEM_PROMPT,
    user: text,
    toolName: 'extract_claims',
    toolDescription: 'Extract verifiable factual claims from a news article',
    schema: EXTRACTION_SCHEMA,
    maxTokens: 1500,
    temperature: 0.1,
  });

  return result.claims
    .filter((c) => CLAIM_TYPES.includes(c.claimType as ClaimType))
    .map((c) => ({
      text: c.text,
      claimType: c.claimType as ClaimType,
      subject: c.subject,
      predicate: c.predicate,
      object: c.object,
      confidence: Math.round(c.confidence * 100),
      flags: detectHedgingFlags(c.text),
    }));
}
