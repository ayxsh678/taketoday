import type { CandidateArticle } from './retrieval';

export interface ScoredCandidate extends CandidateArticle {
  compositeScore: number;
  temporalScore: number;
  entityScore: number;
  topicScore: number;
}

const TEMPORAL_LAMBDA = 0.02; // 90-day half-life ≈ exp(-0.02 * 90) ≈ 0.16

function temporalScore(publishedAt: Date, referenceDate: Date): number {
  const daysDiff = Math.abs(referenceDate.getTime() - publishedAt.getTime()) / 86400000;
  return Math.exp(-TEMPORAL_LAMBDA * daysDiff);
}

// Entity Jaccard similarity — normalize overlap count against max possible shared
function entityScore(overlapCount: number, maxEntities = 10): number {
  return Math.min(overlapCount / maxEntities, 1.0);
}

// Category match → binary topic score (1 = same category, 0 = different)
function topicScore(candidateCategoryId: string | null, articleCategoryId: string | null): number {
  if (!candidateCategoryId || !articleCategoryId) return 0;
  return candidateCategoryId === articleCategoryId ? 1.0 : 0;
}

// Composite score weights from architecture doc
const WEIGHTS = {
  semantic: 0.35,
  entity: 0.25,
  temporal: 0.20,
  topic: 0.20,
};

export function scoreCandidate(
  candidate: CandidateArticle,
  articlePublishedAt: Date,
  articleCategoryId: string | null,
): ScoredCandidate {
  const t = temporalScore(candidate.publishedAt, articlePublishedAt);
  const e = entityScore(candidate.entityOverlapCount);
  const s = candidate.semanticScore;
  const tp = topicScore(candidate.categoryId, articleCategoryId);

  const compositeScore =
    WEIGHTS.semantic * s +
    WEIGHTS.entity * e +
    WEIGHTS.temporal * t +
    WEIGHTS.topic * tp;

  return {
    ...candidate,
    compositeScore,
    temporalScore: t,
    entityScore: e,
    topicScore: tp,
  };
}

export function rankAndFilter(
  candidates: CandidateArticle[],
  articlePublishedAt: Date,
  articleCategoryId: string | null,
  opts: { minScore?: number; topK?: number } = {},
): ScoredCandidate[] {
  const { minScore = 0.4, topK = 15 } = opts;

  return candidates
    .map((c) => scoreCandidate(c, articlePublishedAt, articleCategoryId))
    .filter((c) => c.compositeScore >= minScore)
    .sort((a, b) => b.compositeScore - a.compositeScore)
    .slice(0, topK);
}
