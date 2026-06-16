import 'server-only';
import { callLLMWithTool } from '@/lib/ai/llm';
import type { PredictionType } from '@prisma/client';
import type { WatchSignal } from '@/lib/intelligence/types';
import type { DetectedSignals } from './signal-detector';

export interface GeneratedPrediction {
  text: string;
  predictionType: PredictionType;
  confidence: number;
  timeframe: string;
  targetDate?: Date;
  basis: string;
  historicalPatterns: string[];
  signals: WatchSignal[];
}

interface RawPrediction {
  text: string;
  predictionType: string;
  confidence: number;
  timeframe: string;
  targetDateISO?: string;
  basis: string;
  historicalPatterns: string[];
  triggerKeywords: string[];
}

interface GeneratorLLMResult {
  predictions: RawPrediction[];
}

const VALID_TYPES: Set<PredictionType> = new Set([
  'NEXT_EVENT',
  'EMERGING_RISK',
  'ENTITY_ACTION',
  'MARKET_MOVE',
  'REGULATORY_ACTION',
  'ESCALATION',
]);

// Generate forward-looking predictions for a story chain using signal context + LLM.
export async function generatePredictions(opts: {
  chainTitle: string;
  livingNarrative: string;
  keyFindings: string[];
  signals: DetectedSignals;
  existingPredictionTexts: string[];
}): Promise<GeneratedPrediction[]> {
  const { chainTitle, livingNarrative, keyFindings, signals, existingPredictionTexts } = opts;

  const signalContext = [
    signals.watchSignals.length > 0
      ? `Active signals:\n${signals.watchSignals.map((s) => `- ${s.description}`).join('\n')}`
      : '',
    signals.escalationDetected ? '⚠ Escalation pattern detected in story links' : '',
    signals.contradictionDetected ? '⚠ Contradictions detected in recent coverage' : '',
    signals.predictiveClaims.length > 0
      ? `Predictive claims from articles:\n${signals.predictiveClaims.map((c) => `- ${c}`).join('\n')}`
      : '',
    signals.riskFactors.length > 0
      ? `Risk factors:\n${signals.riskFactors.map((r) => `- [${r.impact}/${r.likelihood}] ${r.description}`).join('\n')}`
      : '',
  ]
    .filter(Boolean)
    .join('\n\n');

  const existingNote =
    existingPredictionTexts.length > 0
      ? `\n\nAlready predicted (do not duplicate):\n${existingPredictionTexts.map((t) => `- ${t}`).join('\n')}`
      : '';

  const result = await callLLMWithTool<GeneratorLLMResult>({
    system: [
      'You are a forecasting analyst for a news intelligence system.',
      'Generate specific, falsifiable predictions about what will happen next in this story.',
      'Predictions must be grounded in the evidence — do not hallucinate facts.',
      'Each prediction must have a clear timeframe and be verifiable by a future news article.',
      'Prefer concrete predictions over vague ones.',
    ].join(' '),
    user: [
      `Story: "${chainTitle}"`,
      '',
      livingNarrative ? `Current narrative:\n${livingNarrative}` : '',
      '',
      keyFindings.length > 0 ? `Key findings:\n${keyFindings.map((f) => `- ${f}`).join('\n')}` : '',
      '',
      signalContext,
      existingNote,
    ]
      .filter(Boolean)
      .join('\n'),
    toolName: 'generate_predictions',
    toolDescription: 'Generate forward-looking predictions for this story chain',
    schema: {
      type: 'object' as const,
      properties: {
        predictions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              text: {
                type: 'string',
                description: 'The prediction statement. Specific and falsifiable. Max 50 words.',
              },
              predictionType: {
                type: 'string',
                enum: ['NEXT_EVENT', 'EMERGING_RISK', 'ENTITY_ACTION', 'MARKET_MOVE', 'REGULATORY_ACTION', 'ESCALATION'],
              },
              confidence: {
                type: 'number',
                description: 'Confidence 0-100 based on signal strength and historical patterns',
                minimum: 10,
                maximum: 95,
              },
              timeframe: {
                type: 'string',
                description: 'Human-readable timeframe, e.g. "2-4 weeks", "3 months", "Q3 2026"',
              },
              targetDateISO: {
                type: 'string',
                description: 'Optional ISO date YYYY-MM-DD for the expected resolution date',
              },
              basis: {
                type: 'string',
                description: 'Evidence-based reasoning for this prediction. Max 60 words.',
              },
              historicalPatterns: {
                type: 'array',
                items: { type: 'string' },
                description: 'Similar historical precedents that support this prediction. 0-3 items.',
                maxItems: 3,
              },
              triggerKeywords: {
                type: 'array',
                items: { type: 'string' },
                description: 'Keywords that would confirm or refute this prediction if seen in news',
                maxItems: 5,
              },
            },
            required: ['text', 'predictionType', 'confidence', 'timeframe', 'basis', 'triggerKeywords'],
          },
          description: 'Array of 2-4 predictions',
          minItems: 2,
          maxItems: 4,
        },
      },
      required: ['predictions'],
    },
    model: 'gpt-4o-mini',
    maxTokens: 1800,
    temperature: 0.4,
  });

  return result.predictions
    .filter((p) => VALID_TYPES.has(p.predictionType as PredictionType))
    .map((p) => {
      // Build WatchSignal from triggerKeywords
      const signal: WatchSignal = {
        description: p.text,
        entityToMonitor: '',
        triggerKeywords: p.triggerKeywords ?? [],
        importance: p.confidence >= 70 ? 'high' : p.confidence >= 50 ? 'medium' : 'low',
      };

      return {
        text: p.text,
        predictionType: p.predictionType as PredictionType,
        confidence: Math.min(95, Math.max(10, Math.round(p.confidence))),
        timeframe: p.timeframe,
        targetDate: p.targetDateISO ? new Date(p.targetDateISO) : undefined,
        basis: p.basis,
        historicalPatterns: p.historicalPatterns ?? [],
        signals: [signal],
      };
    });
}
