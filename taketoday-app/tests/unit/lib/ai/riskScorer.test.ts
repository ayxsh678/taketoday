import { describe, it, expect } from 'vitest';
import { scoreRisk, inferRiskFromText } from '@/lib/ai/riskScorer';

describe('scoreRisk', () => {
  it('returns HIGH for politics category', () => {
    expect(scoreRisk({ category: 'politics' })).toBe('HIGH');
  });

  it('returns HIGH for finance category', () => {
    expect(scoreRisk({ category: 'finance' })).toBe('HIGH');
  });

  it('returns HIGH for legal category', () => {
    expect(scoreRisk({ category: 'legal' })).toBe('HIGH');
  });

  it('returns HIGH for investigative category', () => {
    expect(scoreRisk({ category: 'investigative' })).toBe('HIGH');
  });

  it('returns LOW for entertainment category', () => {
    expect(scoreRisk({ category: 'entertainment' })).toBe('LOW');
  });

  it('returns LOW for sports category', () => {
    expect(scoreRisk({ category: 'sports' })).toBe('LOW');
  });

  it('returns HIGH when multiple risk signals present', () => {
    expect(scoreRisk({
      category: 'business',
      hasFinancialData: true,
      hasPoliticalEntities: true,
    })).toBe('HIGH');
  });

  it('returns MEDIUM for moderate signals', () => {
    expect(scoreRisk({
      category: 'technology',
      hasStatistics: true,
      claimCount: 3,
    })).toBe('MEDIUM');
  });

  it('returns LOW for no signals and neutral category', () => {
    expect(scoreRisk({ category: 'technology' })).toBe('LOW');
  });

  it('handles undefined category gracefully', () => {
    expect(scoreRisk({})).toBe('LOW');
  });

  it('returns HIGH for election results (case-insensitive)', () => {
    expect(scoreRisk({ category: 'Election' })).toBe('HIGH');
  });
});

describe('inferRiskFromText', () => {
  it('detects financial data signals', () => {
    const text = 'The company reported $1.2 billion in revenue this quarter';
    expect(inferRiskFromText(text)).toBe('HIGH');
  });

  it('detects political entities', () => {
    const text = 'The president signed new legislation affecting millions';
    expect(inferRiskFromText(text)).toBe('HIGH');
  });

  it('detects legal references', () => {
    const text = 'The court ruled in favor of the plaintiff after a lengthy lawsuit';
    expect(inferRiskFromText(text)).toBe('HIGH');
  });

  it('returns LOW for simple entertainment text', () => {
    const text = 'The film won three awards at the ceremony last night';
    expect(inferRiskFromText(text, 'entertainment')).toBe('LOW');
  });

  it('uses explicit category to override text signals', () => {
    // Category is entertainment → LOW regardless of text
    const text = 'The celebrity said revenue was up';
    expect(inferRiskFromText(text, 'entertainment')).toBe('LOW');
  });
});
