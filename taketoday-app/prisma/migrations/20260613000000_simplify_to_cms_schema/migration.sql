-- TakeToday: Simplify schema from 60+ models to 8-model news CMS
-- Preserves: AdminUser (5 rows), Category (1 row), Tag (1 row)
-- Drops: entire contributor platform, AI orchestration, social/job/ingestion tables

-- ─── 1. DROP CONTRIBUTOR ECONOMY (Phase D) ────────────────────────────────────

DROP TABLE IF EXISTS "TrustFlag" CASCADE;
DROP TABLE IF EXISTS "ContributorEndorsement" CASCADE;
DROP TABLE IF EXISTS "CivicImpact" CASCADE;
DROP TABLE IF EXISTS "ContributorActivity" CASCADE;
DROP TABLE IF EXISTS "LeaderboardEntry" CASCADE;
DROP TABLE IF EXISTS "MissionContribution" CASCADE;
DROP TABLE IF EXISTS "MissionParticipant" CASCADE;
DROP TABLE IF EXISTS "Mission" CASCADE;
DROP TABLE IF EXISTS "ExpertiseDomain" CASCADE;
DROP TABLE IF EXISTS "UserBadge" CASCADE;
DROP TABLE IF EXISTS "BadgeDefinition" CASCADE;
DROP TABLE IF EXISTS "ReputationEvent" CASCADE;
DROP TABLE IF EXISTS "ReputationDimension" CASCADE;
DROP TABLE IF EXISTS "ContributorStreak" CASCADE;
DROP TABLE IF EXISTS "ContributorNotification" CASCADE;

-- ─── 2. DROP INVESTIGATION / RESEARCH BOARDS ──────────────────────────────────

DROP TABLE IF EXISTS "ResearchCard" CASCADE;
DROP TABLE IF EXISTS "ResearchBoard" CASCADE;
DROP TABLE IF EXISTS "InvestigationMember" CASCADE;
DROP TABLE IF EXISTS "Investigation" CASCADE;

-- ─── 3. DROP CONTRIBUTION PLATFORM ───────────────────────────────────────────

DROP TABLE IF EXISTS "ContributionEmbedding" CASCADE;
DROP TABLE IF EXISTS "AIAnalysis" CASCADE;
DROP TABLE IF EXISTS "TransparencyLog" CASCADE;
DROP TABLE IF EXISTS "Correction" CASCADE;
DROP TABLE IF EXISTS "EditorialDecision" CASCADE;
DROP TABLE IF EXISTS "CommunityNote" CASCADE;
DROP TABLE IF EXISTS "CommunityVote" CASCADE;
DROP TABLE IF EXISTS "FactCheck" CASCADE;
DROP TABLE IF EXISTS "CitationNode" CASCADE;
DROP TABLE IF EXISTS "Evidence" CASCADE;
DROP TABLE IF EXISTS "ContributionCollaborator" CASCADE;
DROP TABLE IF EXISTS "ContributionVersion" CASCADE;
DROP TABLE IF EXISTS "Contribution" CASCADE;
DROP TABLE IF EXISTS "EmailVerificationToken" CASCADE;
DROP TABLE IF EXISTS "PasswordResetToken" CASCADE;
DROP TABLE IF EXISTS "ContributorReputation" CASCADE;
DROP TABLE IF EXISTS "PublicUser" CASCADE;

-- ─── 4. DROP AI ORCHESTRATION (Phase E) ──────────────────────────────────────

DROP TABLE IF EXISTS "AIUsageEvent" CASCADE;
DROP TABLE IF EXISTS "AITaskRoute" CASCADE;
DROP TABLE IF EXISTS "AIProviderSetting" CASCADE;

-- ─── 5. DROP SOCIAL / JOBS / INGESTION ───────────────────────────────────────

DROP TABLE IF EXISTS "SocialPost" CASCADE;
DROP TABLE IF EXISTS "CarouselJob" CASCADE;
DROP TABLE IF EXISTS "ShortVideoJob" CASCADE;
DROP TABLE IF EXISTS "IngestionJob" CASCADE;
DROP TABLE IF EXISTS "IngestionSource" CASCADE;
DROP TABLE IF EXISTS "Job" CASCADE;

