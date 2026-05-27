import type {
  ContentFormat,
  ContentGenerator,
  GenerationResult,
  PipelineRequest,
  PipelineResponse,
} from "./types";
import { articleGenerator } from "./articleGenerator";
import { imageGenerator } from "./imageGenerator";
import { videoGenerator } from "./videoGenerator";
import { carouselGenerator } from "./carouselGenerator";
import { pipelineSemaphore } from "./semaphore";
import { createContentJob } from "./jobTracker";
import { cleanupOrphanContentJobs } from "./jobTracker";
import { pipelineLogger } from "./logger";

// ─── Generator registry (strategy pattern) ───────────────────────────────────
// Add new formats here — no touching pipeline logic.

const REGISTRY: Record<ContentFormat, ContentGenerator> = {
  article: articleGenerator,
  image_post: imageGenerator,
  video_reel: videoGenerator,
  carousel: carouselGenerator as ContentGenerator,
};

// ─── One-time orphan cleanup on first pipeline boot ───────────────────────────

let orphanCleanupDone = false;

async function maybeCleanupOrphans(): Promise<void> {
  if (orphanCleanupDone) return;
  orphanCleanupDone = true;
  try {
    const cleaned = await cleanupOrphanContentJobs();
    if (cleaned > 0) {
      pipelineLogger.warn({
        stage: "startup",
        message: `Cleaned up ${cleaned} orphaned content jobs`,
        cleaned,
      });
    }
  } catch (err) {
    pipelineLogger.error({
      stage: "startup",
      message: `Orphan cleanup failed: ${err instanceof Error ? err.message : String(err)}`,
    });
  }
}

// ─── Orchestrator ─────────────────────────────────────────────────────────────

export async function runContentPipeline(
  request: PipelineRequest,
): Promise<PipelineResponse> {
  await maybeCleanupOrphans();

  const t0 = Date.now();

  pipelineLogger.info({
    stage: "pipeline",
    message: "Pipeline started",
    formats: request.formats,
    hasIdempotencyKey: Boolean(request.idempotencyKey),
  });

  const settled = await Promise.allSettled(
    request.formats.map(async (format) => {
      const generator = REGISTRY[format];
      if (!generator) {
        return Promise.resolve<GenerationResult>({
          ok: false,
          format,
          error: `No generator registered for format: ${format}`,
        });
      }

      // Pre-allocate job with idempotency key so parallel runs don't duplicate
      let preAllocatedJobId: string | undefined;
      if (request.idempotencyKey) {
        const idempotencyKey = `${request.idempotencyKey}:${format}`;
        const tracked = await createContentJob(format, undefined, idempotencyKey);
        if (tracked.reused) {
          pipelineLogger.info({
            stage: "pipeline",
            format,
            message: "Reusing existing job (idempotency hit)",
            jobId: tracked.id,
          });
          // Return PENDING result — caller can poll for completion
          return {
            ok: true,
            format,
            data: null,
            jobId: tracked.id,
          } as GenerationResult;
        }
        preAllocatedJobId = tracked.id;
      }

      return pipelineSemaphore.run(() =>
        generator.generate(request.content, request.options, preAllocatedJobId),
      );
    }),
  );

  const results: GenerationResult[] = settled.map((r, i) => {
    if (r.status === "fulfilled") return r.value;
    return {
      ok: false as const,
      format: request.formats[i],
      error:
        r.reason instanceof Error ? r.reason.message : "Generator threw unexpectedly",
    };
  });

  const succeeded = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok).length;

  pipelineLogger.info({
    stage: "pipeline",
    message: "Pipeline completed",
    durationMs: Date.now() - t0,
    succeeded,
    failed,
  });

  return { results, succeeded, failed };
}

// ─── Format bundles ───────────────────────────────────────────────────────────
// Pre-defined bundles shown in admin UI.

export const FORMAT_BUNDLES: Record<string, { label: string; formats: ContentFormat[] }> = {
  article_only: {
    label: "Article only",
    formats: ["article"],
  },
  article_image: {
    label: "Article + Image",
    formats: ["article", "image_post"],
  },
  article_video: {
    label: "Article + Video",
    formats: ["article", "video_reel"],
  },
  article_carousel: {
    label: "Article + Carousel",
    formats: ["article", "carousel"],
  },
  all_formats: {
    label: "Article + All formats",
    formats: ["article", "image_post", "video_reel", "carousel"],
  },
};
