import type { RiskLevel } from './providers/types';

export type { RiskLevel };

export interface RiskInput {
  category?: string;
  claimCount?: number;
  hasFinancialData?: boolean;
  hasPoliticalEntities?: boolean;
  hasLegalReferences?: boolean;
  hasStatistics?: boolean;
}

const HIGH_RISK_CATEGORIES = new Set([
  'politics', 'political', 'finance', 'financial', 'legal', 'law',
  'investigative', 'investigation', 'court', 'election', 'judiciary',
  'regulatory', 'compliance', 'criminal', 'corruption',
]);

const LOW_RISK_CATEGORIES = new Set([
  'entertainment', 'lifestyle', 'culture', 'arts', 'fashion',
  'travel', 'food', 'sports', 'celebrity', 'health and wellness',
]);

export function scoreRisk(input: RiskInput): RiskLevel {
  const cat = (input.category ?? '').toLowerCase().trim();

  if (HIGH_RISK_CATEGORIES.has(cat)) return 'HIGH';
  if (LOW_RISK_CATEGORIES.has(cat)) return 'LOW';

  let score = 0;

  if ((input.claimCount ?? 0) >= 5) score += 2;
  else if ((input.claimCount ?? 0) >= 3) score += 1;

  if (input.hasFinancialData) score += 3;
  if (input.hasPoliticalEntities) score += 3;
  if (input.hasLegalReferences) score += 3;
  if (input.hasStatistics) score += 1;

  if (score >= 3) return 'HIGH';
  if (score >= 1) return 'MEDIUM';
  return 'LOW';
}

export function inferRiskFromText(text: string, category?: string): RiskLevel {
  const lower = text.toLowerCase();

  return scoreRisk({
    category,
    hasFinancialData: /\$[\d,]+|\d+%|revenue|profit|loss|quarter|fiscal|ipo|stock|share|market cap/i.test(lower),
    hasPoliticalEntities: /president|prime minister|senator|minister|parliament|congress|election|vote|democrat|republican|bjp|congress party|policy|legislation/i.test(lower),
    hasLegalReferences: /court|lawsuit|verdict|judge|justice|appeal|arrest|charged|indicted|litigation|settlement|legal|law firm/i.test(lower),
    hasStatistics: /\d+\.\d+%|\d+ million|\d+ billion|per cent|statistic|survey|poll|study found/i.test(lower),
    claimCount: (lower.match(/\b(said|stated|claimed|announced|reported|according to|confirmed|alleged)\b/g) ?? []).length,
  });
}
