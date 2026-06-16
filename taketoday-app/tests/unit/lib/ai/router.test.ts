import { describe, it, expect } from 'vitest';
import { selectProvider } from '@/lib/ai/router';

describe('selectProvider', () => {
  it('routes Tier 1 tasks to gemini-flash', () => {
    const tasks = [
      'category_classification',
      'tag_generation',
      'seo_metadata',
      'headline_generation',
      'summary_generation',
      'social_caption',
      'twitter_post',
      'excerpt_generation',
      'content_moderation',
      'duplicate_detection',
    ] as const;

    for (const task of tasks) {
      expect(selectProvider({ task }).name).toBe('gemini-flash');
    }
  });

  it('routes article_generation to gemini-pro', () => {
    expect(selectProvider({ task: 'article_generation' }).name).toBe('gemini-pro');
  });

  it('routes carousel_generation to gemini-pro', () => {
    expect(selectProvider({ task: 'carousel_generation' }).name).toBe('gemini-pro');
  });

  it('routes claim_extraction to gemini-pro', () => {
    expect(selectProvider({ task: 'claim_extraction' }).name).toBe('gemini-pro');
  });

  it('routes verification HIGH risk to gpt-55', () => {
    expect(selectProvider({ task: 'verification', risk: 'HIGH' }).name).toBe('gpt-55');
  });

  it('routes verification LOW risk to gemini-pro', () => {
    expect(selectProvider({ task: 'verification', risk: 'LOW' }).name).toBe('gemini-pro');
  });

  it('routes verification for politics category to gpt-55 regardless of risk', () => {
    expect(selectProvider({ task: 'verification', category: 'politics', risk: 'LOW' }).name).toBe('gpt-55');
  });

  it('routes verification for finance category to gpt-55', () => {
    expect(selectProvider({ task: 'verification', category: 'finance' }).name).toBe('gpt-55');
  });

  it('routes fact_check HIGH risk to gpt-55', () => {
    expect(selectProvider({ task: 'fact_check', risk: 'HIGH' }).name).toBe('gpt-55');
  });

  it('routes fact_check MEDIUM risk for legal category to gpt-55', () => {
    expect(selectProvider({ task: 'fact_check', category: 'legal', risk: 'MEDIUM' }).name).toBe('gpt-55');
  });

  it('routes fact_check LOW risk neutral category to gemini-pro', () => {
    expect(selectProvider({ task: 'fact_check', category: 'entertainment', risk: 'LOW' }).name).toBe('gemini-pro');
  });
});
