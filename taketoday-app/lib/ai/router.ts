import 'server-only';
import { geminiFlashProvider, geminiProProvider, gpt55Provider } from './providers';
import { estimateCost, trackUsage } from './costTracker';
import type { AIProvider, AITask, RiskLevel, PromptInput, GenerationResult } from './providers/types';

const TIER1_TASKS = new Set<AITask>([
  'category_classification',
  'topic_extraction',
  'tag_generation',
  'seo_metadata',
  'headline_generation',
  'summary_generation',
  'social_caption',
  'whatsapp_update',
  'twitter_post',
  'content_moderation',
  'duplicate_detection',
  'excerpt_generation',
]);

const HIGH_RISK_CATEGORIES = new Set([
  'politics', 'political', 'finance', 'financial', 'legal', 'law',
  'investigative', 'investigation', 'court', 'election',
]);

export interface RouteTaskOpts {
  task: AITask;
  category?: string;
  risk?: RiskLevel;
}

export function selectProvider(opts: RouteTaskOpts): AIProvider {
  const { task, category = '', risk = 'LOW' } = opts;
  const cat = category.toLowerCase();

  if (TIER1_TASKS.has(task)) return geminiFlashProvider;

  if (task === 'verification' || task === 'fact_check') {
    if (risk === 'HIGH' || HIGH_RISK_CATEGORIES.has(cat)) return gpt55Provider;
    return geminiProProvider;
  }

  return geminiProProvider;
}

async function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

const RETRY_DELAYS = [0, 1000, 2000];

const FALLBACK_CHAIN: ReadonlyArray<AIProvider> = [
  geminiFlashProvider,
  geminiProProvider,
  gpt55Provider,
];

function getFallbackChain(primary: AIProvider): AIProvider[] {
  const idx = FALLBACK_CHAIN.findIndex((p) => p.name === primary.name);
  return idx === -1 ? [primary] : [...FALLBACK_CHAIN.slice(idx)];
}

export interface CallOpts extends RouteTaskOpts {
  input: PromptInput;
  articleId?: string;
}

export async function callWithRouter(opts: CallOpts): Promise<GenerationResult> {
  const primary = selectProvider(opts);
  const chain = getFallbackChain(primary);

  let lastError: unknown;

  for (const provider of chain) {
    for (let attempt = 0; attempt < RETRY_DELAYS.length; attempt++) {
      if (RETRY_DELAYS[attempt] > 0) await sleep(RETRY_DELAYS[attempt]);
      try {
        const result = await provider.generate(opts.input);

        // Fire-and-forget cost tracking
        const cost = estimateCost(result.provider, result.inputTokens, result.outputTokens);
        void trackUsage({
          provider: result.provider,
          model: result.model,
          task: opts.task,
          inputTokens: result.inputTokens,
          outputTokens: result.outputTokens,
          estimatedCost: cost,
          articleId: opts.articleId,
        });

        return result;
      } catch (err) {
        lastError = err;
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`[router] ${provider.name} attempt ${attempt + 1} failed: ${msg}`);
        // Don't retry on quota errors for Flash — fall through to next provider
        if (msg.includes('429') || msg.toLowerCase().includes('quota')) break;
      }
    }
  }

  throw lastError ?? new Error('[router] All providers failed');
}
