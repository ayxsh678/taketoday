// Source credibility tier system — matches architecture doc tiers

interface SourceTier {
  weight: number;
  tier: 1 | 2 | 3 | 4 | 5;
  label: string;
}

// Tier 1 — Primary Sources (weight 1.0)
const TIER_1_PATTERNS = [
  'sec.gov', 'edgar.sec.gov',
  'federalreserve.gov', 'treasury.gov', 'whitehouse.gov', 'congress.gov',
  'eur-lex.europa.eu', 'legislation.gov.uk',
  'investor.', 'ir.', // investor relations subdomains
];

// Tier 2 — Tier-A Journalism (weight 0.85)
const TIER_2_DOMAINS = new Set([
  'reuters.com', 'apnews.com', 'bloomberg.com', 'wsj.com',
  'nytimes.com', 'ft.com', 'bbc.com', 'bbc.co.uk', 'economist.com',
  'washingtonpost.com', 'theguardian.com', 'npr.org', 'pbs.org',
]);

// Tier 3 — Tier-B Journalism (weight 0.65)
const TIER_3_DOMAINS = new Set([
  'techcrunch.com', 'wired.com', 'theverge.com', 'arstechnica.com',
  'businessinsider.com', 'cnbc.com', 'fortune.com', 'forbes.com',
  'axios.com', 'politico.com', 'theatlantic.com', 'time.com',
  'usatoday.com', 'nbcnews.com', 'abcnews.go.com', 'cbsnews.com',
]);

function extractDomain(url: string): string {
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

export function getSourceTier(url: string): SourceTier {
  const domain = extractDomain(url);
  const lower = url.toLowerCase();

  // Tier 1 — primary/government/regulatory
  if (TIER_1_PATTERNS.some((p) => lower.includes(p))) {
    return { weight: 1.0, tier: 1, label: 'primary_source' };
  }

  // Tier 2 — Tier-A journalism
  if (TIER_2_DOMAINS.has(domain)) {
    return { weight: 0.85, tier: 2, label: 'tier_a_journalism' };
  }

  // Tier 3 — Tier-B journalism
  if (TIER_3_DOMAINS.has(domain)) {
    return { weight: 0.65, tier: 3, label: 'tier_b_journalism' };
  }

  // Tier 4 — aggregators, opinion, blogs
  return { weight: 0.35, tier: 4, label: 'aggregated' };
}

// Credibility score 0-100 from source tier weight
export function tierToCredibilityScore(weight: number): number {
  return Math.round(weight * 100);
}

export interface ConfidenceInputs {
  primarySourceWeight: number;          // 0 (none), 0.85 (tier2), 1.0 (tier1)
  corroboratingSourceWeights: number[]; // weights of each corroborating source found
  isHedged: boolean;
  contradictionStrength: number;        // 0-1, max credibility of contradicting sources
  contradictionCount: number;
  daysSincePublication?: number;
}

// Confidence formula from architecture doc
export function calculateConfidence(inputs: ConfidenceInputs): number {
  // P: primary source contribution (0 or 40 for tier1, 0 or 20 for tier2)
  let P = 0;
  if (inputs.primarySourceWeight >= 1.0) P = 40;
  else if (inputs.primarySourceWeight >= 0.85) P = 20;

  // C: corroboration (each source * 10, capped at 30)
  const C = Math.min(
    inputs.corroboratingSourceWeights.reduce((sum, w) => sum + w * 10, 0),
    30,
  );

  // A: credibility bonus from avg source quality
  const avgWeight =
    inputs.corroboratingSourceWeights.length > 0
      ? inputs.corroboratingSourceWeights.reduce((s, w) => s + w, 0) /
        inputs.corroboratingSourceWeights.length
      : 0.35;
  const A = (avgWeight * 100 - 50) * 0.4;

  // H: hedging penalty
  const H = inputs.isHedged ? 15 : 0;

  // X: contradiction penalty
  const X = inputs.contradictionCount > 0
    ? 20 * inputs.contradictionStrength * Math.min(inputs.contradictionCount, 2)
    : 0;

  // D: age penalty (stale claims lose credibility)
  const D = inputs.daysSincePublication
    ? Math.max(0, (inputs.daysSincePublication - 365) * 0.05)
    : 0;

  return Math.round(Math.max(0, Math.min(100, P + C + A - H - X - D)));
}

export function confidenceToStatus(
  confidence: number,
  contradictionCount: number,
): 'VERIFIED' | 'PARTIALLY_VERIFIED' | 'DISPUTED' | 'UNVERIFIED' {
  if (contradictionCount > 0 && confidence < 50) return 'DISPUTED';
  if (confidence >= 70) return 'VERIFIED';
  if (confidence >= 40) return 'PARTIALLY_VERIFIED';
  return 'UNVERIFIED';
}
