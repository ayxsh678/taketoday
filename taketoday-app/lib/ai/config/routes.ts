import type { AITaskType, ProviderRoute } from "../core/types";

export const DEFAULT_ROUTES: Record<AITaskType, ProviderRoute[]> = {
  // Premium tasks: GPT-4.1 first, Gemini Pro fallback, OpenRouter last resort
  ARTICLE_GENERATION: [
    { provider: "openai",     model: "gpt-4.1",                             priority: 1, enabled: true },
    { provider: "gemini",     model: "gemini-2.5-pro",                      priority: 2, enabled: true },
    { provider: "openrouter", model: "meta-llama/llama-3.3-70b-instruct",   priority: 3, enabled: true },
    { provider: "groq",       model: "llama-3.3-70b-versatile",             priority: 4, enabled: true },
  ],

  // Gemini-first: visual storytelling + structured JSON output
  CAROUSEL_GENERATION: [
    { provider: "gemini",     model: "gemini-2.0-flash",                    priority: 1, enabled: true },
    { provider: "openai",     model: "gpt-4o-mini",                         priority: 2, enabled: true },
    { provider: "groq",       model: "llama-3.3-70b-versatile",             priority: 3, enabled: true },
    { provider: "openrouter", model: "meta-llama/llama-3.3-70b-instruct",   priority: 4, enabled: true },
  ],

  // Long-form creative: GPT-4.1 → Gemini Pro → Groq fallback
  SHORT_VIDEO_SCRIPT: [
    { provider: "openai",     model: "gpt-4.1",                             priority: 1, enabled: true },
    { provider: "gemini",     model: "gemini-2.5-pro",                      priority: 2, enabled: true },
    { provider: "groq",       model: "llama-3.3-70b-versatile",             priority: 3, enabled: true },
    { provider: "openrouter", model: "meta-llama/llama-3.3-70b-instruct",   priority: 4, enabled: true },
  ],

  // Fast social copy: gpt-4o-mini → Groq → OpenRouter
  SOCIAL_CAPTION: [
    { provider: "openai",     model: "gpt-4o-mini",                         priority: 1, enabled: true },
    { provider: "groq",       model: "llama-3.3-70b-versatile",             priority: 2, enabled: true },
    { provider: "openrouter", model: "meta-llama/llama-3.3-70b-instruct",   priority: 3, enabled: true },
  ],

  // Speed-optimised: Groq first (fast + free), mini fallback, OpenRouter last
  HEADLINE_VARIANTS: [
    { provider: "groq",       model: "llama-3.3-70b-versatile",             priority: 1, enabled: true },
    { provider: "openai",     model: "gpt-4.1-mini",                        priority: 2, enabled: true },
    { provider: "openrouter", model: "meta-llama/llama-3.3-70b-instruct",   priority: 3, enabled: true },
  ],

  // Budget path: Groq 8B (fastest + cheapest) → OpenRouter budget model
  SEO_METADATA: [
    { provider: "groq",       model: "llama-3.1-8b-instant",                priority: 1, enabled: true },
    { provider: "openrouter", model: "mistralai/mistral-nemo",               priority: 2, enabled: true },
  ],

  // Groq ultra-fast → Gemini Flash → OpenRouter
  SUMMARIZATION: [
    { provider: "groq",       model: "llama-3.3-70b-versatile",             priority: 1, enabled: true },
    { provider: "gemini",     model: "gemini-2.0-flash",                    priority: 2, enabled: true },
    { provider: "openrouter", model: "meta-llama/llama-3.3-70b-instruct",   priority: 3, enabled: true },
  ],

  // Ultra-fast rewrites: Groq first → OpenRouter fallback
  REWRITE: [
    { provider: "groq",       model: "llama-3.3-70b-versatile",             priority: 1, enabled: true },
    { provider: "openai",     model: "gpt-4o-mini",                         priority: 2, enabled: true },
    { provider: "openrouter", model: "meta-llama/llama-3.3-70b-instruct",   priority: 3, enabled: true },
  ],

  // Distribution: Groq → OpenAI → Gemini → OpenRouter
  DISTRIBUTION_POST: [
    { provider: "groq",       model: "llama-3.3-70b-versatile",             priority: 1, enabled: true },
    { provider: "openai",     model: "gpt-4o-mini",                         priority: 2, enabled: true },
    { provider: "gemini",     model: "gemini-2.0-flash",                    priority: 3, enabled: true },
    { provider: "openrouter", model: "meta-llama/llama-3.3-70b-instruct",   priority: 4, enabled: true },
  ],

  // Fact-check: Groq → OpenAI → Gemini → OpenRouter
  FACT_CHECK: [
    { provider: "groq",       model: "llama-3.3-70b-versatile",             priority: 1, enabled: true },
    { provider: "openai",     model: "gpt-4.1-mini",                        priority: 2, enabled: true },
    { provider: "gemini",     model: "gemini-2.5-pro",                      priority: 3, enabled: true },
    { provider: "openrouter", model: "meta-llama/llama-3.3-70b-instruct",   priority: 4, enabled: true },
  ],

  // Translation: Groq → Gemini multilingual → OpenAI → OpenRouter
  TRANSLATION: [
    { provider: "groq",       model: "llama-3.3-70b-versatile",             priority: 1, enabled: true },
    { provider: "gemini",     model: "gemini-2.0-flash",                    priority: 2, enabled: true },
    { provider: "openai",     model: "gpt-4o-mini",                         priority: 3, enabled: true },
    { provider: "openrouter", model: "meta-llama/llama-3.3-70b-instruct",   priority: 4, enabled: true },
  ],

  // Analysis: Groq (fast + free) → Gemini → OpenAI → OpenRouter
  ANALYSIS: [
    { provider: "groq",       model: "llama-3.3-70b-versatile",             priority: 1, enabled: true },
    { provider: "gemini",     model: "gemini-2.0-flash",                    priority: 2, enabled: true },
    { provider: "openai",     model: "gpt-4o-mini",                         priority: 3, enabled: true },
    { provider: "openrouter", model: "meta-llama/llama-3.3-70b-instruct",   priority: 4, enabled: true },
  ],
};
