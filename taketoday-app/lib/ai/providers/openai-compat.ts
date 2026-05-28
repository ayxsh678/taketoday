/**
 * OpenAI-compatible adapter.
 * Handles: OpenAI, Groq, Together AI, OpenRouter, Mistral, DeepSeek.
 * Uses the `openai` npm package with baseURL override.
 */

import OpenAI from "openai";
import type {
  AIProviderConfig,
  AIProviderSlug,
  BaseAIProvider,
  AIGenerateRequest,
  AIGenerateResponse,
} from "../core/types";
import { AIProviderError } from "../core/types";

export class OpenAICompatProvider implements BaseAIProvider {
  public readonly slug: AIProviderSlug;
  public readonly name: string;
  private readonly client: OpenAI;
  private readonly apiKey: string;
  private readonly defaultModel: string;

  constructor(config: AIProviderConfig) {
    this.slug = config.slug;
    this.name = config.name;
    this.apiKey = config.apiKey;
    this.defaultModel = config.defaultModel;

    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseUrl,
      timeout: config.timeoutMs ?? 60_000,
      maxRetries: config.maxRetries ?? 0, // We handle retries in the orchestrator
    });
  }

  isAvailable(): boolean {
    return Boolean(this.apiKey);
  }

  async generate(request: AIGenerateRequest): Promise<AIGenerateResponse> {
    const model = request.model || this.defaultModel;

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];

    if (request.systemPrompt) {
      messages.push({ role: "system", content: request.systemPrompt });
    }
    messages.push({ role: "user", content: request.prompt });

    const params: OpenAI.Chat.ChatCompletionCreateParamsNonStreaming = {
      model,
      messages,
      max_tokens: request.maxTokens,
      temperature: request.temperature,
      stream: false,
    };

    if (request.jsonMode) {
      params.response_format = { type: "json_object" };
    }

    try {
      const completion = await this.client.chat.completions.create(params);

      const choice = completion.choices[0];
      const text = choice?.message?.content ?? "";
      const usage = completion.usage;

      return {
        text,
        model: completion.model || model,
        inputTokens: usage?.prompt_tokens ?? 0,
        outputTokens: usage?.completion_tokens ?? 0,
        totalTokens: usage?.total_tokens ?? 0,
      };
    } catch (err) {
      throw this.mapError(err);
    }
  }

  async *generateStream(request: AIGenerateRequest): AsyncGenerator<string> {
    const model = request.model || this.defaultModel;

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];

    if (request.systemPrompt) {
      messages.push({ role: "system", content: request.systemPrompt });
    }
    messages.push({ role: "user", content: request.prompt });

    try {
      const stream = await this.client.chat.completions.create({
        model,
        messages,
        max_tokens: request.maxTokens,
        temperature: request.temperature,
        stream: true,
      });

      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta?.content;
        if (delta) {
          yield delta;
        }
      }
    } catch (err) {
      throw this.mapError(err);
    }
  }

  private mapError(err: unknown): AIProviderError {
    if (err instanceof OpenAI.APIError) {
      const status = err.status;
      const message = err.message || "Unknown OpenAI API error";

      if (status === 429) {
        return new AIProviderError(
          `Rate limit exceeded: ${message}`,
          this.slug,
          "rate_limit",
          true
        );
      }

      if (status === 401 || status === 403) {
        return new AIProviderError(
          `Authentication failed: ${message}`,
          this.slug,
          "auth",
          false
        );
      }

      if (status === 503 || status === 502) {
        return new AIProviderError(
          `Service unavailable: ${message}`,
          this.slug,
          "model_unavailable",
          true
        );
      }

      // Content filter
      if (
        message.toLowerCase().includes("content_filter") ||
        message.toLowerCase().includes("safety") ||
        message.toLowerCase().includes("content policy") ||
        message.toLowerCase().includes("moderation")
      ) {
        return new AIProviderError(
          `Content filtered: ${message}`,
          this.slug,
          "safety",
          false
        );
      }

      return new AIProviderError(
        `API error (${status}): ${message}`,
        this.slug,
        "unknown",
        false
      );
    }

    // Timeout
    if (
      err instanceof Error &&
      (err.message.includes("timeout") ||
        err.message.includes("ETIMEDOUT") ||
        err.message.includes("ECONNRESET") ||
        err.name === "APIConnectionTimeoutError")
    ) {
      return new AIProviderError(
        `Request timed out: ${err.message}`,
        this.slug,
        "timeout",
        true
      );
    }

    const message = err instanceof Error ? err.message : String(err);
    return new AIProviderError(
      `Unexpected error: ${message}`,
      this.slug,
      "unknown",
      false
    );
  }
}
