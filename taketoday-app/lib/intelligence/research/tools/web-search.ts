import 'server-only';
import { searchWeb } from '@/lib/intelligence/verification/searcher';

export interface WebSearchResult {
  url: string;
  title: string;
  snippet: string;
  domain: string;
  publishedDate?: string;
}

export interface WebSearchToolOutput {
  query: string;
  results: WebSearchResult[];
  count: number;
}

export async function runWebSearch(query: string, numResults = 5): Promise<WebSearchToolOutput> {
  const results = await searchWeb(query, numResults);
  return { query, results, count: results.length };
}
