-- CreateEnum
CREATE TYPE "EntityType" AS ENUM ('PERSON', 'ORGANIZATION', 'COMPANY', 'COUNTRY', 'CITY', 'PRODUCT', 'TECHNOLOGY', 'EVENT', 'LEGISLATION', 'FINANCIAL_INSTRUMENT', 'CONCEPT');

-- CreateEnum
CREATE TYPE "StoryRelationshipType" AS ENUM ('CAUSED_BY', 'FOLLOW_UP', 'CONTRADICTION', 'CONFIRMATION', 'ESCALATION', 'BACKGROUND', 'EFFECT_OF', 'PARALLEL', 'REFUTATION');

-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM ('ANSWERED', 'OPEN', 'HISTORICAL', 'FUTURE');

-- CreateEnum
CREATE TYPE "QuestionPriority" AS ENUM ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW');

-- CreateEnum
CREATE TYPE "QuestionStatus" AS ENUM ('OPEN', 'ANSWERED', 'PARTIALLY_ANSWERED', 'UNANSWERABLE');

-- CreateEnum
CREATE TYPE "ClaimType" AS ENUM ('QUANTITATIVE', 'CAUSAL', 'ATTRIBUTIONAL', 'PREDICTIVE', 'HISTORICAL', 'COMPARATIVE');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('VERIFIED', 'PARTIALLY_VERIFIED', 'DISPUTED', 'UNVERIFIED', 'FALSE_CLAIM', 'MISLEADING');

-- CreateEnum
CREATE TYPE "PredictionType" AS ENUM ('NEXT_EVENT', 'EMERGING_RISK', 'ENTITY_ACTION', 'MARKET_MOVE', 'REGULATORY_ACTION', 'ESCALATION');

-- CreateEnum
CREATE TYPE "PredictionStatus" AS ENUM ('ACTIVE', 'RESOLVED', 'EXPIRED', 'CANCELLED');

-- AlterTable
ALTER TABLE "Article" ADD COLUMN     "contentHash" TEXT,
ADD COLUMN     "importanceScore" INTEGER NOT NULL DEFAULT 50,
ADD COLUMN     "newsSourceId" TEXT,
ADD COLUMN     "storyChainId" TEXT;

-- CreateTable
CREATE TABLE "news_sources" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "credibilityScore" INTEGER NOT NULL DEFAULT 50,
    "biasRating" TEXT,
    "sourceType" TEXT NOT NULL DEFAULT 'unknown',
    "country" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "news_sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "entities" (
    "id" TEXT NOT NULL,
    "canonicalName" TEXT NOT NULL,
    "entityType" "EntityType" NOT NULL,
    "wikidataId" TEXT,
    "aliases" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "description" TEXT,
    "importanceScore" INTEGER NOT NULL DEFAULT 50,
    "mentionCount" INTEGER NOT NULL DEFAULT 0,
    "lastMentioned" TIMESTAMP(3),
    "attributes" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "entities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "entity_mentions" (
    "id" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "surfaceForm" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "isFocal" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "entity_mentions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "story_chains" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "livingNarrative" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "importanceScore" INTEGER NOT NULL DEFAULT 50,
    "totalArticles" INTEGER NOT NULL DEFAULT 0,
    "totalQuestions" INTEGER NOT NULL DEFAULT 0,
    "unresolvedThreads" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "centralEntityIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "story_chains_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "story_links" (
    "id" TEXT NOT NULL,
    "sourceArticleId" TEXT NOT NULL,
    "targetArticleId" TEXT NOT NULL,
    "relationshipType" "StoryRelationshipType" NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "sharedEntityIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "sharedTopics" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "temporalDistanceDays" INTEGER,
    "causalExplanation" TEXT,
    "evidenceSnippets" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "story_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "questions" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "questionType" "QuestionType" NOT NULL,
    "priority" "QuestionPriority" NOT NULL DEFAULT 'MEDIUM',
    "status" "QuestionStatus" NOT NULL DEFAULT 'OPEN',
    "answer" TEXT,
    "answerArticleId" TEXT,
    "importanceScore" INTEGER NOT NULL DEFAULT 50,
    "raisedCount" INTEGER NOT NULL DEFAULT 1,
    "verificationRequired" BOOLEAN NOT NULL DEFAULT false,
    "relatedEntityIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "storyChainId" TEXT,
    "investigationNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "article_questions" (
    "articleId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,

    CONSTRAINT "article_questions_pkey" PRIMARY KEY ("articleId","questionId")
);

