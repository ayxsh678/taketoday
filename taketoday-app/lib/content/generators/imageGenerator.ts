import type { ContentGenerator, GenerationOptions, GenerationResult } from "./types";
import { proxyPost } from "./serviceProxy";
import { withRetry, DEFAULT_RETRY } from "./retry";
import { createContentJob, markRunning, markSucceeded, markFailed, markRetrying } from "./jobTracker";
import { pipelineLogger } from "./logger";
import { Prisma } from "@prisma/client";

export const imageGenerator: ContentGenerator = {
  format: "image_post",

  async generate(
    content: string,
    options?: GenerationOptions,
    existingJobId?: string,
  ): Promise<GenerationResult> {
    const opts = options?.image ?? {};
    const t0 = Date.now();

    const { id: jobId } = existingJobId
      ? { id: existingJobId }
      : await createContentJob("image_post");

    await markRunning(jobId);

    pipelineLogger.info({
      stage: "generate",
      format: "image_post",
      jobId,
      message: "Image generation started",
    });

    try {
      const data = await withRetry(
        () =>
          proxyPost<Record<string, unknown>, Record<string, unknown>>(
            "/generate-image",
            {
              prompt: content.slice(0, 500),
              style: opts.style ?? "social",
              aspectRatio: opts.aspectRatio ?? "1:1",
            },
          ),
        DEFAULT_RETRY,
        (err, attempt, nextDelayMs) => {
          pipelineLogger.warn({
            stage: "generate",
            format: "image_post",
            jobId,
            attempt,
            message: `Retrying after error: ${err instanceof Error ? err.message : String(err)}`,
            nextDelayMs,
          });
          void markRetrying(jobId, attempt);
        },
      );

      await markSucceeded(jobId, data as Prisma.InputJsonValue);

      pipelineLogger.info({
        stage: "generate",
        format: "image_post",
        jobId,
        durationMs: Date.now() - t0,
        message: "Image generation succeeded",
      });

      return { ok: true, format: "image_post", data, jobId };
    } catch (err) {
      const error = err instanceof Error ? err.message : "Image generation failed";

      await markFailed(jobId, error);

      pipelineLogger.error({
        stage: "generate",
        format: "image_post",
        jobId,
        durationMs: Date.now() - t0,
        message: error,
      });

      return { ok: false, format: "image_post", error, jobId };
    }
  },
};
