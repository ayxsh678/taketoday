import 'server-only';
import { verifyClaim } from './verifier';
import { findClaimsByArticle } from '@/lib/intelligence/repositories/claim';
import type { Claim, ClaimType } from '@prisma/client';

// Only auto-verify high-value claim types — others stay UNVERIFIED until on-demand
const AUTO_VERIFY_TYPES: ClaimType[] = ['QUANTITATIVE', 'CAUSAL'];
const MAX_AUTO_VERIFY = 5; // cap web search calls per article

export interface VerificationResult {
  articleId: string;
  verified: number;
  skipped: number;
  errors: string[];
}

// Verify the highest-priority claims for an article
// Lower-priority claims remain UNVERIFIED and can be verified on-demand via API
export async function verifyClaims(articleId: string): Promise<VerificationResult> {
  const allClaims = await findClaimsByArticle(articleId);
  const errors: string[] = [];

  // Prioritize: auto-verify types first, then by confidence desc
  const toVerify = allClaims
    .filter((c): c is Claim => AUTO_VERIFY_TYPES.includes(c.claimType))
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, MAX_AUTO_VERIFY);

  const skipped = allClaims.length - toVerify.length;

  // Verify sequentially to respect Serper rate limits
  let verified = 0;
  for (const claim of toVerify) {
    try {
      await verifyClaim(claim);
      verified++;
      // Small delay between Serper calls
      await new Promise((resolve) => setTimeout(resolve, 300));
    } catch (err) {
      errors.push(`claim ${claim.id}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return { articleId, verified, skipped, errors };
}
