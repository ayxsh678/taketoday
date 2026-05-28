import type { ModelSpec } from "../core/types";

export const MODEL_REGISTRY: Record<string, ModelSpec> = {
  // ─── OpenAI ────────────────────────────────────────────────────────────────
  "gpt-4.1": {
    id: "gpt-4.1",
    provider: "openai",
    contextLength: 1047576,
    inputCostPer1M: 2.0,
    outputCostPer1M: 8.0,
    supportsJson: true,
    supportsStreaming: true,
    avgLatencyMs: 3000,
    tier: "premium",
    tags: ["reasoning", "long-context", "structured-output"],
  },
  "gpt-4.1-mini": {
    id: "gpt-4.1-mini",
    provider: "openai",
    contextLength: 1047576,
    inputCostPer1M: 0.4,
    outputCostPer1M: 1.6,
    supportsJson: true,
    supportsStreaming: true,
    avgLatencyMs: 1500,
    tier: "standard",
    tags: ["fast", "structured-output"],
  },
  "gpt-4o-mini": {
    id: "gpt-4o-mini",
    provider: "openai",
    contextLength: 128000,
    inputCostPer1M: 0.15,
    outputCostPer1M: 0.6,
    supportsJson: true,
    supportsStreaming: true,
    avgLatencyMs: 1200,
    tier: "standard",
    tags: ["fast", "cheap", "structured-output"],
  },
  "gpt-4o": {
    id: "gpt-4o",
    provider: "openai",
    contextLength: 128000,
    inputCostPer1M: 2.5,
    outputCostPer1M: 10.0,
    supportsJson: true,
    supportsStreaming: true,
    avgLatencyMs: 2500,
    tier: "premium",
    tags: ["multimodal", "reasoning", "structured-output"],
  },

  // ─── Gemini ─────────────────────────────────────────────────────────────────
  "gemini-2.5-pro": {
    id: "gemini-2.5-pro",
    provider: "gemini",
    contextLength: 2000000,
    inputCostPer1M: 1.25,
    outputCostPer1M: 10.0,
    supportsJson: true,
    supportsStreaming: true,
    avgLatencyMs: 4000,
    tier: "premium",
    tags: ["long-context", "reasoning", "multimodal"],
  },
  "gemini-2.0-flash": {
    id: "gemini-2.0-flash",
    provider: "gemini",
    contextLength: 1000000,
    inputCostPer1M: 0.1,
    outputCostPer1M: 0.4,
    supportsJson: true,
    supportsStreaming: true,
    avgLatencyMs: 800,
    tier: "standard",
    tags: ["fast", "cheap", "multimodal"],
  },
  "gemini-2.0-flash-lite": {
    id: "gemini-2.0-flash-lite",
    provider: "gemini",
    contextLength: 1000000,
    inputCostPer1M: 0.075,
    outputCostPer1M: 0.3,
    supportsJson: true,
    supportsStreaming: true,
    avgLatencyMs: 600,
    tier: "budget",
    tags: ["ultra-fast", "cheapest"],
  },

  // ─── Groq ───────────────────────────────────────────────────────────────────
  "llama-3.3-70b-versatile": {
    id: "llama-3.3-70b-versatile",
    provider: "groq",
    contextLength: 128000,
    inputCostPer1M: 0.59,
    outputCostPer1M: 0.79,
    supportsJson: true,
    supportsStreaming: true,
    avgLatencyMs: 400,
    tier: "standard",
    tags: ["ultra-fast", "open-source", "groq-inference"],
  },
  "llama-3.1-8b-instant": {
    id: "llama-3.1-8b-instant",
    provider: "groq",
    contextLength: 128000,
    inputCostPer1M: 0.05,
    outputCostPer1M: 0.08,
    supportsJson: true,
    supportsStreaming: true,
    avgLatencyMs: 150,
    tier: "budget",
    tags: ["ultra-fast", "cheapest", "groq-inference"],
  },
  "llama-3.1-70b-versatile": {
    id: "llama-3.1-70b-versatile",
    provider: "groq",
    contextLength: 128000,
    inputCostPer1M: 0.59,
    outputCostPer1M: 0.79,
    supportsJson: true,
    supportsStreaming: true,
    avgLatencyMs: 450,
    tier: "standard",
    tags: ["fast", "open-source", "groq-inference"],
  },

  // ─── OpenRouter ─────────────────────────────────────────────────────────────
  "meta-llama/llama-3.3-70b-instruct": {
    id: "meta-llama/llama-3.3-70b-instruct",
    provider: "openrouter",
    contextLength: 128000,
    inputCostPer1M: 0.12,
    outputCostPer1M: 0.3,
    supportsJson: true,
    supportsStreaming: true,
    avgLatencyMs: 1200,
    tier: "standard",
    tags: ["open-source", "versatile", "fallback"],
  },
  "mistralai/mistral-nemo": {
    id: "mistralai/mistral-nemo",
    provider: "openrouter",
    contextLength: 128000,
    inputCostPer1M: 0.035,
    outputCostPer1M: 0.08,
    supportsJson: true,
    supportsStreaming: true,
    avgLatencyMs: 900,
    tier: "budget",
    tags: ["cheap", "multilingual", "fallback"],
  },
  "google/gemini-flash-1.5": {
    id: "google/gemini-flash-1.5",
    provider: "openrouter",
    contextLength: 1000000,
    inputCostPer1M: 0.075,
    outputCostPer1M: 0.3,
    supportsJson: true,
    supportsStreaming: true,
    avgLatencyMs: 700,
    tier: "budget",
    tags: ["fast", "cheap", "fallback"],
  },
};

export function getModelSpec(modelId: string): ModelSpec | undefined {
  return MODEL_REGISTRY[modelId];
}

export function estimateCost(
  modelId: string,
  inputTokens: number,
  outputTokens: number,
): number {
  const spec = MODEL_REGISTRY[modelId];
  if (!spec) return 0;
  return (
    (inputTokens / 1_000_000) * spec.inputCostPer1M +
    (outputTokens / 1_000_000) * spec.outputCostPer1M
  );
}
