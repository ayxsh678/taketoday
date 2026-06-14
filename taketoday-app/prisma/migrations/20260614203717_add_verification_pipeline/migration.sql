-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ArticleStatus" ADD VALUE 'FACT_CHECKING';
ALTER TYPE "ArticleStatus" ADD VALUE 'EDITORIAL_REVIEW';
ALTER TYPE "ArticleStatus" ADD VALUE 'READY_TO_PUBLISH';

-- CreateTable
CREATE TABLE "ArticleVerification" (
    "id" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "aiBrief" TEXT,
    "aiClaims" JSONB,
    "aiScore" INTEGER,
    "aiGeneratedAt" TIMESTAMP(3),
    "aiModel" TEXT,
    "reviewerId" TEXT,
    "reviewerNotes" TEXT,
    "checklist" JSONB,
    "decision" TEXT,
    "decidedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ArticleVerification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArticleSource" (
    "id" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "url" TEXT,
    "title" TEXT,
    "domain" TEXT,
    "note" TEXT,
    "addedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ArticleSource_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ArticleVerification_articleId_key" ON "ArticleVerification"("articleId");

-- CreateIndex
CREATE INDEX "ArticleSource_articleId_idx" ON "ArticleSource"("articleId");

-- AddForeignKey
ALTER TABLE "ArticleVerification" ADD CONSTRAINT "ArticleVerification_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArticleSource" ADD CONSTRAINT "ArticleSource_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;
