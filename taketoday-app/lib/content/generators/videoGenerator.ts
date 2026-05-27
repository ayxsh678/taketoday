import { JobStatus } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import type { ContentGenerator, GenerationOptions, GenerationResult } from "./types";
import { proxyPost } from "./serviceProxy";
import { withRetry, DEFAULT_RETRY } from "./retry";
import { createContentJob, markRunning, markSucceeded, markFailed, markRetrying } from "./jobTracker";
import { pipelineLogger } from "./logger";
import { Prisma } from "@prisma/client";

export const videoGenerator: ContentGenerator = {
  format: "video_reel",

  async generate(
    content: string,
    options?: GenerationOptions,
    existingJobId?: string,
  ): Promise<GenerationResult> {
    const opts = options?.video ?? {};
    const t0 = Date.now();

    // Track in Job table (standardised) AND ShortVideoJob (domain record)
    const { id: jobId } = existingJobId
      ? { id: existingJobId }
      : await createContentJob("video_reel");

    const shortJob = await prisma.shortVideoJob.create({
      data: {
        script: content.slice(0, 2000),
        voiceProvider: opts.voiceProvider ?? null,
        avatarProvider: opts.avatarProvider ?? null,
        status: JobStatus.RUNNING,
      },
      select: { id: true },
    });

    await markRunning(jobId);

    pipelineLogger.info({
      stage: "generate",
      format: "video_reel",
      jobId,
      shortJobId: shortJob.id,
      message: "Video generation started",
    });

    try {
      const data = await withRetry(
        () =>
          proxyPost<Record<string, unknown>, Record<string, unknown>>(
            "/generate-video",
            {
              script: content.slice(0, 2000),
              type: opts.type ?? "reel",
              duration: opts.duration ?? 60,
              voiceProvider: opts.voiceProvider,
              avatarProvider: opts.avatarProvider,
            },
          ),
        DEFAULT_RETRY,
        (err, attempt, nextDelayMs) => {
          pipelineLogger.warn({
            stage: "generate",
            format: "video_reel",
            jobId,
            attempt,
            message: `Retrying after error: ${err instanceof Error ? err.message : String(err)}`,
            nextDelayMs,
          });
          void markRetrying(jobId, attempt);
          void prisma.shortVideoJob.update({
            where: { id: shortJob.id },
            data: { status: JobStatus.QUEUED },
          });
        },
      );

      await Promise.all([
        markSucceeded(jobId, data as Prisma.InputJsonValue),
        prisma.shortVideoJob.update({
          where: { id: shortJob.id },
          data: { status: JobStatus.SUCCEEDED },
        }),
      ]);

      pipelineLogger.info({
        stage: "generate",
        format: "video_reel",
        jobId,
        durationMs: Date.now() - t0,
        message: "Video generation succeeded",
      });

      return { ok: true, format: "video_reel", data, jobId };
    } catch (err) {
      const error = err instanceof Error ? err.message : "Video generation failed";

      await Promise.all([
        markFailed(jobId, error),
        prisma.shortVideoJob.update({
          where: { id: shortJob.id },
          data: { status: JobStatus.FAILED },
        }),
      ]);

      pipelineLogger.error({
        stage: "generate",
        format: "video_reel",
        jobId,
        durationMs: Date.now() - t0,
        message: error,
      });

      return { ok: false, format: "video_reel", error, jobId };
    }
  },
};
