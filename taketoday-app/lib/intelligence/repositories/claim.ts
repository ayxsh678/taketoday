import 'server-only';
import { prisma } from '@/lib/db/prisma';
import { Prisma } from '@prisma/client';
import type { Claim, ClaimType, VerificationStatus } from '@prisma/client';
import type { Evidence, Contradiction } from '@/lib/intelligence/types';

export async function findClaimById(id: string): Promise<Claim | null> {
  return prisma.claim.findUnique({ where: { id } });
}

export async function findClaimsByArticle(articleId: string): Promise<Claim[]> {
  return prisma.claim.findMany({
    where: { articleId },
    orderBy: { confidence: 'desc' },
  });
}

export async function findClaimsByStatus(
  status: VerificationStatus,
  limit = 50,
): Promise<Claim[]> {
  return prisma.claim.findMany({
    where: { verificationStatus: status },
    orderBy: { createdAt: 'asc' },
    take: limit,
  });
}

export async function createClaim(data: {
  articleId: string;
  text: string;
  claimType: ClaimType;
  subject?: string;
  predicate?: string;
  object?: string;
  confidence?: number;
  flags?: string[];
}): Promise<Claim> {
  return prisma.claim.create({
    data: {
      articleId: data.articleId,
      text: data.text,
      claimType: data.claimType,
      subject: data.subject,
      predicate: data.predicate,
      object: data.object,
      confidence: data.confidence ?? 0,
      flags: data.flags ?? [],
    },
  });
}

export async function updateClaimVerification(
  claimId: string,
  result: {
    verificationStatus: VerificationStatus;
    confidence: number;
    evidence: Evidence[];
    contradictions: Contradiction[];
    primarySourceUrl?: string;
    primarySourceQuote?: string;
    flags?: string[];
    verifiedBy?: string;
  },
): Promise<Claim> {
  return prisma.claim.update({
    where: { id: claimId },
    data: {
      verificationStatus: result.verificationStatus,
      confidence: result.confidence,
      evidence: result.evidence as unknown as Prisma.InputJsonValue,
      contradictions: result.contradictions as unknown as Prisma.InputJsonValue,
      primarySourceUrl: result.primarySourceUrl,
      primarySourceQuote: result.primarySourceQuote,
      flags: result.flags ?? [],
      verifiedAt: new Date(),
      verifiedBy: result.verifiedBy ?? 'automated',
    },
  });
}

export async function countVerifiedClaimsForArticle(articleId: string): Promise<number> {
  return prisma.claim.count({ where: { articleId, verificationStatus: 'VERIFIED' } });
}
