/**
 * Main entry point for the AI orchestration system.
 * Provides backward-compatible exports alongside the new multi-provider API.
 */

// ─── Core exports ──────────────────────────────────────────────────────────────
export * from "./core/types";
export * from "./core/logger";
export { orchestrator, ai } from "./core/orchestrator";
export { resolveProviderChain, selectProvider } from "./core/router";

// ─── Config exports ────────────────────────────────────────────────────────────
export { MODEL_REGISTRY, getModelSpec, estimateCost } from "./config/models";
export { DEFAULT_ROUTES } from "./config/routes";

// ─── Provider exports ──────────────────────────────────────────────────────────
export { OpenAICompatProvider } from "./providers/openai-compat";
export { GeminiAdapter } from "./providers/gemini";
export {
  providerRegistry,
  getProvider,
  getAvailableProviders,
} from "./providers/registry";

// ─── Task exports ──────────────────────────────────────────────────────────────
export * from "./tasks/index";

// ─── Analytics exports ─────────────────────────────────────────────────────────
export {
  trackUsage,
  getUsageStats,
  getDailyUsage,
} from "./analytics/tracker";
export type {
  AIUsageEvent,
  AIUsageStats,
  DailyUsageStat,
} from "./analytics/tracker";

// ─── Legacy exports (backward compatibility) ───────────────────────────────────
// Keep the old types for any code that imports them from "@/lib/ai"
export type { AIRequestOptions, AIResponse, AIProvider } from "./provider";
export { AIError } from "./provider";
export { GeminiProvider } from "./gemini";
export { validateAIConfig, getGeminiApiKey } from "./config";
export { z } from "./types";
export { retryWithBackoff, estimateTokens } from "./utils";

/**
 * Legacy getAIProvider() — returns a thin adapter around the new orchestrator.
 * Existing callers (ai-pipeline.ts, translation.ts, admin/ai/route.ts) continue to work.
 */
import type { AIProvider, AIRequestOptions, AIResponse } from "./provider";
import { orchestrator } from "./core/orchestrator";
import type { AITaskType } from "./core/types";
import { z } from "zod";

class OrchestratorAdapter implements AIProvider {
  readonly name = "orchestrator";

  async generateText(
    prompt: string,
    options: AIRequestOptions = {}
  ): Promise<AIResponse> {
    // Map legacy options to the new request format
    // Default task type for legacy usage is ANALYSIS
    const taskType: AITaskType = "ANALYSIS";

    const result = await orchestrator.execute({
      type: taskType,
      prompt,
      systemPrompt: options.systemInstruction,
      maxTokens: options.maxTokens,
      temperature: options.temperature,
      jsonMode: options.responseMimeType === "application/json",
    });

    return {
      text: result.text,
      usage: {
        promptTokens: result.usage.inputTokens,
        completionTokens: result.usage.outputTokens,
        totalTokens: result.usage.totalTokens,
      },
    };
  }

  async generateStructured<T>(
    prompt: string,
    schema: z.ZodType<T>,
    options: AIRequestOptions = {}
  ): Promise<T> {
    const result = await orchestrator.execute({
      type: "ANALYSIS",
      prompt,
      systemPrompt: options.systemInstruction,
      maxTokens: options.maxTokens,
      temperature: options.temperature,
      jsonMode: true,
    });

    let cleaned = result.text.trim();
    if (cleaned.startsWith("```json")) cleaned = cleaned.slice(7);
    else if (cleaned.startsWith("```")) cleaned = cleaned.slice(3);
    if (cleaned.endsWith("```")) cleaned = cleaned.slice(0, -3);

    const parsed = JSON.parse(cleaned.trim());
    const validated = schema.safeParse(parsed);
    if (!validated.success) {
      throw new Error(
        `Failed to parse structured output: ${validated.error.message}`
      );
    }
    return validated.data;
  }

  async *streamText(
    prompt: string,
    options: AIRequestOptions = {}
  ): AsyncIterable<string> {
    // Fall back to non-streaming (generate full then yield)
    const result = await this.generateText(prompt, options);
    yield result.text;
  }
}

let adapterInstance: OrchestratorAdapter | null = null;

export function getAIProvider(): AIProvider {
  if (!adapterInstance) {
    adapterInstance = new OrchestratorAdapter();
  }
  return adapterInstance;
}
