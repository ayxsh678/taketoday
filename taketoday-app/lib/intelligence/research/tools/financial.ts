import 'server-only';
import { appConfig } from '@/lib/config/app';

export interface FinancialToolOutput {
  ticker: string;
  found: boolean;
  name?: string;
  price?: number;
  changePercent?: number;
  marketCap?: number;
  description?: string;
  industry?: string;
  sector?: string;
  error?: string;
}

interface PolygonTickerDetails {
  results?: {
    name?: string;
    description?: string;
    market_cap?: number;
    industry?: string;
    sector?: string;
    branding?: unknown;
  };
}

interface PolygonPrevClose {
  results?: Array<{ c?: number; o?: number }>;
}

// Fetch basic financial data from Polygon.io — used when articles reference public companies
export async function runFinancialData(ticker: string): Promise<FinancialToolOutput> {
  const apiKey = appConfig.polygonApiKey;
  if (!apiKey) {
    return { ticker, found: false, error: 'No Polygon API key configured' };
  }

  const upperTicker = ticker.toUpperCase().trim();

  try {
    const [detailsRes, closeRes] = await Promise.allSettled([
      fetch(`https://api.polygon.io/v3/reference/tickers/${upperTicker}?apiKey=${apiKey}`, {
        signal: AbortSignal.timeout(5000),
      }),
      fetch(`https://api.polygon.io/v2/aggs/ticker/${upperTicker}/prev?adjusted=true&apiKey=${apiKey}`, {
        signal: AbortSignal.timeout(5000),
      }),
    ]);

    const details: PolygonTickerDetails =
      detailsRes.status === 'fulfilled' && detailsRes.value.ok
        ? ((await detailsRes.value.json()) as PolygonTickerDetails)
        : {};

    const closeData: PolygonPrevClose =
      closeRes.status === 'fulfilled' && closeRes.value.ok
        ? ((await closeRes.value.json()) as PolygonPrevClose)
        : {};

    const r = details.results;
    const prev = closeData.results?.[0];

    if (!r && !prev) return { ticker: upperTicker, found: false, error: 'Ticker not found' };

    const price = prev?.c;
    const changePercent = prev?.o && prev?.c ? ((prev.c - prev.o) / prev.o) * 100 : undefined;

    return {
      ticker: upperTicker,
      found: true,
      name: r?.name,
      description: r?.description?.slice(0, 400),
      industry: r?.industry,
      sector: r?.sector,
      marketCap: r?.market_cap,
      price,
      changePercent: changePercent !== undefined ? Math.round(changePercent * 100) / 100 : undefined,
    };
  } catch (err) {
    return { ticker: upperTicker, found: false, error: String(err) };
  }
}
