import 'server-only';
import { callLLMWithTool } from '@/lib/ai/llm';
import {
  listPredictionsForStoryChain,
  resolvePrediction,
  expireOverduePredictions,
} from '@/lib/intelligence/repositories/prediction';

interface OutcomeCheckRaw {
  predictionId: string;
  resolved: boolean;
  correct: boolean;
  evidence: string;
}

interface OutcomeLLMResult {
  outcomes: OutcomeCheckRaw[];
}

export interface OutcomeTrackingResult {
  expired: number;
  resolved: number;
  checked: number;
}

const MAX_PREDICTIONS_TO_CHECK = 5;

// Check whether a new article confirms or refutes active predictions for a story chain.
export async function checkPredictionsAgainstArticle(
  articleId: string,
  storyChainId: string,
  headline: string,
  body: string,
): Promise<OutcomeTrackingResult> {
  // First expire any overdue predictions across all chains (opportunistic maintenance)
  const expired = await expireOverduePredictions();

  const activePredictions = await listPredictionsForStoryChain(storyChainId, 'ACTIVE');
  if (activePredictions.length === 0) return { expired, resolved: 0, checked: 0 };

  const toCheck = activePredictions.slice(0, MAX_PREDICTIONS_TO_CHECK);
  const bodySnippet = body.replace(/<[^>]+>/g, '').slice(0, 1500);
  const predictionList = toCheck
    .map((p, i) => `${i + 1}. [ID:${p.id}] ${p.text}`)
    .join('\n');

  const result = await callLLMWithTool<OutcomeLLMResult>({
    system: [
      'You are a fact-checker verifying whether a news article resolves any open predictions.',
      'Only mark a prediction as resolved if the article contains direct evidence.',
      'Do not infer — if unclear, resolved must be false.',
    ].join(' '),
    user: [
      `Article headline: "${headline}"`,
      '',
      `Article body:\n${bodySnippet}`,
      '',
      'Active predictions to check:',
      predictionList,
    ].join('\n'),
    toolName: 'check_prediction_outcomes',
    toolDescription: 'Report which active predictions the new article confirms or refutes',
    schema: {
      type: 'object' as const,
      properties: {
        outcomes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              predictionId: { type: 'string', description: 'The [ID:...] value' },
              resolved: { type: 'boolean', description: 'True if article definitively confirms or refutes this prediction' },
              correct: { type: 'boolean', description: 'True if prediction was correct, false if refuted (only relevant if resolved=true)' },
              evidence: { type: 'string', description: 'Brief quote or paraphrase from article that resolves it (required if resolved=true)' },
            },
            required: ['predictionId', 'resolved', 'correct'],
          },
        },
      },
      required: ['outcomes'],
    },
    model: 'gpt-4o-mini',
    maxTokens: 600,
    temperature: 0.1,
  });

  let resolved = 0;
  for (const outcome of result.outcomes) {
    if (!outcome.resolved) continue;
    // Validate predictionId is from our candidate list
    if (!toCheck.find((p) => p.id === outcome.predictionId)) continue;
    try {
      await resolvePrediction(
        outcome.predictionId,
        outcome.correct ? 'correct' : 'incorrect',
      );
      resolved++;
    } catch {
      // Non-fatal — prediction may have been resolved concurrently
    }
  }

  return { expired, resolved, checked: toCheck.length };
}
