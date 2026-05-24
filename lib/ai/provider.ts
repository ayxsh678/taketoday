// lib/ai/provider.ts

import { z } from 'zod';
import { AIError, AIRequestOptions, AIProvider } from './types';
import { appConfig } from '../../config/app';

const providerSchema = z.object({
  name: z.string(),
  generate: z.function().args(z.string(), z.object({}).optional()).returns(
    z.promise<z.infer<typeof AIResponse>>()
  ),
});

export const providers: Record<string, AIProvider> = {
  gemini: new GeminiProvider(appConfig.geminiApiKey),
};

export function getAIProvider(name: string): AIProvider | null {
  return providers[name] || null;
}
