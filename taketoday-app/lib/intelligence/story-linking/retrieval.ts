import 'server-only';
import { prisma } from '@/lib/db/prisma';
import { findSimilarArticles } from '@/lib/intelligence/repositories/embedding';
import { findArticlesByEntityOverlap } from '@/lib/intelligence/repositories/entity';
import { embedText, buildArticleEmbeddingInput } from '@/lib/ai/embeddings';

export interface CandidateArticle {
  articleId: string;
  headline: string;
  publishedAt: Date;
  categoryId: string | null;
  importanceScore: number;
  semanticScore: number;
  entityOverlapCount: number;
}

// Retrieve candidate articles for story linking via 3 signals, then merge + deduplicate
export async function retrieveLinkingCandidates(
  articleId: string,
  headline: string,
  excerpt: string | null,
  body: string | null,
  entityIds: string[],
  categoryId: string | null,
  opts: { topK?: number; dayRange?: number } = {},
): Promise<CandidateArticle[]> {
  const { topK = 50, dayRange = 90 } = opts;
  const since = new Date(Date.now() - dayRange * 86400000);

  // Generate (or re-use) embedding for semantic search
  const embeddingText = buildArticleEmbeddingInput(headline, excerpt, body);
  const vector = await embedText(embeddingText);

  // Run all three retrieval strategies in parallel
  const [semanticResults, entityOverlapResults, categoryResults] = await Promise.all([
    findSimilarArticles(vector, { topK, minSimilarity: 0.3, excludeArticleId: articleId }),
    entityIds.length >= 2
      ? findArticlesByEntityOverlap(entityIds, { minShared: 2, dayRange, excludeArticleId: articleId })
      : Promise.resolve([]),
    categoryId
      ? prisma.article.findMany({
          where: {
            id: { not: articleId },
            categoryId,
            createdAt: { gte: since },
            status: 'PUBLISHED',
          },
          select: { id: true },
          take: 20,
        })
      : Promise.resolve([]),
  ]);

  // Build score maps
  const semanticMap = new Map(semanticResults.map((r) => [r.articleId, r.similarity]));
  const entityMap = new Map(entityOverlapResults.map((r) => [r.articleId, r.sharedCount]));
  const categorySet = new Set(categoryResults.map((r) => r.id));

  // Union all candidate IDs
  const candidateIds = new Set([
    ...semanticResults.map((r) => r.articleId),
    ...entityOverlapResults.map((r) => r.articleId),
    ...categoryResults.map((r) => r.id),
  ]);

  if (candidateIds.size === 0) return [];

  // Fetch article metadata for all candidates
  const articles = await prisma.article.findMany({
    where: { id: { in: Array.from(candidateIds) } },
    select: {
      id: true,
      headline: true,
      publishedAt: true,
      categoryId: true,
      importanceScore: true,
    },
  });

  return articles.map((a) => ({
    articleId: a.id,
    headline: a.headline,
    publishedAt: a.publishedAt ?? new Date(0),
    categoryId: a.categoryId,
    importanceScore: a.importanceScore,
    semanticScore: semanticMap.get(a.id) ?? (categorySet.has(a.id) ? 0.2 : 0),
    entityOverlapCount: entityMap.get(a.id) ?? 0,
  }));
}
