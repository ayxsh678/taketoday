import 'server-only';
import { prisma } from '@/lib/db/prisma';
import { Prisma } from '@prisma/client';
import type { StoryLink, StoryRelationshipType } from '@prisma/client';

export type StoryLinkWithArticles = StoryLink & {
  sourceArticle: { id: string; headline: string; publishedAt: Date | null };
  targetArticle: { id: string; headline: string; publishedAt: Date | null };
};

export async function createStoryLink(data: {
  sourceArticleId: string;
  targetArticleId: string;
  relationshipType: StoryRelationshipType;
  confidence: number;
  sharedEntityIds?: string[];
  sharedTopics?: string[];
  temporalDistanceDays?: number;
  causalExplanation?: string;
  evidenceSnippets?: Array<{ fromSource: string; fromTarget: string }>;
}): Promise<StoryLink> {
  return prisma.storyLink.create({
    data: {
      sourceArticleId: data.sourceArticleId,
      targetArticleId: data.targetArticleId,
      relationshipType: data.relationshipType,
      confidence: data.confidence,
      sharedEntityIds: data.sharedEntityIds ?? [],
      sharedTopics: data.sharedTopics ?? [],
      temporalDistanceDays: data.temporalDistanceDays,
      causalExplanation: data.causalExplanation,
      evidenceSnippets: (data.evidenceSnippets ?? []) as unknown as Prisma.InputJsonValue,
    },
  });
}

export async function findStoryLinksForArticle(
  articleId: string,
  minConfidence = 0.6,
): Promise<StoryLinkWithArticles[]> {
  return prisma.storyLink.findMany({
    where: {
      OR: [{ sourceArticleId: articleId }, { targetArticleId: articleId }],
      confidence: { gte: minConfidence },
    },
    include: {
      sourceArticle: { select: { id: true, headline: true, publishedAt: true } },
      targetArticle: { select: { id: true, headline: true, publishedAt: true } },
    },
    orderBy: { confidence: 'desc' },
  });
}

export async function findContradictions(articleId: string): Promise<StoryLink[]> {
  return prisma.storyLink.findMany({
    where: {
      OR: [{ sourceArticleId: articleId }, { targetArticleId: articleId }],
      relationshipType: { in: ['CONTRADICTION', 'REFUTATION'] },
    },
    orderBy: { confidence: 'desc' },
  });
}

export async function countLinksForArticle(articleId: string): Promise<number> {
  return prisma.storyLink.count({
    where: { OR: [{ sourceArticleId: articleId }, { targetArticleId: articleId }] },
  });
}
