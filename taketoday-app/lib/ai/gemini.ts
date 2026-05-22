import { GoogleGenerativeAI, Part } from "@google/generative-ai";
import { z } from "zod";
import {
  AIRequestOptions,
  AIResponse,
  AIProvider,
  AIError,
} from "./provider";

export class GeminiProvider implements AIProvider {
  readonly name = "gemini";
  private genAI: GoogleGenerativeAI;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error("Gemini API Key is required");
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  /**
   * Maps Gemini API errors to our AIError types
   */
  private mapError(error: unknown): AIError {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      
      // Rate limit errors
      if (message.includes("quota") || message.includes("rate") || message.includes("429")) {
        return new AIError("Rate limit exceeded", "rate_limit");
      }
      
      // Safety errors
      if (message.includes("safety") || message.includes("blocked") || message.includes("harmful")) {
        return new AIError("Content blocked due to safety settings", "safety");
      }
      
      // Invalid request errors
      if (message.includes("invalid") || message.includes("bad request") || message.includes("400")) {
        return new AIError("Invalid request", "invalid_request");
      }
    }
    
    // Default to internal error
    return new AIError("Internal AI service error", "internal");
  }

  async generateText(
    prompt: string,
    options: AIRequestOptions = {}
  ): Promise<AIResponse> {
    // Select model based on options or default to flash for fast tasks
    const modelName = options.model || "gemini-2.5-flash";
    const model = this.genAI.getGenerativeModel({
      model: modelName,
      systemInstruction: options.systemInstruction,
    });

    const generationConfig = {
      temperature: options.temperature,
      maxOutputTokens: options.maxTokens,
      responseMimeType: options.responseMimeType || "text/plain",
    };

    try {
      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt } as Part] }],
        generationConfig,
      });

      const response = await result.response;
      const text = response.text();

      return {
        text,
        usage: {
          promptTokens: response.usageMetadata?.promptTokenCount || 0,
          completionTokens: response.usageMetadata?.candidatesTokenCount || 0,
          totalTokens: response.usageMetadata?.totalTokenCount || 0,
        },
      };
    } catch (error) {
      throw this.mapError(error);
    }
  }

  async generateStructured<T>(
    prompt: string,
    schema: z.ZodType<T>,
    options: AIRequestOptions = {}
  ): Promise<T> {
    // For structured output, we want JSON response
    const structuredOptions = {
      ...options,
      responseMimeType: "application/json" as const,
    };

    try {
      const response = await this.generateText(prompt, structuredOptions);
      
      // Clean up the response to extract JSON
      let cleanedText = response.text.trim();
      // Remove markdown code blocks if present
      if (cleanedText.startsWith("```json")) {
        cleanedText = cleanedText.slice(7);
      }
      if (cleanedText.endsWith("```")) {
        cleanedText = cleanedText.slice(0, -3);
      }
      cleanedText = cleanedText.trim();

      // Parse and validate against schema
      const parsed = JSON.parse(cleanedText);
      const result = schema.safeParse(parsed);
      
      if (!result.success) {
        throw new Error(`Failed to parse structured output: ${result.error.message}`);
      }
      
      return result.data;
    } catch (error) {
      if (error instanceof AIError) {
        throw error;
      }
      throw this.mapError(error);
    }
  }

  async *streamText(
    prompt: string,
    options: AIRequestOptions = {}
  ): AsyncIterable<string> {
    // Select model based on options or default to flash for fast tasks
    const modelName = options.model || "gemini-2.5-flash";
    const model = this.genAI.getGenerativeModel({
      model: modelName,
      systemInstruction: options.systemInstruction,
    });

    const generationConfig = {
      temperature: options.temperature,
      maxOutputTokens: options.maxTokens,
      responseMimeType: options.responseMimeType || "text/plain",
    };

    try {
      // Note: The Google Generative AI SDK doesn't have direct streaming support in this version
      // We'll simulate streaming by generating the full response and yielding it in chunks
      // In a production environment, you might want to use a different approach or wait for SDK updates
      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt } as Part] }],
        generationConfig,
      });

      const response = await result.response;
      const text = response.text();

      // Simple chunking: yield words or sentences
      const words = text.split(/\s+/);
      let currentChunk = "";
      
      for (const word of words) {
        if ((currentChunk + word).length > 100) { // Arbitrary chunk size
          yield currentChunk;
          currentChunk = word + " ";
        } else {
          currentChunk += word + " ";
        }
      }
      
      if (currentChunk.trim()) {
        yield currentChunk.trim();
      }
    } catch (error) {
      throw this.mapError(error);
    }
  }
}
