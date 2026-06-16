import 'server-only';
import { appConfig } from '@/lib/config/app';

export interface NewsArticle {
  headline: string;
  url: string;
  snippet: string;
  publishedDate?: string;
  source?: string;
}

export interface NewsHistoryToolOutput {
  query: string;
  articles: NewsArticle[];
  count: number;
}

// Search Serper's news endpoint for historical news articles
export async function runNewsHistory(
  query: string,
  opts: { dateRange?: 'week' | 'month' | 'year' | 'all'; numResults?: number } = {},
): Promise<NewsHistoryToolOutput> {
  if (!appConfig.serperApiKey) {
    return { query, articles: [], count: 0 };
  }

  const { dateRange = 'year', numResults = 5 } = opts;

  // Serper date filter values for news
  const tbsMap: Record<string, string | undefined> = {
    week: 'qdr:w',
    month: 'qdr:m',
    year: 'qdr:y',
    all: undefined,
  };
  const tbs = tbsMap[dateRange];

  const body: Record<string, unknown> = { q: query, num: numResults, gl: 'us', hl: 'en' };
  if (tbs) body.tbs = tbs;

  try {
    const response = await fetch('https://google.serper.dev/news', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': appConfig.serperApiKey,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) return { query, articles: [], count: 0 };

    const data = (await response.json()) as {
      news?: Array<{
        title: string;
        link: string;
        snippet: string;
        date?: string;
        source?: string;
      }>;
    };

    const articles: NewsArticle[] = (data.news ?? []).map((r) => ({
      headline: r.title,
      url: r.link,
      snippet: r.snippet,
      publishedDate: r.date,
      source: r.source,
    }));

    return { query, articles, count: articles.length };
  } catch {
    return { query, articles: [], count: 0 };
  }
}
