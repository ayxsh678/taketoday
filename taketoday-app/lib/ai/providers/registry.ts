import { appConfig } from "@/lib/config/app";
import type { AIProviderSlug, BaseAIProvider } from "../core/types";
import { OpenAICompatProvider } from "./openai-compat";
import { GeminiAdapter } from "./gemini";

type ProviderFactory = () => BaseAIProvider | null;

const PROVIDER_CONFIGS: Record<AIProviderSlug, ProviderFactory> = {
  openai: () => {
    const key = appConfig.openaiApiKey;
    if (!key) return null;
    return new OpenAICompatProvider({
      slug: "openai",
      name: "OpenAI",
      apiKey: key,
      baseUrl: undefined,
      defaultModel: "gpt-4o-mini",
      timeoutMs: 60_000,
      maxRetries: 0,
    });
  },

  gemini: () => {
    const key = appConfig.geminiApiKey;
    if (!key) return null;
    return new GeminiAdapter(key, "gemini-2.0-flash");
  },

  groq: () => {
    const key = appConfig.groqApiKey;
    if (!key) return null;
    return new OpenAICompatProvider({
      slug: "groq",
      name: "Groq",
      apiKey: key,
      baseUrl: "https://api.groq.com/openai/v1",
      defaultModel: "llama-3.3-70b-versatile",
      timeoutMs: 30_000,
      maxRetries: 0,
    });
  },

  openrouter: () => {
    const key = appConfig.openrouterApiKey;
    if (!key) return null;
    return new OpenAICompatProvider({
      slug: "openrouter",
      name: "OpenRouter",
      apiKey: key,
      baseUrl: "https://openrouter.ai/api/v1",
      defaultModel: "meta-llama/llama-3.3-70b-instruct",
      timeoutMs: 60_000,
      maxRetries: 0,
    });
  },
};

class ProviderRegistry {
  private cache = new Map<AIProviderSlug, BaseAIProvider | null>();

  getProvider(slug: AIProviderSlug): BaseAIProvider | null {
    if (this.cache.has(slug)) return this.cache.get(slug) ?? null;
    const provider = PROVIDER_CONFIGS[slug]?.() ?? null;
    this.cache.set(slug, provider);
    return provider;
  }

  getAvailableProviders(): BaseAIProvider[] {
    return (Object.keys(PROVIDER_CONFIGS) as AIProviderSlug[])
      .map((slug) => this.getProvider(slug))
      .filter((p): p is BaseAIProvider => p !== null && p.isAvailable());
  }

  reset(): void {
    this.cache.clear();
  }
}

export const providerRegistry = new ProviderRegistry();

export function getProvider(slug: AIProviderSlug): BaseAIProvider | null {
  return providerRegistry.getProvider(slug);
}

export function getAvailableProviders(): BaseAIProvider[] {
  return providerRegistry.getAvailableProviders();
}
