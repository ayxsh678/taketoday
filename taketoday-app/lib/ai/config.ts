/**
 * Configuration and validation for the AI abstraction layer.
 * Loads and validates required environment variables.
 */

import { appConfig } from '@/lib/config/app';

/**
 * Validates that the AI configuration is properly set.
 * Throws an error if validation fails.
 */
export function validateAIConfig(): void {
  // We rely on the central config validation, so we just check that the geminiApiKey is present.
  // If the central config is correct, this will always be true.
  if (!appConfig.geminiApiKey) {
    throw new Error(
      "GEMINI_API_KEY is not set in environment variables. " +
      "Please add it to your .env file."
    );
  }
}

/**
 * Gets the Gemini API key from environment variables.
 * 
 * @returns The Gemini API key
 * @throws Error if GEMINI_API_KEY is not set
 */
export function getGeminiApiKey(): string {
  return appConfig.geminiApiKey;
}