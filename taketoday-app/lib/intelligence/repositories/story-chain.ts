import 'server-only';
import { prisma } from '@/lib/db/prisma';
import type { StoryChain, Prisma } from '@prisma/client';

export type StoryChainWithCounts = StoryChain & {
  _count: { articles: number; questions: number; predictions: number };
};

export async function findStoryChainById(id: string): Promise<StoryChain | null> {
  return prisma.storyChain.findUnique({ where: { id } });
}

export async function findStoryChainBySlug(slug: string): Promise<StoryChain | null> {
  return prisma.storyChain.findUnique({ where: { slug } });
}

export async function listActiveStoryChains(limit = 20, offset = 0): Promise<StoryChainWithCounts[]> {
  return prisma.storyChain.findMany({
    where: { isActive: true },
    orderBy: { importanceScore: 'desc' },
    take: limit,
    skip: offset,
    include: { _count: { select: { articles: true, questions: true, predictions: true } } },
  });
}

export async function findStoryChainsByEntityIds(entityIds: string[]): Promise<StoryChain[]> {
  return prisma.storyChain.findMany({
    where: {
      isActive: true,
      centralEntityIds: { hasSome: entityIds },
    },
    orderBy: { importanceScore: 'desc' },
    take: 10,
  });
}

export async function createStoryChain(data: Prisma.StoryChainCreateInput): Promise<StoryChain> {
  return prisma.storyChain.create({ data });
}

export async function updateStoryChain(
  id: string,
  data: Prisma.StoryChainUpdateInput,
): Promise<StoryChain> {
  return prisma.storyChain.update({ where: { id }, data });
}

export async function updateStoryChainNarrative(
  id: string,
  livingNarrative: string,
  unresolvedThreads: string[],
): Promise<StoryChain> {
  return prisma.storyChain.update({
    where: { id },
    data: { livingNarrative, unresolvedThreads, lastUpdated: new Date() },
  });
}

export async function incrementStoryChainArticleCount(id: string): Promise<void> {
  await prisma.storyChain.update({
    where: { id },
    data: { totalArticles: { increment: 1 }, lastUpdated: new Date() },
  });
}

export async function incrementStoryChainQuestionCount(id: string, by = 1): Promise<void> {
  await prisma.storyChain.update({
    where: { id },
    data: { totalQuestions: { increment: by }, lastUpdated: new Date() },
  });
}
