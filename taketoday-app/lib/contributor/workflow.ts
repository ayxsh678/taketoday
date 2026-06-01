import type { WorkflowStage } from "./types";
import { WORKFLOW_TRANSITIONS } from "./types";
import { prisma } from "@/lib/db/prisma";
import type { TransparencyAction } from "@prisma/client";
import type { InputJsonObject } from "@prisma/client/runtime/library";

export function canTransition(from: WorkflowStage, to: WorkflowStage): boolean {
  return WORKFLOW_TRANSITIONS[from].includes(to);
}

interface TransitionOptions {
  contributionId: string;
  from: WorkflowStage;
  to: WorkflowStage;
  actorId: string;
  actorType: "PublicUser" | "AdminUser" | "System";
  reason?: string;
}

export async function transitionWorkflow({
  contributionId,
  from,
  to,
  actorId,
  actorType,
  reason,
}: TransitionOptions): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!canTransition(from, to)) {
    return { ok: false, error: `Invalid transition: ${from} → ${to}` };
  }

  const actionMap: Partial<Record<WorkflowStage, TransparencyAction>> = {
    SUBMITTED: "SUBMITTED",
    PUBLISHED: "PUBLISHED",
    ARCHIVED: "ARCHIVED",
    DISPUTED: "DISPUTED",
  };

  await prisma.$transaction([
    prisma.contribution.update({
      where: { id: contributionId },
      data: {
        workflowStage: to,
        publishedAt: to === "PUBLISHED" ? new Date() : undefined,
      },
    }),
    prisma.transparencyLog.create({
      data: {
        contributionId,
        action: actionMap[to] ?? "WORKFLOW_CHANGED",
        actorId,
        actorType,
        description: reason ?? `Moved from ${from} to ${to}`,
        metadata: { from, to } as InputJsonObject,
      },
    }),
  ]);

  return { ok: true };
}

export async function logTransparencyEvent(
  contributionId: string,
  action: TransparencyAction,
  actorId: string,
  actorType: string,
  description: string,
  metadata?: InputJsonObject,
) {
  return prisma.transparencyLog.create({
    data: {
      contributionId,
      action,
      actorId,
      actorType,
      description,
      metadata,
    },
  });
}
