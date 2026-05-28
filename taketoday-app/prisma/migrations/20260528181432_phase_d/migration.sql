-- CreateEnum
CREATE TYPE "AdminRole" AS ENUM ('SUPER_ADMIN', 'EDITOR', 'CONTENT_MANAGER', 'SOCIAL_MEDIA_MANAGER', 'ANALYST');

-- CreateEnum
CREATE TYPE "ArticleStatus" AS ENUM ('DRAFT', 'UNDER_REVIEW', 'APPROVED', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "IntegrationProvider" AS ENUM ('OPENAI', 'ANTHROPIC', 'GEMINI', 'CLOUDINARY', 'X', 'INSTAGRAM', 'WHATSAPP', 'TELEGRAM', 'FACEBOOK', 'LINKEDIN', 'YOUTUBE');

-- CreateEnum
CREATE TYPE "SocialPlatform" AS ENUM ('X', 'INSTAGRAM', 'WHATSAPP', 'TELEGRAM', 'FACEBOOK', 'LINKEDIN', 'YOUTUBE');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('PENDING', 'QUEUED', 'RUNNING', 'SUCCEEDED', 'FAILED', 'RETRYING', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ContributorRole" AS ENUM ('READER', 'CONTRIBUTOR', 'RESEARCHER', 'FACT_CHECKER', 'JOURNALIST', 'EXPERT_REVIEWER');

-- CreateEnum
CREATE TYPE "ContributionType" AS ENUM ('BREAKING_NEWS', 'INVESTIGATION', 'RESEARCH', 'THREAD', 'DATA_JOURNALISM', 'DOCUMENT_LEAK', 'PHOTO_REPORT', 'VIDEO_REPORT', 'EXPLAINER', 'COMMUNITY_NOTE', 'OPINION', 'WHISTLEBLOWER_TIP');

-- CreateEnum
CREATE TYPE "ContributionStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'UNDER_RESEARCH', 'FACT_CHECK_PENDING', 'VERIFIED', 'EDITOR_REVIEW', 'APPROVED', 'PUBLISHED', 'ARCHIVED', 'DISPUTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "WorkflowStage" AS ENUM ('DRAFT', 'SUBMITTED', 'UNDER_RESEARCH', 'FACT_CHECK_PENDING', 'VERIFIED', 'EDITOR_REVIEW', 'APPROVED', 'PUBLISHED', 'ARCHIVED', 'DISPUTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "CollaboratorRole" AS ENUM ('CONTRIBUTOR', 'RESEARCHER', 'FACT_CHECKER', 'EDITOR', 'REVIEWER');

-- CreateEnum
CREATE TYPE "EvidenceType" AS ENUM ('DOCUMENT', 'IMAGE', 'VIDEO', 'URL', 'DATA_FILE', 'QUOTE', 'TESTIMONY', 'COURT_RECORD', 'FINANCIAL_RECORD', 'GOVERNMENT_RECORD');

-- CreateEnum
CREATE TYPE "SourceType" AS ENUM ('NEWS_OUTLET', 'GOVERNMENT_DOCUMENT', 'ACADEMIC_PAPER', 'SOCIAL_MEDIA', 'PRIMARY_DOCUMENT', 'WITNESS_TESTIMONY', 'FINANCIAL_FILING', 'COURT_DOCUMENT', 'NGO_REPORT', 'PRESS_RELEASE');

-- CreateEnum
CREATE TYPE "FactCheckVerdict" AS ENUM ('TRUE', 'MOSTLY_TRUE', 'PARTIALLY_TRUE', 'CONTEXT_NEEDED', 'MOSTLY_FALSE', 'FALSE', 'UNVERIFIABLE', 'SATIRE');

-- CreateEnum
CREATE TYPE "VoteType" AS ENUM ('CREDIBLE', 'NEEDS_VERIFICATION', 'DISPUTED', 'SPAM', 'INSIGHTFUL');

-- CreateEnum
CREATE TYPE "NoteType" AS ENUM ('CONTEXT', 'CORRECTION', 'MISLEADING_FRAMING', 'MISSING_INFO', 'OUTDATED');

-- CreateEnum
CREATE TYPE "NoteStatus" AS ENUM ('PENDING', 'VISIBLE', 'HIDDEN', 'REMOVED');

-- CreateEnum
CREATE TYPE "ReputationTier" AS ENUM ('NEWCOMER', 'CONTRIBUTOR', 'TRUSTED', 'VERIFIED', 'EXPERT', 'STAFF');

-- CreateEnum
CREATE TYPE "TransparencyAction" AS ENUM ('SUBMITTED', 'AI_ANALYSIS_RUN', 'AI_DRAFT_GENERATED', 'SOURCE_ADDED', 'EVIDENCE_UPLOADED', 'FACT_CHECKED', 'COMMUNITY_VOTED', 'EDITED', 'VERSION_CREATED', 'FORKED', 'WORKFLOW_CHANGED', 'DISPUTED', 'CORRECTED', 'EDITORIAL_DECISION', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "DecisionType" AS ENUM ('APPROVE', 'REJECT', 'REQUEST_CHANGES', 'ESCALATE', 'SEND_TO_FACT_CHECK', 'DISPUTE', 'PUBLISH', 'ARCHIVE');

-- CreateEnum
CREATE TYPE "CorrectionSeverity" AS ENUM ('MINOR', 'MAJOR', 'RETRACTION');

-- CreateEnum
CREATE TYPE "InvestigationStatus" AS ENUM ('ACTIVE', 'ON_HOLD', 'PUBLISHED', 'CLOSED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "InvestigationRole" AS ENUM ('LEAD', 'RESEARCHER', 'FACT_CHECKER', 'EDITOR', 'VIEWER');

-- CreateEnum
CREATE TYPE "CardType" AS ENUM ('LEAD', 'EVIDENCE', 'SOURCE', 'FINDING', 'QUESTION', 'DOCUMENT', 'TIMELINE_EVENT', 'PERSON', 'ORGANIZATION');

-- CreateEnum
CREATE TYPE "CardPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "StreakType" AS ENUM ('DAILY_CONTRIBUTION', 'WEEKLY_PUBLISHING', 'FACT_CHECKING', 'EVIDENCE_UPLOAD', 'SOURCE_VERIFICATION', 'RESEARCH_COLLABORATION', 'TRANSLATION', 'COMMUNITY_MODERATION');

-- CreateEnum
CREATE TYPE "BadgeRarity" AS ENUM ('COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY');

-- CreateEnum
CREATE TYPE "BadgeCategory" AS ENUM ('REPORTING', 'FACT_CHECKING', 'INVESTIGATION', 'COMMUNITY', 'ACCURACY', 'STREAK', 'MILESTONE', 'SEASONAL', 'SPECIAL');

-- CreateEnum
CREATE TYPE "MissionType" AS ENUM ('FACT_CHECK_CAMPAIGN', 'REGIONAL_COVERAGE', 'CRISIS_COVERAGE', 'ELECTION_MONITORING', 'INVESTIGATION_SPRINT', 'TRANSLATION_DRIVE', 'MODERATION_PUSH', 'EVIDENCE_COLLECTION');

-- CreateEnum
CREATE TYPE "MissionStatus" AS ENUM ('UPCOMING', 'ACTIVE', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "LeaderboardType" AS ENUM ('OVERALL', 'REPORTING', 'FACT_CHECKING', 'INVESTIGATION', 'ACCURACY', 'COMMUNITY', 'RISING');

-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('CONTRIBUTION_PUBLISHED', 'FACT_CHECK_COMPLETED', 'BADGE_EARNED', 'STREAK_MILESTONE', 'MISSION_JOINED', 'MISSION_COMPLETED', 'INVESTIGATION_JOINED', 'EVIDENCE_SUBMITTED', 'NOTE_PROMOTED', 'CORRECTION_ISSUED');

-- CreateEnum
CREATE TYPE "RepDimension" AS ENUM ('REPORTING', 'FACT_CHECK', 'RESEARCH', 'MODERATION', 'ACCURACY', 'SOURCE', 'COLLABORATION', 'COMMUNITY');

-- CreateEnum
CREATE TYPE "TrustFlagType" AS ENUM ('SPAM_FARMING', 'COORDINATED_MANIPULATION', 'AI_GENERATED_JUNK', 'VOTE_BRIGADING', 'REPUTATION_ABUSE', 'SYBIL_SUSPECTED', 'QUALITY_BREACH');

-- CreateEnum
CREATE TYPE "AITaskType" AS ENUM ('ARTICLE_GENERATION', 'CAROUSEL_GENERATION', 'SHORT_VIDEO_SCRIPT', 'SOCIAL_CAPTION', 'HEADLINE_VARIANTS', 'SEO_METADATA', 'SUMMARIZATION', 'REWRITE', 'DISTRIBUTION_POST', 'FACT_CHECK', 'TRANSLATION', 'ANALYSIS');

-- CreateTable
CREATE TABLE "AdminUser" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "AdminRole" NOT NULL DEFAULT 'ANALYST',
    "image" TEXT,
    "twoFactorReady" BOOLEAN NOT NULL DEFAULT false,
    "revokedAt" TIMESTAMP(3),
    "lastActiveAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Article" (
    "id" TEXT NOT NULL,
    "headline" TEXT NOT NULL,
    "subheadline" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "featuredImageId" TEXT,
    "sourceLink" TEXT,
    "authorId" TEXT NOT NULL,
    "status" "ArticleStatus" NOT NULL DEFAULT 'DRAFT',
    "language" TEXT NOT NULL DEFAULT 'en',
    "location" TEXT,
    "breaking" BOOLEAN NOT NULL DEFAULT false,
    "priorityScore" INTEGER NOT NULL DEFAULT 50,
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "metaKeywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "canonicalUrl" TEXT,
    "scheduledAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "captions" JSONB,
    "publishLogs" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "sourceId" TEXT,

    CONSTRAINT "Article_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArticleCategory" (
    "articleId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,

    CONSTRAINT "ArticleCategory_pkey" PRIMARY KEY ("articleId","categoryId")
);

-- CreateTable
CREATE TABLE "ArticleTag" (
    "articleId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "ArticleTag_pkey" PRIMARY KEY ("articleId","tagId")
);

-- CreateTable
CREATE TABLE "MediaFolder" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MediaFolder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MediaAsset" (
    "id" TEXT NOT NULL,
    "folderId" TEXT,
    "url" TEXT NOT NULL,
    "secureUrl" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "bytes" INTEGER NOT NULL,
    "altText" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MediaAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MediaTag" (
    "mediaId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "MediaTag_pkey" PRIMARY KEY ("mediaId","tagId")
);

-- CreateTable
CREATE TABLE "ArticleGallery" (
    "articleId" TEXT NOT NULL,
    "mediaId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ArticleGallery_pkey" PRIMARY KEY ("articleId","mediaId")
);

-- CreateTable
CREATE TABLE "IngestionSource" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "trustScore" INTEGER NOT NULL DEFAULT 70,
    "trustedCategories" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IngestionSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IngestionJob" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT,
    "type" TEXT NOT NULL,
    "input" TEXT NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'QUEUED',
    "duplicateOf" TEXT,
    "result" JSONB,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IngestionJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Source" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "lastScraped" TIMESTAMP(3),

    CONSTRAINT "Source_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Job" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'PENDING',
    "result" JSONB,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "error" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "idempotencyKey" TEXT,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialPost" (
    "id" TEXT NOT NULL,
    "articleId" TEXT,
    "platform" "SocialPlatform" NOT NULL,
    "copy" TEXT NOT NULL,
    "mediaIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" "JobStatus" NOT NULL DEFAULT 'QUEUED',
    "scheduledAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SocialPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShortVideoJob" (
    "id" TEXT NOT NULL,
    "script" TEXT NOT NULL,
    "voiceProvider" TEXT,
    "avatarProvider" TEXT,
    "subtitleUrl" TEXT,
    "status" "JobStatus" NOT NULL DEFAULT 'QUEUED',
    "publishQueue" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShortVideoJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReviewComment" (
    "id" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReviewComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalyticsEvent" (
    "id" TEXT NOT NULL,
    "articleId" TEXT,
    "type" TEXT NOT NULL,
    "source" TEXT,
    "value" DOUBLE PRECISION NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnalyticsEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Integration" (
    "id" TEXT NOT NULL,
    "provider" "IntegrationProvider" NOT NULL,
    "name" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "config" JSONB,
    "secretRef" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Integration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "before" JSONB,
    "after" JSONB,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PublicUser" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "avatar" TEXT,
    "bio" TEXT,
    "location" TEXT,
    "website" TEXT,
    "twitterHandle" TEXT,
    "linkedinUrl" TEXT,
    "emailVerified" TIMESTAMP(3),
    "passwordHash" TEXT,
    "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
    "twoFactorSecret" TEXT,
    "role" "ContributorRole" NOT NULL DEFAULT 'CONTRIBUTOR',
    "isVerifiedJournalist" BOOLEAN NOT NULL DEFAULT false,
    "verifiedExpertise" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "suspendedAt" TIMESTAMP(3),
    "suspendedReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PublicUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contribution" (
    "id" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "type" "ContributionType" NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "summary" TEXT,
    "body" TEXT NOT NULL,
    "status" "ContributionStatus" NOT NULL DEFAULT 'DRAFT',
    "workflowStage" "WorkflowStage" NOT NULL DEFAULT 'DRAFT',
    "parentId" TEXT,
    "rootId" TEXT,
    "branchName" TEXT,
    "confidenceScore" DOUBLE PRECISION,
    "riskScore" DOUBLE PRECISION,
    "biasScore" DOUBLE PRECISION,
    "aiUsageDisclosed" BOOLEAN NOT NULL DEFAULT false,
    "aiSummary" TEXT,
    "language" TEXT NOT NULL DEFAULT 'en',
    "location" TEXT,
    "isBreaking" BOOLEAN NOT NULL DEFAULT false,
    "isWhistleblower" BOOLEAN NOT NULL DEFAULT false,
    "publishedArticleId" TEXT,
    "categoryId" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "publishedAt" TIMESTAMP(3),

    CONSTRAINT "Contribution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContributionVersion" (
    "id" TEXT NOT NULL,
    "contributionId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "body" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "commitMessage" TEXT,
    "authorId" TEXT,
    "diff" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContributionVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContributionCollaborator" (
    "contributionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "CollaboratorRole" NOT NULL DEFAULT 'CONTRIBUTOR',
    "invitedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedAt" TIMESTAMP(3),

    CONSTRAINT "ContributionCollaborator_pkey" PRIMARY KEY ("contributionId","userId")
);

-- CreateTable
CREATE TABLE "Evidence" (
    "id" TEXT NOT NULL,
    "contributionId" TEXT NOT NULL,
    "type" "EvidenceType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "url" TEXT,
    "fileUrl" TEXT,
    "publicId" TEXT,
    "submittedById" TEXT NOT NULL,
    "credibilityScore" DOUBLE PRECISION,
    "verifiedAt" TIMESTAMP(3),
    "verifiedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Evidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CitationNode" (
    "id" TEXT NOT NULL,
    "contributionId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "title" TEXT,
    "excerpt" TEXT,
    "publishedAt" TIMESTAMP(3),
    "accessedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reliabilityScore" DOUBLE PRECISION,
    "type" "SourceType" NOT NULL,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "archiveUrl" TEXT,

    CONSTRAINT "CitationNode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FactCheck" (
    "id" TEXT NOT NULL,
    "contributionId" TEXT NOT NULL,
    "checkerId" TEXT NOT NULL,
    "claim" TEXT NOT NULL,
    "verdict" "FactCheckVerdict" NOT NULL,
    "explanation" TEXT NOT NULL,
    "evidenceLinks" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "confidenceScore" DOUBLE PRECISION,
    "aiAssisted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FactCheck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunityVote" (
    "id" TEXT NOT NULL,
    "contributionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "VoteType" NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommunityVote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunityNote" (
    "id" TEXT NOT NULL,
    "contributionId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "type" "NoteType" NOT NULL,
    "helpful" INTEGER NOT NULL DEFAULT 0,
    "notHelpful" INTEGER NOT NULL DEFAULT 0,
    "status" "NoteStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommunityNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContributorReputation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "totalContributions" INTEGER NOT NULL DEFAULT 0,
    "publishedCount" INTEGER NOT NULL DEFAULT 0,
    "factCheckAccuracy" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "communityTrustScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "editorialTrustScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "overallScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tier" "ReputationTier" NOT NULL DEFAULT 'NEWCOMER',
    "expertiseTopics" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "strikes" INTEGER NOT NULL DEFAULT 0,
    "badges" JSONB NOT NULL DEFAULT '[]',
    "lastRecalculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContributorReputation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransparencyLog" (
    "id" TEXT NOT NULL,
    "contributionId" TEXT NOT NULL,
    "action" "TransparencyAction" NOT NULL,
    "actorId" TEXT,
    "actorType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TransparencyLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIAnalysis" (
    "id" TEXT NOT NULL,
    "contributionId" TEXT NOT NULL,
    "biasScore" DOUBLE PRECISION,
    "biasDetails" JSONB,
    "misinformationRisk" DOUBLE PRECISION,
    "duplicateSimilarity" DOUBLE PRECISION,
    "duplicateOf" TEXT,
    "suggestedKeywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "suggestedHeadlines" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "readabilityScore" DOUBLE PRECISION,
    "sentimentScore" DOUBLE PRECISION,
    "sentimentLabel" TEXT,
    "factClaimsExtracted" JSONB,
    "languageDetected" TEXT,
    "translatedSummaries" JSONB,
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "contentWarnings" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AIAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EditorialDecision" (
    "id" TEXT NOT NULL,
    "contributionId" TEXT NOT NULL,
    "decisionType" "DecisionType" NOT NULL,
    "reason" TEXT NOT NULL,
    "notes" TEXT,
    "editorId" TEXT NOT NULL,
    "publiclyVisible" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EditorialDecision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Correction" (
    "id" TEXT NOT NULL,
    "contributionId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "previousContent" TEXT,
    "correctedContent" TEXT,
    "severity" "CorrectionSeverity" NOT NULL,
    "correctedById" TEXT NOT NULL,
    "correctedByType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Correction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Investigation" (
    "id" TEXT NOT NULL,
    "leaderId" TEXT NOT NULL,
    "leaderType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "status" "InvestigationStatus" NOT NULL DEFAULT 'ACTIVE',
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "targetEntity" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Investigation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvestigationMember" (
    "investigationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "InvestigationRole" NOT NULL DEFAULT 'RESEARCHER',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InvestigationMember_pkey" PRIMARY KEY ("investigationId","userId")
);

-- CreateTable
CREATE TABLE "ContributionEmbedding" (
    "id" TEXT NOT NULL,
    "contributionId" TEXT NOT NULL,
    "model" TEXT NOT NULL DEFAULT 'text-embedding-3-small',
    "dimensions" INTEGER NOT NULL DEFAULT 1536,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContributionEmbedding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResearchBoard" (
    "id" TEXT NOT NULL,
    "investigationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "columns" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResearchBoard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResearchCard" (
    "id" TEXT NOT NULL,
    "boardId" TEXT NOT NULL,
    "columnId" TEXT NOT NULL,
    "type" "CardType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "assignedToId" TEXT,
    "contributionId" TEXT,
    "evidenceIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "priority" "CardPriority" NOT NULL DEFAULT 'MEDIUM',
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResearchCard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContributorNotification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "metadata" JSONB,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContributorNotification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContributorStreak" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "activityType" "StreakType" NOT NULL,
    "currentStreak" INTEGER NOT NULL DEFAULT 0,
    "longestStreak" INTEGER NOT NULL DEFAULT 0,
    "lastActivityAt" TIMESTAMP(3),
    "graceUsedAt" TIMESTAMP(3),
    "freezesLeft" INTEGER NOT NULL DEFAULT 2,
    "milestoneHits" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContributorStreak_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReputationDimension" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reportingScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "factCheckScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "researchScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "moderationScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "accuracyScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sourceScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "collaborationScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "communityScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "overallScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fraudRiskScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lastDecayAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReputationDimension_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReputationEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dimension" "RepDimension" NOT NULL,
    "delta" DOUBLE PRECISION NOT NULL,
    "reason" TEXT NOT NULL,
    "sourceId" TEXT,
    "sourceType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReputationEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BadgeDefinition" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "rarity" "BadgeRarity" NOT NULL,
    "category" "BadgeCategory" NOT NULL,
    "criteria" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isSeasonal" BOOLEAN NOT NULL DEFAULT false,
    "seasonEndAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BadgeDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserBadge" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "badgeId" TEXT NOT NULL,
    "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,
    "isShowcased" BOOLEAN NOT NULL DEFAULT false,
    "showcaseOrder" INTEGER,

    CONSTRAINT "UserBadge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExpertiseDomain" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "contributions" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExpertiseDomain_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Mission" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" "MissionType" NOT NULL,
    "status" "MissionStatus" NOT NULL DEFAULT 'ACTIVE',
    "targetCount" INTEGER NOT NULL,
    "currentCount" INTEGER NOT NULL DEFAULT 0,
    "region" TEXT,
    "topic" TEXT,
    "rewardBadgeId" TEXT,
    "rewardPoints" INTEGER NOT NULL DEFAULT 0,
    "startsAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Mission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MissionParticipant" (
    "id" TEXT NOT NULL,
    "missionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "MissionParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MissionContribution" (
    "id" TEXT NOT NULL,
    "missionId" TEXT NOT NULL,
    "contributionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MissionContribution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeaderboardEntry" (
    "id" TEXT NOT NULL,
    "boardType" "LeaderboardType" NOT NULL,
    "scope" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rank" INTEGER NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "metadata" JSONB,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeaderboardEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContributorActivity" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "ActivityType" NOT NULL,
    "targetId" TEXT,
    "targetType" TEXT,
    "metadata" JSONB,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContributorActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CivicImpact" (
    "id" TEXT NOT NULL,
    "contributionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "governmentResponse" BOOLEAN NOT NULL DEFAULT false,
    "communityResponse" BOOLEAN NOT NULL DEFAULT false,
    "correctionIssued" BOOLEAN NOT NULL DEFAULT false,
    "impactScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "impactStatement" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CivicImpact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContributorEndorsement" (
    "id" TEXT NOT NULL,
    "fromUserId" TEXT NOT NULL,
    "toUserId" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContributorEndorsement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrustFlag" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "flagType" "TrustFlagType" NOT NULL,
    "severity" DOUBLE PRECISION NOT NULL,
    "details" JSONB,
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrustFlag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIProviderSetting" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 5,
    "config" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AIProviderSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AITaskRoute" (
    "id" TEXT NOT NULL,
    "taskType" "AITaskType" NOT NULL,
    "providers" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "AITaskRoute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIUsageEvent" (
    "id" TEXT NOT NULL,
    "taskType" "AITaskType" NOT NULL,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "inputTokens" INTEGER NOT NULL DEFAULT 0,
    "outputTokens" INTEGER NOT NULL DEFAULT 0,
    "costUsd" DOUBLE PRECISION,
    "latencyMs" INTEGER NOT NULL DEFAULT 0,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "error" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIUsageEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AdminUser_email_key" ON "AdminUser"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Article_slug_key" ON "Article"("slug");

-- CreateIndex
CREATE INDEX "Article_status_publishedAt_idx" ON "Article"("status", "publishedAt");

-- CreateIndex
CREATE INDEX "Article_priorityScore_idx" ON "Article"("priorityScore");

-- CreateIndex
CREATE INDEX "Article_scheduledAt_idx" ON "Article"("scheduledAt");

-- CreateIndex
CREATE INDEX "Article_authorId_idx" ON "Article"("authorId");

-- CreateIndex
CREATE INDEX "Article_createdAt_idx" ON "Article"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Category_name_key" ON "Category"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_name_key" ON "Tag"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_slug_key" ON "Tag"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Source_url_key" ON "Source"("url");

-- CreateIndex
CREATE UNIQUE INDEX "Job_idempotencyKey_key" ON "Job"("idempotencyKey");

-- CreateIndex
CREATE INDEX "Job_status_createdAt_idx" ON "Job"("status", "createdAt");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_type_createdAt_idx" ON "AnalyticsEvent"("type", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_read_createdAt_idx" ON "Notification"("read", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Integration_provider_name_key" ON "Integration"("provider", "name");

-- CreateIndex
CREATE INDEX "AuditLog_entity_entityId_idx" ON "AuditLog"("entity", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "PublicUser_email_key" ON "PublicUser"("email");

-- CreateIndex
CREATE UNIQUE INDEX "PublicUser_username_key" ON "PublicUser"("username");

-- CreateIndex
CREATE INDEX "PublicUser_username_idx" ON "PublicUser"("username");

-- CreateIndex
CREATE INDEX "PublicUser_role_idx" ON "PublicUser"("role");

-- CreateIndex
CREATE INDEX "PublicUser_createdAt_idx" ON "PublicUser"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Contribution_slug_key" ON "Contribution"("slug");

-- CreateIndex
CREATE INDEX "Contribution_status_createdAt_idx" ON "Contribution"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Contribution_authorId_idx" ON "Contribution"("authorId");

-- CreateIndex
CREATE INDEX "Contribution_type_idx" ON "Contribution"("type");

-- CreateIndex
CREATE INDEX "Contribution_workflowStage_idx" ON "Contribution"("workflowStage");

-- CreateIndex
CREATE INDEX "Contribution_publishedAt_idx" ON "Contribution"("publishedAt");

-- CreateIndex
CREATE INDEX "ContributionVersion_contributionId_idx" ON "ContributionVersion"("contributionId");

-- CreateIndex
CREATE UNIQUE INDEX "ContributionVersion_contributionId_versionNumber_key" ON "ContributionVersion"("contributionId", "versionNumber");

-- CreateIndex
CREATE INDEX "Evidence_contributionId_idx" ON "Evidence"("contributionId");

-- CreateIndex
CREATE INDEX "CitationNode_contributionId_idx" ON "CitationNode"("contributionId");

-- CreateIndex
CREATE INDEX "FactCheck_contributionId_idx" ON "FactCheck"("contributionId");

-- CreateIndex
CREATE INDEX "CommunityVote_contributionId_idx" ON "CommunityVote"("contributionId");

-- CreateIndex
CREATE UNIQUE INDEX "CommunityVote_contributionId_userId_key" ON "CommunityVote"("contributionId", "userId");

-- CreateIndex
CREATE INDEX "CommunityNote_contributionId_status_idx" ON "CommunityNote"("contributionId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ContributorReputation_userId_key" ON "ContributorReputation"("userId");

-- CreateIndex
CREATE INDEX "TransparencyLog_contributionId_idx" ON "TransparencyLog"("contributionId");

-- CreateIndex
CREATE INDEX "TransparencyLog_createdAt_idx" ON "TransparencyLog"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "AIAnalysis_contributionId_key" ON "AIAnalysis"("contributionId");

-- CreateIndex
CREATE INDEX "EditorialDecision_contributionId_idx" ON "EditorialDecision"("contributionId");

-- CreateIndex
CREATE INDEX "Correction_contributionId_idx" ON "Correction"("contributionId");

-- CreateIndex
CREATE UNIQUE INDEX "Investigation_slug_key" ON "Investigation"("slug");

-- CreateIndex
CREATE INDEX "Investigation_status_idx" ON "Investigation"("status");

-- CreateIndex
CREATE INDEX "Investigation_leaderId_idx" ON "Investigation"("leaderId");

-- CreateIndex
CREATE UNIQUE INDEX "ContributionEmbedding_contributionId_key" ON "ContributionEmbedding"("contributionId");

-- CreateIndex
CREATE INDEX "ResearchBoard_investigationId_idx" ON "ResearchBoard"("investigationId");

-- CreateIndex
CREATE INDEX "ResearchCard_boardId_columnId_idx" ON "ResearchCard"("boardId", "columnId");

-- CreateIndex
CREATE INDEX "ResearchCard_type_idx" ON "ResearchCard"("type");

-- CreateIndex
CREATE INDEX "ContributorNotification_userId_read_idx" ON "ContributorNotification"("userId", "read");

-- CreateIndex
CREATE INDEX "ContributorNotification_createdAt_idx" ON "ContributorNotification"("createdAt");

-- CreateIndex
CREATE INDEX "ContributorStreak_userId_idx" ON "ContributorStreak"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ContributorStreak_userId_activityType_key" ON "ContributorStreak"("userId", "activityType");

-- CreateIndex
CREATE UNIQUE INDEX "ReputationDimension_userId_key" ON "ReputationDimension"("userId");

-- CreateIndex
CREATE INDEX "ReputationEvent_userId_createdAt_idx" ON "ReputationEvent"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "BadgeDefinition_slug_key" ON "BadgeDefinition"("slug");

-- CreateIndex
CREATE INDEX "UserBadge_userId_idx" ON "UserBadge"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserBadge_userId_badgeId_key" ON "UserBadge"("userId", "badgeId");

-- CreateIndex
CREATE INDEX "ExpertiseDomain_topic_score_idx" ON "ExpertiseDomain"("topic", "score");

-- CreateIndex
CREATE UNIQUE INDEX "ExpertiseDomain_userId_topic_key" ON "ExpertiseDomain"("userId", "topic");

-- CreateIndex
CREATE INDEX "Mission_status_endsAt_idx" ON "Mission"("status", "endsAt");

-- CreateIndex
CREATE INDEX "MissionParticipant_missionId_idx" ON "MissionParticipant"("missionId");

-- CreateIndex
CREATE UNIQUE INDEX "MissionParticipant_missionId_userId_key" ON "MissionParticipant"("missionId", "userId");

-- CreateIndex
CREATE INDEX "MissionContribution_missionId_idx" ON "MissionContribution"("missionId");

-- CreateIndex
CREATE UNIQUE INDEX "MissionContribution_missionId_contributionId_key" ON "MissionContribution"("missionId", "contributionId");

-- CreateIndex
CREATE INDEX "LeaderboardEntry_boardType_scope_rank_idx" ON "LeaderboardEntry"("boardType", "scope", "rank");

-- CreateIndex
CREATE UNIQUE INDEX "LeaderboardEntry_boardType_scope_userId_key" ON "LeaderboardEntry"("boardType", "scope", "userId");

-- CreateIndex
CREATE INDEX "ContributorActivity_userId_createdAt_idx" ON "ContributorActivity"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "ContributorActivity_createdAt_idx" ON "ContributorActivity"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "CivicImpact_contributionId_key" ON "CivicImpact"("contributionId");

-- CreateIndex
CREATE INDEX "ContributorEndorsement_toUserId_idx" ON "ContributorEndorsement"("toUserId");

-- CreateIndex
CREATE UNIQUE INDEX "ContributorEndorsement_fromUserId_toUserId_domain_key" ON "ContributorEndorsement"("fromUserId", "toUserId", "domain");

-- CreateIndex
CREATE INDEX "TrustFlag_userId_idx" ON "TrustFlag"("userId");

-- CreateIndex
CREATE INDEX "TrustFlag_flagType_resolvedAt_idx" ON "TrustFlag"("flagType", "resolvedAt");

-- CreateIndex
CREATE UNIQUE INDEX "AIProviderSetting_slug_key" ON "AIProviderSetting"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "AITaskRoute_taskType_key" ON "AITaskRoute"("taskType");

-- CreateIndex
CREATE INDEX "AIUsageEvent_taskType_idx" ON "AIUsageEvent"("taskType");

-- CreateIndex
CREATE INDEX "AIUsageEvent_provider_idx" ON "AIUsageEvent"("provider");

-- CreateIndex
CREATE INDEX "AIUsageEvent_createdAt_idx" ON "AIUsageEvent"("createdAt");

-- AddForeignKey
ALTER TABLE "Article" ADD CONSTRAINT "Article_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "AdminUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Article" ADD CONSTRAINT "Article_featuredImageId_fkey" FOREIGN KEY ("featuredImageId") REFERENCES "MediaAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Article" ADD CONSTRAINT "Article_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArticleCategory" ADD CONSTRAINT "ArticleCategory_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArticleCategory" ADD CONSTRAINT "ArticleCategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArticleTag" ADD CONSTRAINT "ArticleTag_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArticleTag" ADD CONSTRAINT "ArticleTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaFolder" ADD CONSTRAINT "MediaFolder_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "MediaFolder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaAsset" ADD CONSTRAINT "MediaAsset_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "MediaFolder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaTag" ADD CONSTRAINT "MediaTag_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "MediaAsset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaTag" ADD CONSTRAINT "MediaTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArticleGallery" ADD CONSTRAINT "ArticleGallery_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArticleGallery" ADD CONSTRAINT "ArticleGallery_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "MediaAsset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IngestionJob" ADD CONSTRAINT "IngestionJob_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "IngestionSource"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialPost" ADD CONSTRAINT "SocialPost_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewComment" ADD CONSTRAINT "ReviewComment_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewComment" ADD CONSTRAINT "ReviewComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "AdminUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnalyticsEvent" ADD CONSTRAINT "AnalyticsEvent_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contribution" ADD CONSTRAINT "Contribution_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "PublicUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contribution" ADD CONSTRAINT "Contribution_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Contribution"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContributionVersion" ADD CONSTRAINT "ContributionVersion_contributionId_fkey" FOREIGN KEY ("contributionId") REFERENCES "Contribution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContributionCollaborator" ADD CONSTRAINT "ContributionCollaborator_contributionId_fkey" FOREIGN KEY ("contributionId") REFERENCES "Contribution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContributionCollaborator" ADD CONSTRAINT "ContributionCollaborator_userId_fkey" FOREIGN KEY ("userId") REFERENCES "PublicUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evidence" ADD CONSTRAINT "Evidence_contributionId_fkey" FOREIGN KEY ("contributionId") REFERENCES "Contribution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evidence" ADD CONSTRAINT "Evidence_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "PublicUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CitationNode" ADD CONSTRAINT "CitationNode_contributionId_fkey" FOREIGN KEY ("contributionId") REFERENCES "Contribution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FactCheck" ADD CONSTRAINT "FactCheck_contributionId_fkey" FOREIGN KEY ("contributionId") REFERENCES "Contribution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FactCheck" ADD CONSTRAINT "FactCheck_checkerId_fkey" FOREIGN KEY ("checkerId") REFERENCES "PublicUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityVote" ADD CONSTRAINT "CommunityVote_contributionId_fkey" FOREIGN KEY ("contributionId") REFERENCES "Contribution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityVote" ADD CONSTRAINT "CommunityVote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "PublicUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityNote" ADD CONSTRAINT "CommunityNote_contributionId_fkey" FOREIGN KEY ("contributionId") REFERENCES "Contribution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityNote" ADD CONSTRAINT "CommunityNote_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "PublicUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContributorReputation" ADD CONSTRAINT "ContributorReputation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "PublicUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransparencyLog" ADD CONSTRAINT "TransparencyLog_contributionId_fkey" FOREIGN KEY ("contributionId") REFERENCES "Contribution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIAnalysis" ADD CONSTRAINT "AIAnalysis_contributionId_fkey" FOREIGN KEY ("contributionId") REFERENCES "Contribution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EditorialDecision" ADD CONSTRAINT "EditorialDecision_contributionId_fkey" FOREIGN KEY ("contributionId") REFERENCES "Contribution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EditorialDecision" ADD CONSTRAINT "EditorialDecision_editorId_fkey" FOREIGN KEY ("editorId") REFERENCES "AdminUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Correction" ADD CONSTRAINT "Correction_contributionId_fkey" FOREIGN KEY ("contributionId") REFERENCES "Contribution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvestigationMember" ADD CONSTRAINT "InvestigationMember_investigationId_fkey" FOREIGN KEY ("investigationId") REFERENCES "Investigation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvestigationMember" ADD CONSTRAINT "InvestigationMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "PublicUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContributionEmbedding" ADD CONSTRAINT "ContributionEmbedding_contributionId_fkey" FOREIGN KEY ("contributionId") REFERENCES "Contribution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResearchBoard" ADD CONSTRAINT "ResearchBoard_investigationId_fkey" FOREIGN KEY ("investigationId") REFERENCES "Investigation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResearchCard" ADD CONSTRAINT "ResearchCard_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "ResearchBoard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContributorNotification" ADD CONSTRAINT "ContributorNotification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "PublicUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContributorStreak" ADD CONSTRAINT "ContributorStreak_userId_fkey" FOREIGN KEY ("userId") REFERENCES "PublicUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReputationDimension" ADD CONSTRAINT "ReputationDimension_userId_fkey" FOREIGN KEY ("userId") REFERENCES "PublicUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReputationEvent" ADD CONSTRAINT "ReputationEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "PublicUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserBadge" ADD CONSTRAINT "UserBadge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "PublicUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserBadge" ADD CONSTRAINT "UserBadge_badgeId_fkey" FOREIGN KEY ("badgeId") REFERENCES "BadgeDefinition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpertiseDomain" ADD CONSTRAINT "ExpertiseDomain_userId_fkey" FOREIGN KEY ("userId") REFERENCES "PublicUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MissionParticipant" ADD CONSTRAINT "MissionParticipant_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "Mission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MissionParticipant" ADD CONSTRAINT "MissionParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "PublicUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MissionContribution" ADD CONSTRAINT "MissionContribution_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "Mission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MissionContribution" ADD CONSTRAINT "MissionContribution_contributionId_fkey" FOREIGN KEY ("contributionId") REFERENCES "Contribution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaderboardEntry" ADD CONSTRAINT "LeaderboardEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "PublicUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContributorActivity" ADD CONSTRAINT "ContributorActivity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "PublicUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CivicImpact" ADD CONSTRAINT "CivicImpact_contributionId_fkey" FOREIGN KEY ("contributionId") REFERENCES "Contribution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CivicImpact" ADD CONSTRAINT "CivicImpact_userId_fkey" FOREIGN KEY ("userId") REFERENCES "PublicUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContributorEndorsement" ADD CONSTRAINT "ContributorEndorsement_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "PublicUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContributorEndorsement" ADD CONSTRAINT "ContributorEndorsement_toUserId_fkey" FOREIGN KEY ("toUserId") REFERENCES "PublicUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrustFlag" ADD CONSTRAINT "TrustFlag_userId_fkey" FOREIGN KEY ("userId") REFERENCES "PublicUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
