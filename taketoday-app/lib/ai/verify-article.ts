import { callWithRouter } from './router';
import { inferRiskFromText } from './riskScorer';
import type { RiskLevel } from './providers/types';

export type ClaimStatus = 'verified' | 'unverified' | 'disputed' | 'needs_review';

export interface VerifiedClaim {
  text: string;
  status: ClaimStatus;
  notes: string;
}

export interface VerificationResult {
  claims: VerifiedClaim[];
  score: number;
  brief: string;
  missingInfo: string[];
}

const SYSTEM_PROMPT = `You are a senior fact-checking editor at a news organisation. Your job is to analyse a news article and assess the factual claims it contains.

For each key factual claim (max 8), assess whether it is:
- "verified": commonly accepted fact, easily corroborated
- "likely_verified": plausible and consistent with known facts, but sourcing unclear
- "needs_review": specific statistic, quote, or date that requires primary source confirmation
- "unverified": no basis to confirm; missing context
- "disputed": contradicts known facts or is contested by credible sources

Return ONLY valid JSON in this exact shape:
{
  "claims": [
    { "text": "...", "status": "verified|likely_verified|needs_review|unverified|disputed", "notes": "one sentence reason" }
  ],
  "score": <integer 0-100>,
  "brief": "<2-3 sentence editorial summary of the article's overall factual reliability>",
  "missingInfo": ["<specific thing that should be verified before publication>"]
}

Score guide: 85-100 publish-ready, 65-84 minor checks needed, 40-64 significant gaps, below 40 major issues.`;

export async function verifyArticle(
  headline: string,
  body: string,
  opts?: { category?: string; risk?: RiskLevel; articleId?: string },
): Promise<VerificationResult> {
  const plainBody = body.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  const risk = opts?.risk ?? inferRiskFromText(`${headline} ${plainBody}`, opts?.category);

  const result = await callWithRouter({
    task: 'verification',
    category: opts?.category,
    risk,
    articleId: opts?.articleId,
    input: {
      system: SYSTEM_PROMPT,
      user: `Headline: ${headline}\n\nArticle body:\n${plainBody.slice(0, 4000)}`,
      temperature: 0.2,
      maxTokens: 1200,
    },
  });

  let parsed: VerificationResult;
  try {
    parsed = (result.parsed ?? JSON.parse(result.text)) as VerificationResult;
  } catch {
    throw new Error('AI returned malformed JSON');
  }

  if (!Array.isArray(parsed.claims)) parsed.claims = [];
  if (typeof parsed.score !== 'number') parsed.score = 0;
  if (typeof parsed.brief !== 'string') parsed.brief = '';
  if (!Array.isArray(parsed.missingInfo)) parsed.missingInfo = [];

  parsed.score = Math.max(0, Math.min(100, Math.round(parsed.score)));

  return parsed;
}
