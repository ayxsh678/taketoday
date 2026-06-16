/*
  Warnings:

  - You are about to drop the column `embedding` on the `article_embeddings` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "article_embeddings_hnsw_idx";

-- AlterTable
ALTER TABLE "article_embeddings" DROP COLUMN "embedding";

-- CreateTable
CREATE TABLE "question_embeddings" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "model" TEXT NOT NULL DEFAULT 'text-embedding-3-small',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "question_embeddings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "question_embeddings_questionId_key" ON "question_embeddings"("questionId");

-- AddForeignKey
ALTER TABLE "question_embeddings" ADD CONSTRAINT "question_embeddings_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add vector embedding column and HNSW index
ALTER TABLE "question_embeddings"
  ADD COLUMN IF NOT EXISTS embedding vector(1536);

CREATE INDEX IF NOT EXISTS question_embeddings_hnsw_idx
  ON "question_embeddings"
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);
