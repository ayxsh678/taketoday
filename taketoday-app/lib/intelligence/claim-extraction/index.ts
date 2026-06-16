import 'server-only';
import { extractClaims } from './extractor';
import { createClaim } from '@/lib/intelligence/repositories/claim';
import type { Claim } from '@prisma/client';

export interface ClaimExtractionResult {
  articleId: string;
  claims: Claim[];
}

export async function extractAndStoreClaims(
  articleId: string,
  headline: string,
  body: string,
): Promise<ClaimExtractionResult> {
  const extracted = await extractClaims(headline, body);
  const claims: Claim[] = [];

  for (const c of extracted) {
    const claim = await createClaim({
      articleId,
      text: c.text,
      claimType: c.claimType,
      subject: c.subject,
      predicate: c.predicate,
      object: c.object,
      confidence: c.confidence,
      flags: c.flags,
    });
    claims.push(claim);
  }

  return { articleId, claims };
}
