import 'server-only';
import { prisma } from '@/lib/db/prisma';
import type { QuestionEmbedding } from '@prisma/client';

export async function upsertQuestionEmbeddingRecord(
  questionId: string,
  model = 'text-embedding-3-small',
): Promise<QuestionEmbedding> {
  return prisma.questionEmbedding.upsert({
    where: { questionId },
    update: { model },
    create: { questionId, model },
  });
}

export async function storeQuestionEmbeddingVector(
  questionEmbeddingId: string,
  vector: number[],
): Promise<void> {
  const vectorLiteral = `[${vector.join(',')}]`;
  await prisma.$executeRawUnsafe(
    `UPDATE question_embeddings SET embedding = $1::vector WHERE id = $2`,
    vectorLiteral,
    questionEmbeddingId,
  );
}

// Cross-table: compare article embedding against question embeddings for a story chain.
// Used by question lifecycle to find questions a new article might answer.
export async function findQuestionsSemanticallySimilarToArticle(
  articleId: string,
  storyChainId: string,
  opts: { threshold?: number; topK?: number } = {},
): Promise<Array<{ questionId: string; similarity: number }>> {
  const { threshold = 0.72, topK = 3 } = opts;

  const rows = await prisma.$queryRawUnsafe<Array<{ question_id: string; similarity: number }>>(
    `
    SELECT
      qe."questionId" AS question_id,
      1 - (ae.embedding <=> qe.embedding) AS similarity
    FROM article_embeddings ae
    CROSS JOIN question_embeddings qe
    JOIN questions q ON q.id = qe."questionId"
    WHERE ae."articleId" = $1
      AND q."storyChainId" = $2
      AND q.status = 'OPEN'
      AND ae.embedding IS NOT NULL
      AND qe.embedding IS NOT NULL
    ORDER BY ae.embedding <=> qe.embedding
    LIMIT $3
    `,
    articleId,
    storyChainId,
    topK,
  );

  return rows
    .filter((r) => r.similarity >= threshold)
    .map((r) => ({ questionId: r.question_id, similarity: r.similarity }));
}

// Find semantically similar questions — used for deduplication before inserting new questions
export async function findSimilarQuestions(
  vector: number[],
  opts: { threshold?: number; topK?: number } = {},
): Promise<Array<{ questionId: string; similarity: number }>> {
  const { threshold = 0.88, topK = 5 } = opts;
  const vectorLiteral = `[${vector.join(',')}]`;

  const rows = await prisma.$queryRawUnsafe<Array<{ question_id: string; similarity: number }>>(
    `
    SELECT qe."questionId" AS question_id,
           1 - (qe.embedding <=> $1::vector) AS similarity
    FROM question_embeddings qe
    WHERE qe.embedding IS NOT NULL
    ORDER BY qe.embedding <=> $1::vector
    LIMIT $2
    `,
    vectorLiteral,
    topK,
  );

  return rows
    .filter((r) => r.similarity >= threshold)
    .map((r) => ({ questionId: r.question_id, similarity: r.similarity }));
}
