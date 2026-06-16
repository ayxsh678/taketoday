import 'server-only';
import OpenAI from 'openai';
import { appConfig } from '@/lib/config/app';
import type { AIProvider, PromptInput, GenerationResult } from './types';

let _client: OpenAI | null = null;

function getClient(): OpenAI {
  if (!appConfig.openaiApiKey) throw new Error('OPENAI_API_KEY not configured');
  if (!_client) _client = new OpenAI({ apiKey: appConfig.openaiApiKey });
  return _client;
}

export const gpt55Provider: AIProvider = {
  name: 'gpt-55',

  async generate(input: PromptInput): Promise<GenerationResult> {
    const client = getClient();
    const model = appConfig.gpt55Model;

    if (input.schema && input.toolName) {
      const response = await client.chat.completions.create({
        model,
        max_tokens: input.maxTokens ?? 2000,
        temperature: input.temperature ?? 0.3,
        tools: [
          {
            type: 'function',
            function: {
              name: input.toolName,
              description: input.toolDescription ?? '',
              parameters: input.schema,
            },
          },
        ],
        tool_choice: { type: 'function', function: { name: input.toolName } },
        messages: [
          { role: 'system', content: input.system },
          { role: 'user', content: input.user },
        ],
      });

      const toolCall = response.choices[0]?.message.tool_calls?.[0];
      if (!toolCall || toolCall.type !== 'function') {
        throw new Error(`GPT-55: no tool call returned for ${input.toolName}`);
      }

      const parsed = JSON.parse(toolCall.function.arguments) as unknown;
      const usage = response.usage;

      return {
        text: toolCall.function.arguments,
        parsed,
        inputTokens: usage?.prompt_tokens ?? 0,
        outputTokens: usage?.completion_tokens ?? 0,
        model,
        provider: 'gpt-55',
      };
    }

    const response = await client.chat.completions.create({
      model,
      max_tokens: input.maxTokens ?? 1000,
      temperature: input.temperature ?? 0.5,
      ...(input.schema && { response_format: { type: 'json_object' } }),
      messages: [
        { role: 'system', content: input.system },
        { role: 'user', content: input.user },
      ],
    });

    const text = response.choices[0]?.message.content?.trim() ?? '';
    const usage = response.usage;

    return {
      text,
      parsed: input.schema ? JSON.parse(text) : undefined,
      inputTokens: usage?.prompt_tokens ?? 0,
      outputTokens: usage?.completion_tokens ?? 0,
      model,
      provider: 'gpt-55',
    };
  },
};
