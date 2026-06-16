import 'server-only';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { appConfig } from '@/lib/config/app';
import type { AIProvider, PromptInput, GenerationResult } from './types';

function buildModel(jsonMode: boolean) {
  if (!appConfig.geminiApiKey) throw new Error('GEMINI_API_KEY not configured');
  const genAI = new GoogleGenerativeAI(appConfig.geminiApiKey);
  return genAI.getGenerativeModel({
    model: appConfig.geminiProModel,
    ...(jsonMode && {
      generationConfig: { responseMimeType: 'application/json' },
    }),
  });
}

export const geminiProProvider: AIProvider = {
  name: 'gemini-pro',

  async generate(input: PromptInput): Promise<GenerationResult> {
    const jsonMode = !!input.schema;
    const model = buildModel(jsonMode);

    const systemHint = jsonMode && input.schema
      ? `\n\nRespond ONLY with valid JSON matching this schema:\n${JSON.stringify(input.schema, null, 2)}`
      : '';

    const result = await model.generateContent({
      systemInstruction: input.system + systemHint,
      contents: [{ role: 'user', parts: [{ text: input.user }] }],
      generationConfig: {
        maxOutputTokens: input.maxTokens,
        temperature: input.temperature,
        ...(jsonMode && { responseMimeType: 'application/json' }),
      },
    });

    const text = result.response.text().trim();
    const usage = result.response.usageMetadata;

    return {
      text,
      parsed: jsonMode ? JSON.parse(text) : undefined,
      inputTokens: usage?.promptTokenCount ?? 0,
      outputTokens: usage?.candidatesTokenCount ?? 0,
      model: appConfig.geminiProModel,
      provider: 'gemini-pro',
    };
  },
};
