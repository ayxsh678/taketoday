-- Migration: consolidate ContributionStatus → WorkflowStage [BUG-17a]
-- Removes the redundant `status` column (ContributionStatus enum) from Contribution.
-- WorkflowStage is the single source of truth going forward.

-- Drop composite index on status + createdAt
DROP INDEX IF EXISTS "Contribution_status_createdAt_idx";

-- Drop the status column
ALTER TABLE "Contribution" DROP COLUMN IF EXISTS "status";

-- Drop the ContributionStatus enum type
DROP TYPE IF EXISTS "ContributionStatus";

-- Create the new composite index on workflowStage + createdAt
CREATE INDEX IF NOT EXISTS "Contribution_workflowStage_createdAt_idx" ON "Contribution"("workflowStage", "createdAt");
