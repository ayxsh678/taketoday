import 'server-only';
import type { ProviderName } from './providers/types';

// Per-million-token costs (USD) — update as pricing changes
const COST_PER_M_TOKENS: Record<ProviderName, { input: number; output: number }> = {
  'gemini-flash': { input: 0.075,  output: 0.30  },
  'gemini-pro':   { input: 1.25,   output: 5.00  },
  'gpt-55':       { input: 2.50,   output: 10.00 },
};

export function estimateCost(
  provider: ProviderName,
  inputTokens: number,
  outputTokens: number,
): number {
  const rates = COST_PER_M_TOKENS[provider];
  return (inputTokens / 1_000_000) * rates.input + (outputTokens / 1_000_000) * rates.output;
}

export interface UsageRecord {
  provider: ProviderName;
  model: string;
  task: string;
  inputTokens: number;
  outputTokens: number;
  estimatedCost: number;
  articleId?: string;
}

export async function trackUsage(record: UsageRecord): Promise<void> {
  try {
    const { prisma } = await import('@/lib/db/prisma');
    await prisma.aIUsage.create({
      data: {
        provider: record.provider,
        model: record.model,
        task: record.task,
        inputTokens: record.inputTokens,
        outputTokens: record.outputTokens,
        estimatedCost: record.estimatedCost,
        articleId: record.articleId ?? null,
      },
    });
  } catch (err) {
    // Cost tracking must never crash the main path
    console.error('[costTracker] write failed:', err instanceof Error ? err.message : String(err));
  }
}