-- CreateTable
CREATE TABLE "claims" (
    "id" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "claimType" "ClaimType" NOT NULL,
    "subject" TEXT,
    "predicate" TEXT,
    "object" TEXT,
    "confidence" INTEGER NOT NULL DEFAULT 0,
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "primarySourceUrl" TEXT,
    "primarySourceQuote" TEXT,
    "evidence" JSONB NOT NULL DEFAULT '[]',
    "contradictions" JSONB NOT NULL DEFAULT '[]',
    "flags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "verifiedAt" TIMESTAMP(3),
    "verifiedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "claims_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "predictions" (
    "id" TEXT NOT NULL,
    "storyChainId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "predictionType" "PredictionType" NOT NULL,
    "confidence" INTEGER NOT NULL DEFAULT 50,
    "timeframe" TEXT,
    "targetDate" TIMESTAMP(3),
    "entityIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "signals" JSONB NOT NULL DEFAULT '[]',
    "basis" TEXT,
    "historicalPatterns" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" "PredictionStatus" NOT NULL DEFAULT 'ACTIVE',
    "resolvedAt" TIMESTAMP(3),
    "outcome" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "predictions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "research_dossiers" (
    "id" TEXT NOT NULL,
    "storyChainId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "executiveSummary" TEXT,
    "keyFindings" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "timeline" JSONB NOT NULL DEFAULT '[]',
    "openQuestions" JSONB NOT NULL DEFAULT '[]',
    "sourcesConsulted" JSONB NOT NULL DEFAULT '[]',
    "watchList" JSONB NOT NULL DEFAULT '[]',
    "riskFactors" JSONB NOT NULL DEFAULT '[]',
    "importanceScore" INTEGER NOT NULL DEFAULT 50,
    "confidenceScore" INTEGER NOT NULL DEFAULT 50,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUpdatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "research_dossiers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "article_embeddings" (
    "id" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "model" TEXT NOT NULL DEFAULT 'text-embedding-3-small',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "article_embeddings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "news_sources_domain_key" ON "news_sources"("domain");

-- CreateIndex
CREATE INDEX "entities_entityType_idx" ON "entities"("entityType");

-- CreateIndex
CREATE UNIQUE INDEX "entities_canonicalName_entityType_key" ON "entities"("canonicalName", "entityType");

-- CreateIndex
CREATE INDEX "entity_mentions_articleId_idx" ON "entity_mentions"("articleId");

-- CreateIndex
CREATE INDEX "entity_mentions_entityId_idx" ON "entity_mentions"("entityId");

-- CreateIndex
CREATE UNIQUE INDEX "story_chains_slug_key" ON "story_chains"("slug");

-- CreateIndex
CREATE INDEX "story_chains_isActive_importanceScore_idx" ON "story_chains"("isActive", "importanceScore");

-- CreateIndex
CREATE INDEX "story_links_sourceArticleId_idx" ON "story_links"("sourceArticleId");

-- CreateIndex
CREATE INDEX "story_links_targetArticleId_idx" ON "story_links"("targetArticleId");

-- CreateIndex
CREATE INDEX "questions_questionType_status_idx" ON "questions"("questionType", "status");

-- CreateIndex
CREATE INDEX "questions_storyChainId_idx" ON "questions"("storyChainId");

-- CreateIndex
CREATE INDEX "article_questions_questionId_idx" ON "article_questions"("questionId");

-- CreateIndex
CREATE INDEX "claims_articleId_idx" ON "claims"("articleId");

-- CreateIndex
CREATE INDEX "claims_verificationStatus_idx" ON "claims"("verificationStatus");

-- CreateIndex
CREATE INDEX "predictions_storyChainId_idx" ON "predictions"("storyChainId");

-- CreateIndex
CREATE INDEX "predictions_status_idx" ON "predictions"("status");

-- CreateIndex
CREATE INDEX "research_dossiers_storyChainId_idx" ON "research_dossiers"("storyChainId");

-- CreateIndex
CREATE UNIQUE INDEX "article_embeddings_articleId_key" ON "article_embeddings"("articleId");

-- CreateIndex
CREATE INDEX "Article_storyChainId_idx" ON "Article"("storyChainId");

-- CreateIndex
CREATE INDEX "Article_importanceScore_idx" ON "Article"("importanceScore");

-- AddForeignKey
ALTER TABLE "Article" ADD CONSTRAINT "Article_newsSourceId_fkey" FOREIGN KEY ("newsSourceId") REFERENCES "news_sources"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Article" ADD CONSTRAINT "Article_storyChainId_fkey" FOREIGN KEY ("storyChainId") REFERENCES "story_chains"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entity_mentions" ADD CONSTRAINT "entity_mentions_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entity_mentions" ADD CONSTRAINT "entity_mentions_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "entities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "story_links" ADD CONSTRAINT "story_links_sourceArticleId_fkey" FOREIGN KEY ("sourceArticleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "story_links" ADD CONSTRAINT "story_links_targetArticleId_fkey" FOREIGN KEY ("targetArticleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_storyChainId_fkey" FOREIGN KEY ("storyChainId") REFERENCES "story_chains"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_answerArticleId_fkey" FOREIGN KEY ("answerArticleId") REFERENCES "Article"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "article_questions" ADD CONSTRAINT "article_questions_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "article_questions" ADD CONSTRAINT "article_questions_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "claims" ADD CONSTRAINT "claims_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "predictions" ADD CONSTRAINT "predictions_storyChainId_fkey" FOREIGN KEY ("storyChainId") REFERENCES "story_chains"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "research_dossiers" ADD CONSTRAINT "research_dossiers_storyChainId_fkey" FOREIGN KEY ("storyChainId") REFERENCES "story_chains"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "article_embeddings" ADD CONSTRAINT "article_embeddings_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;
