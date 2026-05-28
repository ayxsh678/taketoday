/**
 * Central execution engine for the multi-provider AI orchestration system.
 * Handles provider resolution, fallback chains, cost tracking, and analytics.
 */

import { resolveProviderChain, selectProvider } from "./router";
import { estimateCost } from "../config/models";
import { aiLogger } from "./logger";
import { trackUsage } from "../analytics/tracker";
import type {
  AITaskRequest,
  AITaskResult,
  AIProviderSlug,
} from "./types";
import { AIProviderError } from "./types";

export class AIOrchestrator {
  async execute(request: AITaskRequest): Promise<AITaskResult> {
    const startTime = Date.now();

    const chain = await resolveProviderChain(request.type, {
      forceProvider: request.forceProvider,
      forceModel: request.forceModel,
    });

    if (chain.length === 0) {
      throw new AIProviderError(
        `No routes configured for task type: ${request.type}`,
        "unknown",
        "unknown",
        false
      );
    }

    let attemptCount = 0;
    let lastError: AIProviderError | null = null;

    for (const route of chain) {
      const provider = selectProvider(route);

      if (!provider) {
        aiLogger.warn(`Provider unavailable, skipping`, {
          provider: route.provider as AIProviderSlug,
          taskType: request.type,
          metadata: { model: route.model },
        });
        continue;
      }

      attemptCount++;
      const attemptStart = Date.now();

      try {
        const response = await provider.generate({
          prompt: request.prompt,
          systemPrompt: request.systemPrompt,
          model: route.model,
          maxTokens: request.maxTokens,
          temperature: request.temperature,
          jsonMode: request.jsonMode,
        });

        const latencyMs = Date.now() - attemptStart;
        const estimatedCostUsd = estimateCost(
          response.model,
          response.inputTokens,
          response.outputTokens
        );

        const result: AITaskResult = {
          text: response.text,
          provider: provider.slug,
          model: response.model,
          usage: {
            inputTokens: response.inputTokens,
            outputTokens: response.outputTokens,
            totalTokens: response.totalTokens,
            estimatedCostUsd,
          },
          latencyMs,
          taskType: request.type,
          attemptCount,
          fromFallback: attemptCount > 1,
        };

        aiLogger.info("AI task completed", {
          taskType: request.type,
          provider: provider.slug,
          model: response.model,
          latencyMs,
          tokens: {
            input: response.inputTokens,
            output: response.outputTokens,
            total: response.totalTokens,
          },
          cost: estimatedCostUsd,
        });

        // Fire-and-forget analytics
        trackUsage({
          taskType: request.type,
          provider: provider.slug,
          model: response.model,
          inputTokens: response.inputTokens,
          outputTokens: response.outputTokens,
          costUsd: estimatedCostUsd,
          latencyMs,
          success: true,
          metadata: request.metadata,
        }).catch(() => {});

        return result;
      } catch (err) {
        const latencyMs = Date.now() - attemptStart;

        if (err instanceof AIProviderError) {
          lastError = err;

          const logContext = {
            taskType: request.type,
            provider: provider.slug,
            model: route.model,
            latencyMs,
            error: err.message,
            metadata: { code: err.code, retryable: err.retryable },
          };

          if (err.retryable) {
            aiLogger.warn(
              `Provider error (retryable), trying next in chain`,
              logContext
            );
          } else {
            aiLogger.error(
              `Provider error (non-retryable), trying next in chain`,
              logContext
            );
          }

          // Fire-and-forget failure tracking
          trackUsage({
            taskType: request.type,
            provider: provider.slug,
            model: route.model,
            inputTokens: 0,
            outputTokens: 0,
            latencyMs,
            success: false,
            error: err.message,
            metadata: request.metadata,
          }).catch(() => {});

          // Continue to next provider regardless of retryable flag
          continue;
        }

        // Unexpected (non-AIProviderError) — wrap and continue
        const wrapped = new AIProviderError(
          err instanceof Error ? err.message : String(err),
          provider.slug,
          "unknown",
          false
        );
        lastError = wrapped;

        aiLogger.error("Unexpected error from provider", {
          taskType: request.type,
          provider: provider.slug,
          model: route.model,
          latencyMs,
          error: wrapped.message,
        });

        trackUsage({
          taskType: request.type,
          provider: provider.slug,
          model: route.model,
          inputTokens: 0,
          outputTokens: 0,
          latencyMs,
          success: false,
          error: wrapped.message,
          metadata: request.metadata,
        }).catch(() => {});

        continue;
      }
    }

    // All providers exhausted
    const totalLatencyMs = Date.now() - startTime;
    const errorMessage =
      lastError?.message ??
      `All providers failed for task type: ${request.type}`;

    aiLogger.error("All providers exhausted", {
      taskType: request.type,
      latencyMs: totalLatencyMs,
      error: errorMessage,
    });

    throw (
      lastError ??
      new AIProviderError(
        `All providers failed for task type: ${request.type}`,
        "unknown",
        "unknown",
        false
      )
    );
  }
}

export const orchestrator = new AIOrchestrator();

export async function ai(request: AITaskRequest): Promise<AITaskResult> {
  return orchestrator.execute(request);
}
