import type { AITaskType, ProviderRoute } from "../core/types";

export const DEFAULT_ROUTES: Record<AITaskType, ProviderRoute[]> = {
  // Premium tasks: GPT-4.1 first, Gemini Pro fallback, OpenRouter last resort
  ARTICLE_GENERATION: [
    { provider: "openai",     model: "gpt-4.1",                             priority: 1, enabled: true },
    { provider: "gemini",     model: "gemini-2.5-pro",                      priority: 2, enabled: true },
    { provider: "openrouter", model: "meta-llama/llama-3.3-70b-instruct",   priority: 3, enabled: true },
  ],

  // Gemini-first: visual storytelling + structured JSON output
  CAROUSEL_GENERATION: [
    { provider: "gemini",  model: "gemini-2.0-flash", priority: 1, enabled: true },
    { provider: "openai",  model: "gpt-4o-mini",      priority: 2, enabled: true },
  ],

  // Long-form creative: GPT-4.1 → Gemini Pro
  SHORT_VIDEO_SCRIPT: [
    { provider: "openai", model: "gpt-4.1",       priority: 1, enabled: true },
    { provider: "gemini", model: "gemini-2.5-pro", priority: 2, enabled: true },
  ],

  // Fast social copy: gpt-4o-mini → Groq
  SOCIAL_CAPTION: [
    { provider: "openai", model: "gpt-4o-mini",          priority: 1, enabled: true },
    { provider: "groq",   model: "llama-3.3-70b-versatile", priority: 2, enabled: true },
  ],

  // Speed-optimised: mini first, Groq fallback
  HEADLINE_VARIANTS: [
    { provider: "openai", model: "gpt-4.1-mini",           priority: 1, enabled: true },
    { provider: "groq",   model: "llama-3.3-70b-versatile", priority: 2, enabled: true },
  ],

  // Budget path: Groq 8B (fastest + cheapest) → OpenRouter budget model
  SEO_METADATA: [
    { provider: "groq",       model: "llama-3.1-8b-instant",   priority: 1, enabled: true },
    { provider: "openrouter", model: "mistralai/mistral-nemo",  priority: 2, enabled: true },
  ],

  // Groq ultra-fast → Gemini Flash fallback
  SUMMARIZATION: [
    { provider: "groq",   model: "llama-3.3-70b-versatile", priority: 1, enabled: true },
    { provider: "gemini", model: "gemini-2.0-flash",         priority: 2, enabled: true },
  ],

  // Ultra-fast rewrites: Groq first, gpt-4o-mini fallback
  REWRITE: [
    { provider: "groq",  model: "llama-3.3-70b-versatile", priority: 1, enabled: true },
    { provider: "openai", model: "gpt-4o-mini",             priority: 2, enabled: true },
  ],

  // Distribution: cheap + reliable
  DISTRIBUTION_POST: [
    { provider: "openai", model: "gpt-4o-mini",    priority: 1, enabled: true },
    { provider: "gemini", model: "gemini-2.0-flash", priority: 2, enabled: true },
  ],

  // Fact-check: mini reasoning → Gemini Pro
  FACT_CHECK: [
    { provider: "openai", model: "gpt-4.1-mini",   priority: 1, enabled: true },
    { provider: "gemini", model: "gemini-2.5-pro",  priority: 2, enabled: true },
  ],

  // Translation: Gemini multilingual → OpenAI fallback
  TRANSLATION: [
    { provider: "gemini", model: "gemini-2.0-flash", priority: 1, enabled: true },
    { provider: "openai", model: "gpt-4o-mini",       priority: 2, enabled: true },
  ],

  // Analysis: Gemini Flash (fast, cheap) → gpt-4o-mini
  ANALYSIS: [
    { provider: "gemini", model: "gemini-2.0-flash", priority: 1, enabled: true },
    { provider: "openai", model: "gpt-4o-mini",       priority: 2, enabled: true },
  ],
};
