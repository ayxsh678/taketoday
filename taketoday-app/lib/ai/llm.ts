import 'server-only';
import OpenAI from 'openai';
import { appConfig } from '@/lib/config/app';

// Singleton client — avoid re-instantiation per call
let _client: OpenAI | null = null;

function getClient(): OpenAI {
  if (!appConfig.openaiApiKey) throw new Error('OPENAI_API_KEY not configured');
  if (!_client) _client = new OpenAI({ apiKey: appConfig.openaiApiKey });
  return _client;
}

// Call LLM with a single tool → guaranteed structured JSON output
export async function callLLMWithTool<T>(opts: {
  system: string;
  user: string;
  toolName: string;
  toolDescription: string;
  schema: Record<string, unknown>;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}): Promise<T> {
  const client = getClient();

  const response = await client.chat.completions.create({
    model: opts.model ?? 'gpt-4o-mini',
    max_tokens: opts.maxTokens ?? 2000,
    temperature: opts.temperature ?? 0.3,
    tools: [
      {
        type: 'function',
        function: {
          name: opts.toolName,
          description: opts.toolDescription,
          parameters: opts.schema,
        },
      },
    ],
    tool_choice: { type: 'function', function: { name: opts.toolName } },
    messages: [
      { role: 'system', content: opts.system },
      { role: 'user', content: opts.user },
    ],
  });

  const toolCall = response.choices[0]?.message.tool_calls?.[0];
  if (!toolCall || toolCall.type !== 'function') {
    throw new Error(`LLM returned no tool call for ${opts.toolName}`);
  }

  return JSON.parse(toolCall.function.arguments) as T;
}

// Simple completion returning plain text
export async function callLLM(opts: {
  system: string;
  user: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}): Promise<string> {
  const client = getClient();

  const response = await client.chat.completions.create({
    model: opts.model ?? 'gpt-4o-mini',
    max_tokens: opts.maxTokens ?? 1000,
    temperature: opts.temperature ?? 0.5,
    messages: [
      { role: 'system', content: opts.system },
      { role: 'user', content: opts.user },
    ],
  });

  return response.choices[0]?.message.content?.trim() ?? '';
}
