import 'server-only';
import { prisma } from '@/lib/db/prisma';
import type { ArticleEmbedding } from '@prisma/client';
import type { SemanticSearchResult } from '@/lib/intelligence/types';

export async function findEmbeddingByArticleId(articleId: string): Promise<ArticleEmbedding | null> {
  return prisma.articleEmbedding.findUnique({ where: { articleId } });
}

// Store article embedding metadata — the actual vector is stored via raw SQL
export async function upsertArticleEmbeddingRecord(
  articleId: string,
  model = 'text-embedding-3-small',
): Promise<ArticleEmbedding> {
  return prisma.articleEmbedding.upsert({
    where: { articleId },
    update: { model },
    create: { articleId, model },
  });
}

// Store the embedding vector directly via raw SQL (pgvector column)
export async function storeEmbeddingVector(
  articleEmbeddingId: string,
  vector: number[],
): Promise<void> {
  const vectorLiteral = `[${vector.join(',')}]`;
  await prisma.$executeRawUnsafe(
    `UPDATE article_embeddings SET embedding = $1::vector WHERE id = $2`,
    vectorLiteral,
    articleEmbeddingId,
  );
}

// Find semantically similar articles using cosine similarity
export async function findSimilarArticles(
  vector: number[],
  opts: { topK?: number; minSimilarity?: number; excludeArticleId?: string } = {},
): Promise<SemanticSearchResult[]> {
  const { topK = 20, minSimilarity = 0.4, excludeArticleId } = opts;
  const vectorLiteral = `[${vector.join(',')}]`;

  const rows = await prisma.$queryRawUnsafe<Array<{ article_id: string; similarity: number }>>(
    `
    SELECT ae."articleId" AS article_id,
           1 - (ae.embedding <=> $1::vector) AS similarity
    FROM article_embeddings ae
    WHERE ae.embedding IS NOT NULL
      ${excludeArticleId ? `AND ae."articleId" != '${excludeArticleId}'` : ''}
    ORDER BY ae.embedding <=> $1::vector
    LIMIT $2
    `,
    vectorLiteral,
    topK,
  );

  return rows
    .filter((r) => r.similarity >= minSimilarity)
    .map((r) => ({ articleId: r.article_id, similarity: r.similarity }));
}

// Check if an article already has an embedding stored
export async function articleHasEmbedding(articleId: string): Promise<boolean> {
  const result = await prisma.$queryRawUnsafe<Array<{ has_embedding: boolean }>>(
    `
    SELECT (ae.embedding IS NOT NULL) AS has_embedding
    FROM article_embeddings ae
    WHERE ae."articleId" = $1
    LIMIT 1
    `,
    articleId,
  );
  return result[0]?.has_embedding ?? false;
}