-- ─── 6. DROP REVIEW / ANALYTICS / NOTIFICATION / INTEGRATION ─────────────────

DROP TABLE IF EXISTS "ReviewComment" CASCADE;
DROP TABLE IF EXISTS "AnalyticsEvent" CASCADE;
DROP TABLE IF EXISTS "Notification" CASCADE;
DROP TABLE IF EXISTS "Integration" CASCADE;

-- ─── 7. DROP ARTICLE JUNCTION TABLES WE'RE REPLACING ─────────────────────────

DROP TABLE IF EXISTS "ArticleGallery" CASCADE;
DROP TABLE IF EXISTS "ArticleCategory" CASCADE;
DROP TABLE IF EXISTS "MediaTag" CASCADE;

-- ─── 8. DROP Source TABLE (after removing FK from Article) ───────────────────

ALTER TABLE "Article" DROP COLUMN IF EXISTS "sourceId";
DROP TABLE IF EXISTS "Source" CASCADE;

-- ─── 9. SIMPLIFY Article COLUMNS ─────────────────────────────────────────────

ALTER TABLE "Article"
  DROP COLUMN IF EXISTS "subheadline",
  DROP COLUMN IF EXISTS "language",
  DROP COLUMN IF EXISTS "location",
  DROP COLUMN IF EXISTS "priorityScore",
  DROP COLUMN IF EXISTS "quickTake",
  DROP COLUMN IF EXISTS "whyItMatters",
  DROP COLUMN IF EXISTS "takeaways",
  DROP COLUMN IF EXISTS "format",
  DROP COLUMN IF EXISTS "region",
  DROP COLUMN IF EXISTS "captions",
  DROP COLUMN IF EXISTS "publishLogs",
  DROP COLUMN IF EXISTS "canonicalUrl",
  DROP COLUMN IF EXISTS "sourceLink";

-- Add new Article columns
ALTER TABLE "Article"
  ADD COLUMN IF NOT EXISTS "excerpt" TEXT,
  ADD COLUMN IF NOT EXISTS "views" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "categoryId" TEXT;

-- Add FK for categoryId
ALTER TABLE "Article"
  ADD CONSTRAINT "Article_categoryId_fkey"
  FOREIGN KEY ("categoryId") REFERENCES "Category"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- ─── 10. SIMPLIFY AdminUser COLUMNS ──────────────────────────────────────────

ALTER TABLE "AdminUser"
  DROP COLUMN IF EXISTS "revokedAt",
  DROP COLUMN IF EXISTS "lastActiveAt";

-- ─── 11. SIMPLIFY MediaAsset COLUMNS ─────────────────────────────────────────

ALTER TABLE "MediaAsset"
  DROP COLUMN IF EXISTS "secureUrl",
  DROP COLUMN IF EXISTS "resourceType",
  DROP COLUMN IF EXISTS "format";

-- Add bytes default if column exists but has no default
ALTER TABLE "MediaAsset"
  ALTER COLUMN "bytes" SET DEFAULT 0;

-- ─── 12. SIMPLIFY AuditLog COLUMNS ───────────────────────────────────────────

ALTER TABLE "AuditLog"
  DROP COLUMN IF EXISTS "ipAddress";

-- ─── 13. UPDATE AdminRole ENUM ───────────────────────────────────────────────
-- Map: SUPER_ADMIN → ADMIN, CONTENT_MANAGER → ADMIN,
--      SOCIAL_MEDIA_MANAGER → EDITOR, ANALYST → EDITOR, EDITOR → EDITOR

-- Step 1: Change column to text so we can freely update values
ALTER TABLE "AdminUser" ALTER COLUMN "role" TYPE TEXT USING "role"::TEXT;

-- Step 2: Update data
UPDATE "AdminUser"
SET "role" = 'ADMIN'
WHERE "role" IN ('SUPER_ADMIN', 'CONTENT_MANAGER');

UPDATE "AdminUser"
SET "role" = 'EDITOR'
WHERE "role" IN ('SOCIAL_MEDIA_MANAGER', 'ANALYST');
-- (EDITOR stays as EDITOR)

