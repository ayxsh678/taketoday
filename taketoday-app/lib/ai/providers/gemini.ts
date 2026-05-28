/**
 * Gemini-specific provider adapter.
 * Uses @google/generative-ai SDK.
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import type {
  BaseAIProvider,
  AIGenerateRequest,
  AIGenerateResponse,
} from "../core/types";
import { AIProviderError } from "../core/types";

export class GeminiAdapter implements BaseAIProvider {
  public readonly slug = "gemini" as const;
  public readonly name = "Google Gemini";
  private readonly apiKey: string;
  private readonly genAI: GoogleGenerativeAI;
  private readonly defaultModel: string;

  constructor(apiKey: string, defaultModel = "gemini-2.0-flash") {
    this.apiKey = apiKey;
    this.defaultModel = defaultModel;
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  isAvailable(): boolean {
    return Boolean(this.apiKey);
  }

  async generate(request: AIGenerateRequest): Promise<AIGenerateResponse> {
    const modelId = request.model || this.defaultModel;

    try {
      const model = this.genAI.getGenerativeModel({
        model: modelId,
        systemInstruction: request.systemPrompt,
      });

      const generationConfig = {
        temperature: request.temperature,
        maxOutputTokens: request.maxTokens,
        responseMimeType: request.jsonMode
          ? ("application/json" as const)
          : ("text/plain" as const),
      };

      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: request.prompt }] }],
        generationConfig,
      });

      const response = result.response;
      const text = response.text();
      const usage = response.usageMetadata;

      return {
        text,
        model: modelId,
        inputTokens: usage?.promptTokenCount ?? 0,
        outputTokens: usage?.candidatesTokenCount ?? 0,
        totalTokens: usage?.totalTokenCount ?? 0,
      };
    } catch (err) {
      throw this.mapError(err);
    }
  }

  async *generateStream(request: AIGenerateRequest): AsyncGenerator<string> {
    const modelId = request.model || this.defaultModel;

    try {
      const model = this.genAI.getGenerativeModel({
        model: modelId,
        systemInstruction: request.systemPrompt,
      });

      const generationConfig = {
        temperature: request.temperature,
        maxOutputTokens: request.maxTokens,
        responseMimeType: request.jsonMode
          ? ("application/json" as const)
          : ("text/plain" as const),
      };

      const streamResult = await model.generateContentStream({
        contents: [{ role: "user", parts: [{ text: request.prompt }] }],
        generationConfig,
      });

      for await (const chunk of streamResult.stream) {
        const text = chunk.text();
        if (text) {
          yield text;
        }
      }
    } catch (err) {
      throw this.mapError(err);
    }
  }

  private mapError(err: unknown): AIProviderError {
    if (err instanceof AIProviderError) {
      return err;
    }

    const message = err instanceof Error ? err.message : String(err);
    const lowerMessage = message.toLowerCase();

    if (
      lowerMessage.includes("quota") ||
      lowerMessage.includes("rate") ||
      lowerMessage.includes("429") ||
      lowerMessage.includes("resource has been exhausted")
    ) {
      return new AIProviderError(
        `Rate limit exceeded: ${message}`,
        this.slug,
        "rate_limit",
        true
      );
    }

    if (
      lowerMessage.includes("api key") ||
      lowerMessage.includes("authentication") ||
      lowerMessage.includes("401") ||
      lowerMessage.includes("403")
    ) {
      return new AIProviderError(
        `Authentication failed: ${message}`,
        this.slug,
        "auth",
        false
      );
    }

    if (
      lowerMessage.includes("safety") ||
      lowerMessage.includes("blocked") ||
      lowerMessage.includes("harm")
    ) {
      return new AIProviderError(
        `Content blocked by safety filter: ${message}`,
        this.slug,
        "safety",
        false
      );
    }

    if (
      lowerMessage.includes("timeout") ||
      lowerMessage.includes("deadline") ||
      lowerMessage.includes("etimedout")
    ) {
      return new AIProviderError(
        `Request timed out: ${message}`,
        this.slug,
        "timeout",
        true
      );
    }

    if (
      lowerMessage.includes("503") ||
      lowerMessage.includes("502") ||
      lowerMessage.includes("service unavailable") ||
      lowerMessage.includes("overloaded")
    ) {
      return new AIProviderError(
        `Service unavailable: ${message}`,
        this.slug,
        "model_unavailable",
        true
      );
    }

    return new AIProviderError(
      `Unexpected Gemini error: ${message}`,
      this.slug,
      "unknown",
      false
    );
  }
}
