// lib/ai/types.ts

import { z } from 'zod';

export type AIRequestOptions = {
  /** The model to use for the request */
  model?: string;
  /** System-level instructions to guide the AI's behavior */
  systemInstruction?: string;
  /** Sampling temperature (0.0 to 1.0) */
  temperature?: number;
  /** Maximum number of tokens to generate */
  maxTokens?: number;
  /** MIME type of the response */
  mimeType?: 'text/plain' | 'application/json';
};

export type AIError = {
  message: string;
  type: 'rate_limit' | 'safety' | 'invalid_request' | 'internal';
};

export type AIProvider = {
  /** Unique identifier for the provider */
  readonly name: string;

  /**
   * Generate text from a prompt.
   * @param prompt - The input prompt
   * @param options - Configuration options for the generation
   * @returns Promise resolving to the generated text and usage info
   */
  generate(prompt: string, options?: AIRequestOptions): Promise<{ text: string; usage: { tokens: number } }>;
};

export type GeminiModel =
  | 'gemini-2.5-flash'    // Fast tasks: headlines, classification, summarization
  | 'gemini-3.0';          // Advanced tasks: detailed explanations, creative writing

export type AIResponse = {
  text: string;
  usage: { tokens: number };
};
