import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/admin/authz";
import { jsonOk, jsonError, captureApiError } from "@/lib/admin/api";
import { logAuditAction } from "@/lib/admin/audit";
import { getOrCreateAdminUser } from "@/lib/admin/current-user";
import { SubmissionStatus } from "@prisma/client";
import { BONUS_OPTIONS } from "@/lib/missions";

const reviewSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
  reviewNotes: z.string().max(2000).optional(),
  bonusPoints: z.number().refine((n) => (BONUS_OPTIONS as readonly number[]).includes(n) || n === 0, {
    message: "Invalid bonus amount",
  }).default(0),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const access = await requireAdmin("content:write");
  if (!access.ok) return access.response;

  try {
    const { id } = await params;
    const submission = await prisma.missionSubmission.findUnique({
      where: { id },
      include: { mission: true },
    });
    if (!submission) return jsonError("Submission not found", 404);
    if (submission.status !== SubmissionStatus.PENDING) {
      return jsonError("Submission already reviewed", 409);
    }

    const body = await req.json();
    const parsed = reviewSchema.safeParse(body);
    if (!parsed.success) return jsonError(parsed.error.errors[0]?.message ?? "Invalid input", 422);

    const admin = await getOrCreateAdminUser(access.session);
    const { status, reviewNotes, bonusPoints } = parsed.data;

    const updated = await prisma.missionSubmission.update({
      where: { id },
      data: {
        status: status as SubmissionStatus,
        reviewNotes,
        bonusPoints,
        reviewedAt: new Date(),
        reviewedById: admin?.id,
      },
    });

    // Award points if approved
    if (status === "APPROVED") {
      const basePoints = submission.mission.pointsReward;
      const totalAwarded = basePoints + bonusPoints;

      await prisma.contributorPoints.upsert({
        where: { email: submission.submitterEmail },
        create: {
          email: submission.submitterEmail,
          name: submission.submitterName ?? undefined,
          totalPoints: totalAwarded,
          missionsCompleted: 1,
        },
        update: {
          totalPoints: { increment: totalAwarded },
          missionsCompleted: { increment: 1 },
          name: submission.submitterName ?? undefined,
        },
      });

      // Close mission if completed
      await prisma.mission.update({
        where: { id: submission.missionId },
        data: { status: "COMPLETED" },
      });
    }

    await logAuditAction({
      action: `SUBMISSION_${status}`,
      entity: "MissionSubmission",
      entityId: id,
      after: { status, bonusPoints, submitterEmail: submission.submitterEmail },
    });

    return jsonOk({ submission: updated });
  } catch (err) {
    return captureApiError(err);
  }
}
