/**
 * Type definitions for the AI abstraction layer.
 */

import { z } from 'zod';

/**
 * Supported AI models for the Gemini provider.
 */
export type GeminiModel =
  | "gemini-2.5-flash"    // Fast tasks: headlines, classification, summarization
  | "gemini-2.5-pro";     // Heavy reasoning tasks

// Re-export Zod for use in generateStructured
export { z };
