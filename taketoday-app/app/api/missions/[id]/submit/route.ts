import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { jsonOk, jsonError, captureApiError } from "@/lib/admin/api";
import { MissionStatus } from "@prisma/client";

const submitSchema = z.object({
  submitterEmail: z.string().email(),
  submitterName: z.string().max(100).optional(),
  submissionText: z.string().min(20, "Submission must be at least 20 characters"),
  attachments: z.array(z.string().url()).max(5).default([]),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const mission = await prisma.mission.findUnique({ where: { id } });
    if (!mission) return jsonError("Mission not found", 404);
    if (
      mission.status !== MissionStatus.OPEN &&
      mission.status !== MissionStatus.IN_PROGRESS
    ) {
      return jsonError("Mission is not accepting submissions", 400);
    }

    const body = await req.json();
    const parsed = submitSchema.safeParse(body);
    if (!parsed.success) return jsonError(parsed.error.errors[0]?.message ?? "Invalid input", 422);

    const { submitterEmail, submitterName, submissionText, attachments } = parsed.data;

    // Prevent duplicate pending submissions from same email
    const existing = await prisma.missionSubmission.findFirst({
      where: { missionId: id, submitterEmail, status: "PENDING" },
    });
    if (existing) return jsonError("You already have a pending submission for this mission", 409);

    const submission = await prisma.missionSubmission.create({
      data: {
        missionId: id,
        submitterEmail,
        submitterName,
        submissionText,
        attachments,
      },
    });

    // Auto-move mission to IN_PROGRESS if first submission
    if (mission.status === MissionStatus.OPEN) {
      await prisma.mission.update({
        where: { id },
        data: { status: MissionStatus.IN_PROGRESS },
      });
    }

    return jsonOk({ submission }, { status: 201 });
  } catch (err) {
    return captureApiError(err);
  }
}
