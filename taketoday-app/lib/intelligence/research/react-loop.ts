import 'server-only';
import OpenAI from 'openai';
import { appConfig } from '@/lib/config/app';
import { TOOL_DEFINITIONS, executeTool } from './tools';

const MAX_ITERATIONS = 8;

export interface SynthesisResult {
  executiveSummary: string;
  keyFindings: string[];
  timeline: Array<{
    date: string;
    title: string;
    description: string;
    importance: 'low' | 'medium' | 'high' | 'critical';
  }>;
  openQuestions: string[];
  watchList: Array<{
    entity: string;
    description: string;
    triggerKeywords: string[];
    importance: 'high' | 'medium' | 'low';
  }>;
  riskFactors: Array<{
    description: string;
    likelihood: 'low' | 'medium' | 'high';
    impact: 'low' | 'medium' | 'high' | 'critical';
    entityIds: string[];
  }>;
  confidenceScore: number;
  sourcesConsulted: string[];
}

const SYSTEM_PROMPT = `You are an investigative research agent for a news intelligence system.
Your job: gather comprehensive background on a story chain by using the provided tools strategically.

Strategy:
1. Start with web_search to understand the current state
2. Use wikidata_lookup for key actors and organizations
3. Use news_history to find historical patterns and precedents
4. Use financial_data for companies/markets mentioned
5. Call synthesize when you have gathered enough evidence (minimum 3 searches)

Always use tools — never synthesize from your training data alone.
Prioritize primary sources. Cross-reference claims across multiple sources.
When you have sufficient evidence (4-6 tool calls), call synthesize to produce the dossier.`;

export async function runReActLoop(opts: {
  topic: string;
  articleSummaries: string;
  existingNarrative?: string;
}): Promise<SynthesisResult | null> {
  if (!appConfig.openaiApiKey) return null;

  const openai = new OpenAI({ apiKey: appConfig.openaiApiKey });

  const userPrompt = [
    `Research topic: "${opts.topic}"`,
    '',
    'Key articles:',
    opts.articleSummaries,
    opts.existingNarrative
      ? `\nCurrent narrative summary:\n${opts.existingNarrative}`
      : '',
    '',
    'Conduct research using the available tools, then call synthesize to produce the dossier.',
  ]
    .filter(Boolean)
    .join('\n');

  const messages: OpenAI.ChatCompletionMessageParam[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: userPrompt },
  ];

  const sourcesConsulted: string[] = [];

  for (let iteration = 0; iteration < MAX_ITERATIONS; iteration++) {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 2000,
      temperature: 0.3,
      // Cast needed because TOOL_DEFINITIONS uses `as const` readonly tuple
      tools: TOOL_DEFINITIONS as unknown as OpenAI.ChatCompletionTool[],
      tool_choice: 'required',
      messages,
    });

    const assistantMessage = response.choices[0]?.message;
    if (!assistantMessage) break;

    messages.push(assistantMessage);

    const rawCalls = assistantMessage.tool_calls ?? [];
    // Filter to function-type tool calls only (guards against ChatCompletionMessageCustomToolCall)
    const toolCalls = rawCalls.filter(
      (tc): tc is OpenAI.ChatCompletionMessageToolCall & { type: 'function' } => tc.type === 'function',
    );
    if (toolCalls.length === 0) break;

    // Check for synthesize — terminal action
    const synthesizeCall = toolCalls.find((tc) => tc.function.name === 'synthesize');
    if (synthesizeCall) {
      const args = JSON.parse(synthesizeCall.function.arguments) as Omit<SynthesisResult, 'sourcesConsulted'>;
      return { ...args, sourcesConsulted: [...new Set(sourcesConsulted)] };
    }

    // Execute all tool calls and append results
    const toolResults = await Promise.allSettled(
      toolCalls.map(async (tc) => {
        const args = JSON.parse(tc.function.arguments) as Record<string, unknown>;
        const result = await executeTool(tc.function.name, args);

        // Collect URLs as sources consulted
        collectSources(tc.function.name, args, result, sourcesConsulted);

        return { toolCallId: tc.id, result };
      }),
    );

    for (const settled of toolResults) {
      if (settled.status !== 'fulfilled') continue;
      const { toolCallId, result } = settled.value;
      messages.push({
        role: 'tool',
        tool_call_id: toolCallId,
        content: JSON.stringify(result),
      });
    }
  }

  // Max iterations hit without synthesize — force a synthesis
  return forceSynthesis(openai, messages, sourcesConsulted);
}

function collectSources(
  toolName: string,
  args: Record<string, unknown>,
  result: unknown,
  sources: string[],
): void {
  if (toolName === 'web_search' || toolName === 'news_history') {
    const r = result as { results?: Array<{ url?: string }>; articles?: Array<{ url?: string }> };
    const items = r.results ?? r.articles ?? [];
    for (const item of items) {
      if (item.url) sources.push(item.url);
    }
  } else if (toolName === 'wikidata_lookup') {
    const r = result as { wikidataUrl?: string };
    if (r.wikidataUrl) sources.push(r.wikidataUrl);
  } else if (toolName === 'financial_data') {
    const ticker = args.ticker as string;
    if (ticker) sources.push(`https://finance.yahoo.com/quote/${ticker}`);
  }
}

async function forceSynthesis(
  openai: OpenAI,
  messages: OpenAI.ChatCompletionMessageParam[],
  sourcesConsulted: string[],
): Promise<SynthesisResult | null> {
  try {
    messages.push({
      role: 'user',
      content: 'You have reached the research limit. Call synthesize now with all findings gathered.',
    });

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 3000,
      temperature: 0.2,
      tools: TOOL_DEFINITIONS as unknown as OpenAI.ChatCompletionTool[],
      tool_choice: { type: 'function', function: { name: 'synthesize' } },
      messages,
    });

    const tc = response.choices[0]?.message.tool_calls?.[0];
    if (!tc || tc.type !== 'function' || tc.function.name !== 'synthesize') return null;

    const args = JSON.parse(tc.function.arguments) as Omit<SynthesisResult, 'sourcesConsulted'>;
    return { ...args, sourcesConsulted: [...new Set(sourcesConsulted)] };
  } catch {
    return null;
  }
}
