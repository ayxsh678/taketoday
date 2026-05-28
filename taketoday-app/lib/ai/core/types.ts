/**
 * Core type system for the multi-provider AI orchestration system.
 */

// ─── Task Types ───────────────────────────────────────────────────────────────

export const AI_TASK_TYPES = [
  "ARTICLE_GENERATION",
  "CAROUSEL_GENERATION",
  "SHORT_VIDEO_SCRIPT",
  "SOCIAL_CAPTION",
  "HEADLINE_VARIANTS",
  "SEO_METADATA",
  "SUMMARIZATION",
  "REWRITE",
  "DISTRIBUTION_POST",
  "FACT_CHECK",
  "TRANSLATION",
  "ANALYSIS",
] as const;

export type AITaskType = (typeof AI_TASK_TYPES)[number];

// ─── Provider Slugs ────────────────────────────────────────────────────────────

export type AIProviderSlug = "openai" | "gemini" | "groq" | "openrouter";

// ─── Routing ──────────────────────────────────────────────────────────────────

export interface ProviderRoute {
  provider: AIProviderSlug;
  model: string;
  priority: number;
  maxLatencyMs?: number;
  maxCostUsd?: number;
  enabled: boolean;
}

// ─── Request / Response ────────────────────────────────────────────────────────

export interface AITaskRequest {
  type: AITaskType;
  prompt: string;
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
  jsonMode?: boolean;
  stream?: boolean;
  metadata?: Record<string, unknown>;
  forceProvider?: AIProviderSlug;
  forceModel?: string;
}

export interface AIUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  estimatedCostUsd?: number;
}

export interface AITaskResult {
  text: string;
  provider: AIProviderSlug;
  model: string;
  usage: AIUsage;
  latencyMs: number;
  taskType: AITaskType;
  attemptCount: number;
  fromFallback: boolean;
}

// ─── Provider Config ──────────────────────────────────────────────────────────

export interface AIProviderConfig {
  slug: AIProviderSlug;
  name: string;
  apiKey: string;
  baseUrl?: string;
  defaultModel: string;
  timeoutMs?: number;
  maxRetries?: number;
}

// ─── Model Registry ────────────────────────────────────────────────────────────

export interface ModelSpec {
  id: string;
  provider: AIProviderSlug;
  contextLength: number;
  inputCostPer1M: number;
  outputCostPer1M: number;
  supportsJson: boolean;
  supportsStreaming: boolean;
  avgLatencyMs: number;
  tier: "premium" | "standard" | "budget";
  tags: string[];
}

// ─── Provider Interface ────────────────────────────────────────────────────────

export interface AIGenerateRequest {
  prompt: string;
  systemPrompt?: string;
  model: string;
  maxTokens?: number;
  temperature?: number;
  jsonMode?: boolean;
}

export interface AIGenerateResponse {
  text: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

export interface BaseAIProvider {
  slug: AIProviderSlug;
  name: string;
  isAvailable(): boolean;
  generate(request: AIGenerateRequest): Promise<AIGenerateResponse>;
  generateStream?(request: AIGenerateRequest): AsyncGenerator<string>;
}

// ─── Error ─────────────────────────────────────────────────────────────────────

export type AIProviderErrorCode =
  | "rate_limit"
  | "auth"
  | "model_unavailable"
  | "timeout"
  | "safety"
  | "unknown";

export class AIProviderError extends Error {
  public readonly provider: AIProviderSlug | string;
  public readonly code: AIProviderErrorCode;
  public readonly retryable: boolean;

  constructor(
    message: string,
    provider: AIProviderSlug | string,
    code: AIProviderErrorCode,
    retryable: boolean
  ) {
    super(message);
    this.name = "AIProviderError";
    this.provider = provider;
    this.code = code;
    this.retryable = retryable;
  }
}