-- Step 3: Drop old enum
DROP TYPE IF EXISTS "AdminRole" CASCADE;

-- Step 4: Create new simplified enum
CREATE TYPE "AdminRole" AS ENUM ('ADMIN', 'EDITOR');

-- Step 5: Restore column type
ALTER TABLE "AdminUser"
  ALTER COLUMN "role" TYPE "AdminRole" USING "role"::"AdminRole";

-- Step 6: Restore default
ALTER TABLE "AdminUser"
  ALTER COLUMN "role" SET DEFAULT 'EDITOR'::"AdminRole";

-- ─── 14. UPDATE ArticleStatus ENUM ──────────────────────────────────────────
-- Remove UNDER_REVIEW and APPROVED (no articles in DB so no data migration needed)

ALTER TABLE "Article" ALTER COLUMN "status" TYPE TEXT USING "status"::TEXT;

-- Safety: map any orphaned values (shouldn't exist, 0 articles)
UPDATE "Article"
SET "status" = 'DRAFT'
WHERE "status" IN ('UNDER_REVIEW', 'APPROVED');

DROP TYPE IF EXISTS "ArticleStatus" CASCADE;

CREATE TYPE "ArticleStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED');

ALTER TABLE "Article"
  ALTER COLUMN "status" TYPE "ArticleStatus" USING "status"::"ArticleStatus";

ALTER TABLE "Article"
  ALTER COLUMN "status" SET DEFAULT 'DRAFT'::"ArticleStatus";

-- ─── 15. DROP ALL REMOVED ENUMS ──────────────────────────────────────────────

DROP TYPE IF EXISTS "IntegrationProvider" CASCADE;
DROP TYPE IF EXISTS "SocialPlatform" CASCADE;
DROP TYPE IF EXISTS "JobStatus" CASCADE;
DROP TYPE IF EXISTS "AITaskType" CASCADE;
DROP TYPE IF EXISTS "ContributorRole" CASCADE;
DROP TYPE IF EXISTS "ContributionType" CASCADE;
DROP TYPE IF EXISTS "WorkflowStage" CASCADE;
DROP TYPE IF EXISTS "CollaboratorRole" CASCADE;
DROP TYPE IF EXISTS "EvidenceType" CASCADE;
DROP TYPE IF EXISTS "SourceType" CASCADE;
DROP TYPE IF EXISTS "FactCheckVerdict" CASCADE;
DROP TYPE IF EXISTS "VoteType" CASCADE;
DROP TYPE IF EXISTS "NoteType" CASCADE;
DROP TYPE IF EXISTS "NoteStatus" CASCADE;
DROP TYPE IF EXISTS "ReputationTier" CASCADE;
DROP TYPE IF EXISTS "TransparencyAction" CASCADE;
DROP TYPE IF EXISTS "DecisionType" CASCADE;
DROP TYPE IF EXISTS "CorrectionSeverity" CASCADE;
DROP TYPE IF EXISTS "InvestigationStatus" CASCADE;
DROP TYPE IF EXISTS "InvestigationRole" CASCADE;
DROP TYPE IF EXISTS "CardType" CASCADE;
DROP TYPE IF EXISTS "CardPriority" CASCADE;
DROP TYPE IF EXISTS "StreakType" CASCADE;
DROP TYPE IF EXISTS "BadgeRarity" CASCADE;
DROP TYPE IF EXISTS "BadgeCategory" CASCADE;
DROP TYPE IF EXISTS "MissionType" CASCADE;
DROP TYPE IF EXISTS "MissionStatus" CASCADE;
DROP TYPE IF EXISTS "LeaderboardType" CASCADE;
DROP TYPE IF EXISTS "ActivityType" CASCADE;
DROP TYPE IF EXISTS "RepDimension" CASCADE;
DROP TYPE IF EXISTS "TrustFlagType" CASCADE;

-- ─── 16. ADD NEW INDEXES ─────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS "Article_categoryId_idx" ON "Article"("categoryId");
CREATE INDEX IF NOT EXISTS "Article_scheduledAt_idx" ON "Article"("scheduledAt");
