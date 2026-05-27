// ─── Unified content job state machine ────────────────────────────────────────
// State transitions:
//   PENDING → RUNNING → SUCCEEDED
//   PENDING → RUNNING → RETRYING → RUNNING → SUCCEEDED
//   PENDING → RUNNING → FAILED
//   PENDING → CANCELLED  (before execution starts)
//
// Job type convention: "content:<format>[:<subtype>]"
//   e.g. "content:article", "content:carousel:instagram"

import { JobStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import type { ContentFormat } from "./types";

export interface TrackedJob {
  id: string;
  /** true when an existing non-failed job was returned for the same idempotency key */
  reused: boolean;
}

// ─── Create ───────────────────────────────────────────────────────────────────

export async function createContentJob(
  format: ContentFormat,
  subtype?: string,
  idempotencyKey?: string,
): Promise<TrackedJob> {
  if (idempotencyKey) {
    const existing = await prisma.job.findUnique({
      where: { idempotencyKey },
      select: { id: true, status: true },
    });
    if (
      existing &&
      existing.status !== JobStatus.FAILED &&
      existing.status !== JobStatus.CANCELLED
    ) {
      return { id: existing.id, reused: true };
    }
  }

  const type = subtype ? `content:${format}:${subtype}` : `content:${format}`;
  const job = await prisma.job.create({
    data: {
      type,
      status: JobStatus.PENDING,
      idempotencyKey: idempotencyKey ?? null,
    },
    select: { id: true },
  });

  return { id: job.id, reused: false };
}

// ─── Transitions ──────────────────────────────────────────────────────────────

export async function markRunning(jobId: string): Promise<void> {
  await prisma.job.update({
    where: { id: jobId },
    data: { status: JobStatus.RUNNING, startedAt: new Date() },
  });
}

export async function markRetrying(jobId: string, attempt: number): Promise<void> {
  await prisma.job.update({
    where: { id: jobId },
    data: { status: JobStatus.RETRYING, retryCount: attempt },
  });
}

export async function markSucceeded(
  jobId: string,
  result: Prisma.InputJsonValue,
): Promise<void> {
  await prisma.job.update({
    where: { id: jobId },
    data: {
      status: JobStatus.SUCCEEDED,
      completedAt: new Date(),
      result,
    },
  });
}

export async function markFailed(
  jobId: string,
  error: string,
  retryCount?: number,
): Promise<void> {
  await prisma.job.update({
    where: { id: jobId },
    data: {
      status: JobStatus.FAILED,
      completedAt: new Date(),
      error,
      ...(retryCount !== undefined ? { retryCount } : {}),
    },
  });
}

export async function markCancelled(jobId: string): Promise<void> {
  await prisma.job.update({
    where: { id: jobId },
    data: { status: JobStatus.CANCELLED, completedAt: new Date() },
  });
}

// ─── Orphan cleanup ───────────────────────────────────────────────────────────

/**
 * Marks any RUNNING content jobs older than `staleAfterMs` as FAILED.
 * Run once on pipeline boot to recover from crashed instances.
 * Returns number of jobs cleaned up.
 */
export async function cleanupOrphanContentJobs(
  staleAfterMs = 15 * 60 * 1000,
): Promise<number> {
  const cutoff = new Date(Date.now() - staleAfterMs);
  const { count } = await prisma.job.updateMany({
    where: {
      type: { startsWith: "content:" },
      status: JobStatus.RUNNING,
      startedAt: { lt: cutoff },
    },
    data: {
      status: JobStatus.FAILED,
      completedAt: new Date(),
      error: "Orphaned: exceeded maximum run time. Cleaned up on restart.",
    },
  });
  return count;
}

// ─── Query helpers ────────────────────────────────────────────────────────────

export async function getRecentContentJobs(limitHours = 24) {
  const since = new Date(Date.now() - limitHours * 60 * 60 * 1000);
  return prisma.job.findMany({
    where: {
      type: { startsWith: "content:" },
      createdAt: { gte: since },
    },
    select: {
      id: true,
      type: true,
      status: true,
      retryCount: true,
      startedAt: true,
      completedAt: true,
      error: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}
