/**
 * AI Provider Interface
 * Defines the contract for AI providers used in the application.
 */

import { z } from 'zod';

/**
 * Configuration options for AI requests.
 */
export interface AIRequestOptions {
  /** The model to use for the request */
  model?: string;
  /** System-level instructions to guide the AI's behavior */
  systemInstruction?: string;
  /** Sampling temperature (0.0 to 1.0) */
  temperature?: number;
  /** Maximum number of tokens to generate */
  maxTokens?: number;
  /** MIME type of the response */
  responseMimeType?: 'application/json' | 'text/plain';
}

/**
 * Result from a text generation request.
 */
export interface AIResponse {
  /** Generated text content */
  text: string;
  /** Token usage statistics */
  usage: {
    /** Tokens used in the prompt */
    promptTokens: number;
    /** Tokens used in the completion */
    completionTokens: number;
    /** Total tokens used */
    totalTokens: number;
  };
}

/**
 * Custom error class for AI-related errors.
 */
export class AIError extends Error {
  /** Type of AI error */
  public readonly type: 'rate_limit' | 'safety' | 'invalid_request' | 'internal';

  constructor(message: string, type: 'rate_limit' | 'safety' | 'invalid_request' | 'internal') {
    super(message);
    this.name = 'AIError';
    this.type = type;
  }
}

/**
 * Interface that all AI providers must implement.
 */
export interface AIProvider {
  /** Unique identifier for the provider */
  readonly name: string;

  /**
   * Generate text from a prompt.
   * @param prompt - The input prompt
   * @param options - Configuration options for the generation
   * @returns Promise resolving to the generated text and usage info
   */
  generateText(
    prompt: string,
    options?: AIRequestOptions
  ): Promise<AIResponse>;

  /**
   * Generate structured data from a prompt using a Zod schema for validation.
   * @param prompt - The input prompt
   * @param schema - Zod schema to validate the output against
   * @param options - Configuration options for the generation
   * @returns Promise resolving to the parsed and validated data
   */
  generateStructured<T>(
    prompt: string,
    schema: z.ZodType<T>,
    options?: AIRequestOptions
  ): Promise<T>;

  /**
   * Stream text generation results as they become available.
   * @param prompt - The input prompt
   * @param options - Configuration options for the generation
   * @returns Async iterable of text chunks
   */
  streamText(
    prompt: string,
    options?: AIRequestOptions
  ): AsyncIterable<string>;
}