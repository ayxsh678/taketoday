/*
  Warnings:

  - You are about to drop the column `embedding` on the `ContributionEmbedding` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "contribution_embedding_hnsw_idx";

-- AlterTable
ALTER TABLE "ContributionEmbedding" DROP COLUMN "embedding";

-- CreateTable
CREATE TABLE "CarouselJob" (
    "id" TEXT NOT NULL,
    "articleId" TEXT,
    "format" TEXT NOT NULL,
    "slideCount" INTEGER NOT NULL,
    "sourceContent" TEXT NOT NULL,
    "result" JSONB NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'SUCCEEDED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CarouselJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CarouselJob_createdAt_idx" ON "CarouselJob"("createdAt");

-- CreateIndex
CREATE INDEX "CarouselJob_articleId_idx" ON "CarouselJob"("articleId");

-- AddForeignKey
ALTER TABLE "CarouselJob" ADD CONSTRAINT "CarouselJob_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE SET NULL ON UPDATE CASCADE;
