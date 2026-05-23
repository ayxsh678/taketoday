// lib/ai/gemini.ts

import { z } from 'zod';
import { AIError, AIRequestOptions, AIProvider } from './types';

class GeminiProvider implements AIProvider {
  readonly name = 'gemini';

  private genAI: GoogleGenerativeAI;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('Gemini API Key is required');
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  async generate(prompt: string, options?: AIRequestOptions): Promise<{ text: string; usage: { tokens: number } }> {
    try {
      const response = await this.genAI.generate(prompt, options);
      return {
        text: response.text,
        usage: { tokens: response.tokens },
      };
    } catch (error) {
      if (error instanceof GoogleGenerativeAIError) {
        switch (error.code) {
          case 429:
            throw new AIError('Rate limit exceeded', 'rate_limit');
          case 400:
          case 403:
            throw new AIError('Invalid request', 'invalid_request');
          default:
            throw new AIError(`Internal error: ${error.message}`, 'internal');
        }
      } else {
        throw new AIError(`Unknown error: ${error.message}`, 'internal');
      }
    }
  }
}
