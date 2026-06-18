-- CreateEnum
CREATE TYPE "MissionDifficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD');

-- CreateEnum
CREATE TYPE "MissionStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'COMPLETED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "SubmissionStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "TipCategory" AS ENUM ('AI', 'FINANCE', 'TECHNOLOGY', 'STARTUPS', 'CORPORATE_WRONGDOING', 'POLICY_REGULATION', 'OTHER');

-- CreateEnum
CREATE TYPE "TipStatus" AS ENUM ('NEW', 'UNDER_REVIEW', 'INVESTIGATING', 'PUBLISHED', 'REJECTED');

-- CreateEnum
CREATE TYPE "InvestigationStatus" AS ENUM ('OPEN', 'RESEARCHING', 'VERIFYING', 'WRITING', 'PUBLISHED');

-- CreateTable
CREATE TABLE "missions" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "difficulty" "MissionDifficulty" NOT NULL,
    "pointsReward" INTEGER NOT NULL,
    "status" "MissionStatus" NOT NULL DEFAULT 'OPEN',
    "deadline" TIMESTAMP(3),
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "missions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mission_submissions" (
    "id" TEXT NOT NULL,
    "missionId" TEXT NOT NULL,
    "submitterEmail" TEXT NOT NULL,
    "submitterName" TEXT,
    "submissionText" TEXT NOT NULL,
    "attachments" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" "SubmissionStatus" NOT NULL DEFAULT 'PENDING',
    "reviewNotes" TEXT,
    "bonusPoints" INTEGER NOT NULL DEFAULT 0,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "reviewedById" TEXT,

    CONSTRAINT "mission_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contributor_points" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "totalPoints" INTEGER NOT NULL DEFAULT 0,
    "missionsCompleted" INTEGER NOT NULL DEFAULT 0,
    "articlesContributed" INTEGER NOT NULL DEFAULT 0,
    "lastUpdated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contributor_points_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "story_tips" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "category" "TipCategory" NOT NULL,
    "sourceType" TEXT,
    "anonymous" BOOLEAN NOT NULL DEFAULT false,
    "contactEmail" TEXT,
    "attachments" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "evidenceLinks" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" "TipStatus" NOT NULL DEFAULT 'NEW',
    "assignedEditor" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "story_tips_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tip_comments" (
    "id" TEXT NOT NULL,
    "tipId" TEXT NOT NULL,
    "editorId" TEXT NOT NULL,
    "comment" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tip_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "investigations" (
    "id" TEXT NOT NULL,
    "tipId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" "InvestigationStatus" NOT NULL DEFAULT 'OPEN',
    "leadEditorId" TEXT,
    "assignedReporters" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "timeline" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "investigations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "missions_status_idx" ON "missions"("status");

-- CreateIndex
CREATE INDEX "missions_createdAt_idx" ON "missions"("createdAt");

-- CreateIndex
CREATE INDEX "mission_submissions_missionId_idx" ON "mission_submissions"("missionId");

-- CreateIndex
CREATE INDEX "mission_submissions_submitterEmail_idx" ON "mission_submissions"("submitterEmail");

-- CreateIndex
CREATE INDEX "mission_submissions_status_idx" ON "mission_submissions"("status");

-- CreateIndex
CREATE UNIQUE INDEX "contributor_points_email_key" ON "contributor_points"("email");

-- CreateIndex
CREATE INDEX "contributor_points_totalPoints_idx" ON "contributor_points"("totalPoints");

-- CreateIndex
CREATE INDEX "story_tips_status_idx" ON "story_tips"("status");

-- CreateIndex
CREATE INDEX "story_tips_createdAt_idx" ON "story_tips"("createdAt");

-- CreateIndex
CREATE INDEX "tip_comments_tipId_idx" ON "tip_comments"("tipId");

-- CreateIndex
CREATE UNIQUE INDEX "investigations_tipId_key" ON "investigations"("tipId");

-- CreateIndex
CREATE INDEX "investigations_status_idx" ON "investigations"("status");

-- AddForeignKey
ALTER TABLE "missions" ADD CONSTRAINT "missions_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mission_submissions" ADD CONSTRAINT "mission_submissions_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "missions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mission_submissions" ADD CONSTRAINT "mission_submissions_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tip_comments" ADD CONSTRAINT "tip_comments_tipId_fkey" FOREIGN KEY ("tipId") REFERENCES "story_tips"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tip_comments" ADD CONSTRAINT "tip_comments_editorId_fkey" FOREIGN KEY ("editorId") REFERENCES "AdminUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "investigations" ADD CONSTRAINT "investigations_tipId_fkey" FOREIGN KEY ("tipId") REFERENCES "story_tips"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "investigations" ADD CONSTRAINT "investigations_leadEditorId_fkey" FOREIGN KEY ("leadEditorId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
