/**
 * Configuration and validation for the AI abstraction layer.
 * Loads and validates required environment variables.
 */

import { z } from 'zod';

/**
 * Schema for AI configuration environment variables.
 */
const AIConfigSchema = z.object({
  /** Google Gemini API key */
  GEMINI_API_KEY: z.string().min(1, "GEMINI_API_KEY is required"),
});

/**
 * Loaded and validated AI configuration.
 */
export const AIConfig = AIConfigSchema.parse(process.env);

/**
 * Validates that the AI configuration is properly set.
 * Throws an error if validation fails.
 */
export function validateAIConfig(): void {
  try {
    AIConfigSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingFields = error.issues
        .map(issue => issue.path.join('.'))
        .join(', ');
      throw new Error(
        `Missing or invalid AI configuration: ${missingFields}. ` +
        `Please check your environment variables.`
      );
    }
    throw error;
  }
}

/**
 * Gets the Gemini API key from environment variables.
 * 
 * @returns The Gemini API key
 * @throws Error if GEMINI_API_KEY is not set
 */
export function getGeminiApiKey(): string {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY is not set in environment variables. " +
      "Please add it to your .env file."
    );
  }
  return apiKey;
}