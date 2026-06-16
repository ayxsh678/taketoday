import 'server-only';
import { prisma } from '@/lib/db/prisma';
import type { Question, QuestionType, QuestionStatus, QuestionPriority, Prisma } from '@prisma/client';

export type QuestionWithArticles = Question & {
  articleQuestions: { articleId: string }[];
  answerArticle: { id: string; headline: string } | null;
};

export async function findQuestionById(id: string): Promise<Question | null> {
  return prisma.question.findUnique({ where: { id } });
}

export async function listQuestions(opts: {
  type?: QuestionType;
  status?: QuestionStatus;
  storyChainId?: string;
  limit?: number;
  offset?: number;
}): Promise<QuestionWithArticles[]> {
  const { type, status, storyChainId, limit = 20, offset = 0 } = opts;
  return prisma.question.findMany({
    where: {
      ...(type ? { questionType: type } : {}),
      ...(status ? { status } : {}),
      ...(storyChainId ? { storyChainId } : {}),
    },
    orderBy: [{ importanceScore: 'desc' }, { createdAt: 'desc' }],
    take: limit,
    skip: offset,
    include: {
      articleQuestions: { select: { articleId: true } },
      answerArticle: { select: { id: true, headline: true } },
    },
  });
}

export async function findOpenQuestionsForStoryChain(storyChainId: string): Promise<Question[]> {
  return prisma.question.findMany({
    where: { storyChainId, status: 'OPEN' },
    orderBy: [{ priority: 'asc' }, { importanceScore: 'desc' }],
  });
}

export async function createQuestion(data: {
  text: string;
  questionType: QuestionType;
  priority?: QuestionPriority;
  verificationRequired?: boolean;
  relatedEntityIds?: string[];
  storyChainId?: string;
  articleId: string;
}): Promise<Question> {
  return prisma.question.create({
    data: {
      text: data.text,
      questionType: data.questionType,
      priority: data.priority ?? 'MEDIUM',
      verificationRequired: data.verificationRequired ?? false,
      relatedEntityIds: data.relatedEntityIds ?? [],
      storyChainId: data.storyChainId,
      articleQuestions: { create: { articleId: data.articleId } },
    },
  });
}

// Link an existing question to an additional article (semantic duplicate merge path)
export async function linkQuestionToArticle(questionId: string, articleId: string): Promise<void> {
  await prisma.$transaction([
    prisma.articleQuestion.upsert({
      where: { articleId_questionId: { articleId, questionId } },
      update: {},
      create: { articleId, questionId },
    }),
    prisma.question.update({
      where: { id: questionId },
      data: { raisedCount: { increment: 1 }, importanceScore: { increment: 15 } },
    }),
  ]);
}

export async function resolveQuestion(
  questionId: string,
  answer: string,
  answerArticleId: string,
): Promise<Question> {
  return prisma.question.update({
    where: { id: questionId },
    data: {
      status: 'ANSWERED',
      answer,
      answerArticleId,
      resolvedAt: new Date(),
    },
  });
}

export async function updateQuestionStatus(
  questionId: string,
  status: QuestionStatus,
): Promise<Question> {
  return prisma.question.update({ where: { id: questionId }, data: { status } });
}
