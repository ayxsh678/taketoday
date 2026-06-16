import 'server-only';
import { findCorroboratingSources, findContradictingSources } from './searcher';
import {
  getSourceTier,
  calculateConfidence,
  confidenceToStatus,
  type ConfidenceInputs,
} from './credibility';
import { updateClaimVerification } from '@/lib/intelligence/repositories/claim';
import type { Evidence, Contradiction } from '@/lib/intelligence/types';
import type { Claim } from '@prisma/client';

const HEDGING_TERMS = ['allegedly', 'reportedly', 'according to sources', 'may', 'might', 'could', 'unconfirmed'];

function detectHedging(text: string): boolean {
  const lower = text.toLowerCase();
  return HEDGING_TERMS.some((t) => lower.includes(t));
}

// Verify a single claim against web sources
export async function verifyClaim(claim: Claim): Promise<Claim> {
  const [corroborating, contradicting] = await Promise.all([
    findCorroboratingSources(claim.text),
    claim.subject ? findContradictingSources(claim.text, claim.subject) : Promise.resolve([]),
  ]);

  // Score each corroborating source
  const evidence: Evidence[] = corroborating.map((r) => {
    const tier = getSourceTier(r.url);
    return {
      sourceUrl: r.url,
      sourceCredibility: Math.round(tier.weight * 100),
      snippet: r.snippet.slice(0, 300),
      supportType: 'confirms' as const,
      publishedAt: r.publishedDate ? new Date(r.publishedDate) : undefined,
    };
  });

  // Score each contradicting source
  const contradictions: Contradiction[] = contradicting.map((r) => {
    const tier = getSourceTier(r.url);
    return {
      sourceUrl: r.url,
      sourceCredibility: Math.round(tier.weight * 100),
      snippet: r.snippet.slice(0, 300),
      contradictionType: 'partial' as const,
      publishedAt: r.publishedDate ? new Date(r.publishedDate) : undefined,
    };
  });

  // Find primary source (highest-tier corroborating source)
  const primarySource = evidence.reduce(
    (best, e) => (e.sourceCredibility > (best?.sourceCredibility ?? 0) ? e : best),
    null as Evidence | null,
  );

  const primarySourceWeight = primarySource
    ? getSourceTier(primarySource.sourceUrl).weight
    : 0;

  const maxContradictionStrength =
    contradictions.length > 0
      ? Math.max(...contradictions.map((c) => c.sourceCredibility / 100))
      : 0;

  const inputs: ConfidenceInputs = {
    primarySourceWeight,
    corroboratingSourceWeights: evidence.map((e) => e.sourceCredibility / 100),
    isHedged: detectHedging(claim.text) || (claim.flags ?? []).includes('hedged_language'),
    contradictionStrength: maxContradictionStrength,
    contradictionCount: contradictions.length,
  };

  const confidence = calculateConfidence(inputs);
  const status = confidenceToStatus(confidence, contradictions.length);

  return updateClaimVerification(claim.id, {
    verificationStatus: status,
    confidence,
    evidence,
    contradictions,
    primarySourceUrl: primarySource?.sourceUrl,
    verifiedBy: 'automated',
    flags: claim.flags,
  });
}
