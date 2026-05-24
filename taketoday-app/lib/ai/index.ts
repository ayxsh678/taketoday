import { GeminiProvider } from "./gemini";
import { AIProvider } from "./provider";
import { validateAIConfig } from "./config";
import { appConfig } from "@lib/config/app";

let providerInstance: AIProvider | null = null;

/**
 * Get the singleton AI provider instance.
 * Initializes the provider with the API key from environment variables.
 * 
 * @returns Configured AI provider instance
 * @throws Error if GEMINI_API_KEY is not set
 */
export function getAIProvider(): AIProvider {
  if (providerInstance) return providerInstance;

  // Validate configuration before initializing
  validateAIConfig();

  const apiKey = appConfig.geminiApiKey;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set in environment variables");
  }

  providerInstance = new GeminiProvider(apiKey);
  return providerInstance;
}

// Re-export all public interfaces and types
export * from "./provider";
export * from "./types";
export * from "./utils";
export * from "./config";
export { GeminiProvider };
