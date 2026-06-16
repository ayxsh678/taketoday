import 'server-only';
import { callWithRouter } from './router';
import type { AITask, RiskLevel } from './providers/types';

export interface LLMToolOpts {
  system: string;
  user: string;
  toolName: string;
  toolDescription: string;
  schema: Record<string, unknown>;
  model?: string;
  maxTokens?: number;
  temperature?: number;
  // Routing metadata — optional, defaults to safe Tier 2 selection
  task?: AITask;
  category?: string;
  risk?: RiskLevel;
  articleId?: string;
}

// Call LLM with structured output — routes to cheapest capable model
export async function callLLMWithTool<T>(opts: LLMToolOpts): Promise<T> {
  const result = await callWithRouter({
    task: opts.task ?? 'claim_extraction',
    category: opts.category,
    risk: opts.risk,
    articleId: opts.articleId,
    input: {
      system: opts.system,
      user: opts.user,
      schema: opts.schema,
      toolName: opts.toolName,
      toolDescription: opts.toolDescription,
      maxTokens: opts.maxTokens,
      temperature: opts.temperature,
    },
  });

  if (result.parsed !== undefined) return result.parsed as T;

  try {
    return JSON.parse(result.text) as T;
  } catch {
    throw new Error(`[llm] Failed to parse structured response from ${result.provider}`);
  }
}

export interface LLMOpts {
  system: string;
  user: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
  task?: AITask;
  category?: string;
  risk?: RiskLevel;
  articleId?: string;
}

// Call LLM for plain text output
export async function callLLM(opts: LLMOpts): Promise<string> {
  const result = await callWithRouter({
    task: opts.task ?? 'article_generation',
    category: opts.category,
    risk: opts.risk,
    articleId: opts.articleId,
    input: {
      system: opts.system,
      user: opts.user,
      maxTokens: opts.maxTokens,
      temperature: opts.temperature,
    },
  });

  return result.text;
}
