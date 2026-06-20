-- MVP Simplification Migration
-- Removes all AI/intelligence/community/studio tables and simplifies ArticleStatus enum

-- ─── Drop intelligence layer tables (cascade handles FK constraints) ───────────

DROP TABLE IF EXISTS "question_embeddings" CASCADE;
DROP TABLE IF EXISTS "article_questions" CASCADE;
DROP TABLE IF EXISTS "article_embeddings" CASCADE;
DROP TABLE IF EXISTS "story_links" CASCADE;
DROP TABLE IF EXISTS "entity_mentions" CASCADE;
DROP TABLE IF EXISTS "research_dossiers" CASCADE;
DROP TABLE IF EXISTS "predictions" CASCADE;
DROP TABLE IF EXISTS "claims" CASCADE;
DROP TABLE IF EXISTS "questions" CASCADE;
DROP TABLE IF EXISTS "story_chains" CASCADE;
DROP TABLE IF EXISTS "entities" CASCADE;
DROP TABLE IF EXISTS "news_sources" CASCADE;
DROP TABLE IF EXISTS "ai_usage" CASCADE;
DROP TABLE IF EXISTS "ArticleVerification" CASCADE;

-- ─── Drop studio tables ────────────────────────────────────────────────────────

DROP TABLE IF EXISTS "scheduled_posts" CASCADE;
DROP TABLE IF EXISTS "content_drafts" CASCADE;

-- ─── Drop community tables ─────────────────────────────────────────────────────

DROP TABLE IF EXISTS "tip_comments" CASCADE;
DROP TABLE IF EXISTS "investigations" CASCADE;
DROP TABLE IF EXISTS "story_tips" CASCADE;
DROP TABLE IF EXISTS "mission_submissions" CASCADE;
DROP TABLE IF EXISTS "missions" CASCADE;
DROP TABLE IF EXISTS "contributor_points" CASCADE;

-- ─── Remove intelligence columns from Article ──────────────────────────────────

ALTER TABLE "Article" DROP COLUMN IF EXISTS "importanceScore";
ALTER TABLE "Article" DROP COLUMN IF EXISTS "contentHash";
ALTER TABLE "Article" DROP COLUMN IF EXISTS "newsSourceId";
ALTER TABLE "Article" DROP COLUMN IF EXISTS "storyChainId";

-- ─── Migrate ArticleStatus enum ────────────────────────────────────────────────
-- Move any articles in intermediate statuses back to DRAFT before changing enum

UPDATE "Article" SET "status" = 'DRAFT'
WHERE "status" IN ('FACT_CHECKING', 'EDITORIAL_REVIEW', 'READY_TO_PUBLISH');

-- Rename old enum, create new simplified one, migrate column, drop old
-- Must drop DEFAULT first — PostgreSQL can't auto-cast enum defaults
ALTER TABLE "Article" ALTER COLUMN "status" DROP DEFAULT;

ALTER TYPE "ArticleStatus" RENAME TO "ArticleStatus_old";

CREATE TYPE "ArticleStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED');

ALTER TABLE "Article"
  ALTER COLUMN "status" TYPE "ArticleStatus"
  USING "status"::text::"ArticleStatus";

-- Restore default using new enum
ALTER TABLE "Article" ALTER COLUMN "status" SET DEFAULT 'DRAFT'::"ArticleStatus";

DROP TYPE "ArticleStatus_old";

-- ─── Drop unused enum types ────────────────────────────────────────────────────

DROP TYPE IF EXISTS "EntityType";
DROP TYPE IF EXISTS "StoryRelationshipType";
DROP TYPE IF EXISTS "QuestionType";
DROP TYPE IF EXISTS "QuestionPriority";
DROP TYPE IF EXISTS "QuestionStatus";
DROP TYPE IF EXISTS "ClaimType";
DROP TYPE IF EXISTS "VerificationStatus";
DROP TYPE IF EXISTS "PredictionType";
DROP TYPE IF EXISTS "PredictionStatus";
DROP TYPE IF EXISTS "DraftType";
DROP TYPE IF EXISTS "PostPlatform";
DROP TYPE IF EXISTS "PostStatus";
DROP TYPE IF EXISTS "MissionDifficulty";
DROP TYPE IF EXISTS "MissionStatus";
DROP TYPE IF EXISTS "SubmissionStatus";
DROP TYPE IF EXISTS "TipCategory";
DROP TYPE IF EXISTS "TipStatus";
DROP TYPE IF EXISTS "InvestigationStatus";

-- ─── Remove stale indexes ──────────────────────────────────────────────────────

DROP INDEX IF EXISTS "Article_storyChainId_idx";
DROP INDEX IF EXISTS "Article_importanceScore_idx";
