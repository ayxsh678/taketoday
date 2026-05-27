import type { ContentGenerator, GenerationOptions, GenerationResult } from "./types";
import { proxyPost } from "./serviceProxy";
import { withRetry, DEFAULT_RETRY } from "./retry";
import { createContentJob, markRunning, markSucceeded, markFailed, markRetrying } from "./jobTracker";
import { pipelineLogger } from "./logger";
import { Prisma } from "@prisma/client";

export const articleGenerator: ContentGenerator = {
  format: "article",

  async generate(
    content: string,
    options?: GenerationOptions,
    existingJobId?: string,
  ): Promise<GenerationResult> {
    const opts = options?.article ?? {};
    const t0 = Date.now();

    const { id: jobId } = existingJobId
      ? { id: existingJobId }
      : await createContentJob("article");

    await markRunning(jobId);

    pipelineLogger.info({
      stage: "generate",
      format: "article",
      jobId,
      message: "Article generation started",
    });

    try {
      const data = await withRetry(
        () =>
          proxyPost<Record<string, unknown>, Record<string, unknown>>(
            "/generate-article",
            {
              topic: content.slice(0, 1000),
              category: opts.category,
              region: opts.region,
              tone: opts.tone,
              length: opts.length ?? "medium",
            },
          ),
        DEFAULT_RETRY,
        (err, attempt, nextDelayMs) => {
          pipelineLogger.warn({
            stage: "generate",
            format: "article",
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
        format: "article",
        jobId,
        durationMs: Date.now() - t0,
        message: "Article generation succeeded",
      });

      return { ok: true, format: "article", data, jobId };
    } catch (err) {
      const error = err instanceof Error ? err.message : "Article generation failed";

      await markFailed(jobId, error);

      pipelineLogger.error({
        stage: "generate",
        format: "article",
        jobId,
        durationMs: Date.now() - t0,
        message: error,
      });

      return { ok: false, format: "article", error, jobId };
    }
  },
};
