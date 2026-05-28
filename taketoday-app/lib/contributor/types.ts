import type { ContributorRole, ContributionStatus, WorkflowStage, ReputationTier } from "@prisma/client";

export type { ContributorRole, ContributionStatus, WorkflowStage, ReputationTier };

export type ContributorPermission =
  | "contribution:create"
  | "contribution:read"
  | "contribution:edit:own"
  | "contribution:edit:any"
  | "contribution:submit"
  | "contribution:fork"
  | "contribution:collaborate"
  | "evidence:upload"
  | "citation:add"
  | "factcheck:submit"
  | "factcheck:review"
  | "community:vote"
  | "community:note"
  | "investigation:view"
  | "investigation:join"
  | "investigation:create"
  | "investigation:lead"
  | "profile:edit:own"
  | "profile:view:any";

export interface ContributorSession {
  user: {
    id: string;
    email: string;
    username: string;
    displayName: string;
    avatar?: string | null;
    role: ContributorRole;
    reputationTier: ReputationTier;
    reputationScore: number;
    isVerifiedJournalist: boolean;
    suspendedAt?: Date | null;
  };
}

// Workflow state machine — valid transitions
export const WORKFLOW_TRANSITIONS: Record<WorkflowStage, WorkflowStage[]> = {
  DRAFT: ["SUBMITTED"],
  SUBMITTED: ["UNDER_RESEARCH", "EDITOR_REVIEW", "REJECTED"],
  UNDER_RESEARCH: ["FACT_CHECK_PENDING", "EDITOR_REVIEW", "REJECTED"],
  FACT_CHECK_PENDING: ["VERIFIED", "DISPUTED", "EDITOR_REVIEW"],
  VERIFIED: ["EDITOR_REVIEW"],
  EDITOR_REVIEW: ["APPROVED", "REQUEST_CHANGES" as WorkflowStage, "REJECTED"],
  APPROVED: ["PUBLISHED", "ARCHIVED"],
  PUBLISHED: ["ARCHIVED", "DISPUTED"],
  ARCHIVED: [],
  DISPUTED: ["UNDER_RESEARCH", "REJECTED", "PUBLISHED"],
  REJECTED: [],
};

// Reputation tier score thresholds
export const REPUTATION_THRESHOLDS: Record<ReputationTier, number> = {
  NEWCOMER: 0,
  CONTRIBUTOR: 100,
  TRUSTED: 500,
  VERIFIED: 1500,
  EXPERT: 3000,
  STAFF: Infinity,
};

export type WorkflowStageLabel = {
  label: string;
  description: string;
  color: string;
};

export const WORKFLOW_STAGE_META: Record<WorkflowStage, WorkflowStageLabel> = {
  DRAFT: { label: "Draft", description: "Work in progress", color: "gray" },
  SUBMITTED: { label: "Submitted", description: "Awaiting editorial triage", color: "blue" },
  UNDER_RESEARCH: { label: "Under Research", description: "Being researched/verified", color: "yellow" },
  FACT_CHECK_PENDING: { label: "Fact Check Pending", description: "Assigned to fact-checkers", color: "orange" },
  VERIFIED: { label: "Verified", description: "Fact-checked and verified", color: "green" },
  EDITOR_REVIEW: { label: "Editor Review", description: "With editorial team", color: "purple" },
  APPROVED: { label: "Approved", description: "Approved, awaiting publish", color: "teal" },
  PUBLISHED: { label: "Published", description: "Live on platform", color: "emerald" },
  ARCHIVED: { label: "Archived", description: "No longer active", color: "stone" },
  DISPUTED: { label: "Disputed", description: "Credibility challenged", color: "red" },
  REJECTED: { label: "Rejected", description: "Not suitable for publication", color: "red" },
};
