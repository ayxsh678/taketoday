import 'server-only';
import { appConfig } from '@/lib/config/app';

export interface SearchResult {
  url: string;
  title: string;
  snippet: string;
  domain: string;
  publishedDate?: string;
}

// Fetch top organic results from Serper (Google Search API)
export async function searchWeb(query: string, numResults = 5): Promise<SearchResult[]> {
  if (!appConfig.serperApiKey) {
    // No Serper key — return empty so verification degrades gracefully
    return [];
  }

  const response = await fetch('https://google.serper.dev/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-KEY': appConfig.serperApiKey,
    },
    body: JSON.stringify({ q: query, num: numResults, gl: 'us', hl: 'en' }),
  });

  if (!response.ok) {
    console.warn(`[searcher] Serper returned ${response.status} for: ${query}`);
    return [];
  }

  const data = (await response.json()) as {
    organic?: Array<{
      link: string;
      title: string;
      snippet: string;
      date?: string;
    }>;
  };

  return (data.organic ?? []).map((r) => {
    let domain = '';
    try {
      domain = new URL(r.link).hostname.replace(/^www\./, '');
    } catch {
      domain = r.link;
    }
    return {
      url: r.link,
      title: r.title,
      snippet: r.snippet,
      domain,
      publishedDate: r.date,
    };
  });
}

// Search for corroborating sources — articles reporting the same claim
export async function findCorroboratingSources(claimText: string): Promise<SearchResult[]> {
  // Truncate claim to avoid overly long queries
  const query = claimText.slice(0, 120);
  return searchWeb(query, 5);
}

// Search for contradicting sources — use negation framing
export async function findContradictingSources(
  claimText: string,
  subject: string,
): Promise<SearchResult[]> {
  const query = `"${subject}" NOT "${claimText.slice(0, 80)}" contradiction dispute false`;
  return searchWeb(query, 3);
}
