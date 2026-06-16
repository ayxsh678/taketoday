import 'server-only';
import { prisma } from '@/lib/db/prisma';
import { generateQuestions } from './generator';
import { deduplicateAndStoreQuestions } from './deduplicator';
import { findEntityMentionsByArticle } from '@/lib/intelligence/repositories/entity';
import { incrementStoryChainQuestionCount } from '@/lib/intelligence/repositories/story-chain';

export interface QuestionGenerationResult {
  articleId: string;
  questionIds: string[];
  newCount: number;
  mergedCount: number;
}

// Generate all 4 question categories for an article, deduplicate, and persist
export async function generateAndStoreQuestions(
  articleId: string,
  storyChainId?: string,
): Promise<QuestionGenerationResult> {
  const article = await prisma.article.findUnique({
    where: { id: articleId },
    select: {
      id: true,
      headline: true,
      body: true,
      excerpt: true,
      storyChainId: true,
    },
  });
  if (!article) return { articleId, questionIds: [], newCount: 0, mergedCount: 0 };

  const chainId = storyChainId ?? article.storyChainId ?? undefined;

  // Get entity names for richer question generation
  const mentions = await findEntityMentionsByArticle(articleId);
  const focalEntityNames = mentions
    .filter((m) => m.isFocal)
    .map((m) => m.entity.canonicalName);

  // Get related article headlines as context (from story links)
  const linkedArticles = await prisma.storyLink.findMany({
    where: { sourceArticleId: articleId },
    include: { targetArticle: { select: { headline: true, excerpt: true } } },
    take: 3,
    orderBy: { confidence: 'desc' },
  });
  const relatedSummaries = linkedArticles.map(
    (l) => l.targetArticle.headline + (l.targetArticle.excerpt ? ` — ${l.targetArticle.excerpt}` : ''),
  );

  // Generate from LLM
  const questionSet = await generateQuestions(
    article.headline,
    article.body,
    article.excerpt,
    relatedSummaries,
    focalEntityNames,
  );

  const entityIds = mentions.map((m) => m.entityId);
  const deduplicatorOpts = { storyChainId: chainId, relatedEntityIds: entityIds };

  // Process all 4 categories — sequential within category, parallel across
  const [answeredIds, openIds, historicalIds, futureIds] = await Promise.all([
    deduplicateAndStoreQuestions(questionSet.answered, 'ANSWERED', articleId, deduplicatorOpts),
    deduplicateAndStoreQuestions(questionSet.open, 'OPEN', articleId, deduplicatorOpts),
    deduplicateAndStoreQuestions(questionSet.historical, 'HISTORICAL', articleId, deduplicatorOpts),
    deduplicateAndStoreQuestions(questionSet.future, 'FUTURE', articleId, deduplicatorOpts),
  ]);

  const allIds = [...answeredIds, ...openIds, ...historicalIds, ...futureIds];

  // Update story chain question count
  if (chainId && allIds.length > 0) {
    await incrementStoryChainQuestionCount(chainId, allIds.length);
  }

  return {
    articleId,
    questionIds: allIds,
    newCount: allIds.length, // simplified — would need to track merge vs create
    mergedCount: 0,
  };
}
