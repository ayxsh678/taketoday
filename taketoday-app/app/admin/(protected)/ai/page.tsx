'use client';

import { useEffect, useState } from 'react';
import {
  BarChart3,
  Bot,
  CircleDollarSign,
  Cpu,
  TrendingDown,
  Zap,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MetricCard } from '@/components/admin/MetricCard';

interface UsageSummary {
  totalCost: number;
  totalCalls: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  estimatedSavings: number;
  savingsPercent: number;
}

interface ModelRow {
  provider: string;
  model: string;
  cost: number;
  calls: number;
  inputTokens: number;
  outputTokens: number;
}

interface TaskRow {
  task: string;
  cost: number;
  calls: number;
}

interface DailyRow {
  date: string;
  cost: number;
  calls: number;
}

interface UsageData {
  period: { days: number; since: string };
  summary: UsageSummary;
  byModel: ModelRow[];
  byTask: TaskRow[];
  daily: DailyRow[];
}

function fmt$(n: number): string {
  if (n < 0.01) return `$${(n * 100).toFixed(4)}¢`;
  return `$${n.toFixed(4)}`;
}

function fmtTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

const PROVIDER_LABELS: Record<string, string> = {
  'gemini-flash': 'Gemini Flash',
  'gemini-pro':   'Gemini Pro',
  'gpt-55':       'GPT-55',
};

const PROVIDER_COLOR: Record<string, string> = {
  'gemini-flash': 'var(--adm-accent-blue)',
  'gemini-pro':   'var(--adm-accent-purple)',
  'gpt-55':       'var(--adm-accent-green)',
};

const DAYS_OPTIONS = [7, 14, 30, 60, 90];

export default function AIUsagePage() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`/api/admin/ai/usage?days=${days}`)
      .then((r) => r.json())
      .then((body) => {
        if (body.ok) setData(body.data as UsageData);
        else setError(body.error ?? 'Unknown error');
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Fetch failed'))
      .finally(() => setLoading(false));
  }, [days]);

  const s = data?.summary;
  const maxDailyCost = data ? Math.max(...data.daily.map((d) => d.cost), 0.001) : 0.001;

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
        <div>
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider"
            style={{
              background: 'rgba(139,92,246,0.10)',
              border: '1px solid rgba(139,92,246,0.22)',
              color: 'var(--adm-accent-purple)',
            }}
          >
            <Bot className="h-3 w-3" />
            AI Intelligence
          </span>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight" style={{ color: 'var(--adm-text-1)' }}>
            AI Usage &amp; Cost
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6" style={{ color: 'var(--adm-text-2)' }}>
            Multi-model routing spend, token usage, and estimated savings from intelligent routing.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {DAYS_OPTIONS.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDays(d)}
              className="rounded-md px-3 py-1.5 text-xs font-medium transition-colors"
              style={
                days === d
                  ? { background: 'var(--adm-accent-purple)', color: '#fff' }
                  : { background: 'var(--adm-surface-2)', border: '1px solid var(--adm-border)', color: 'var(--adm-text-2)' }
              }
            >
              {d}d
            </button>
          ))}
        </div>
      </section>

      {error && (
        <div
          className="rounded-lg px-4 py-3 text-sm"
          style={{
            background: 'rgba(248,113,113,0.08)',
            border: '1px solid rgba(248,113,113,0.2)',
            color: 'var(--adm-accent-red)',
          }}
        >
          {error}
        </div>
      )}

      {loading && !data && (
        <div className="py-20 text-center text-sm" style={{ color: 'var(--adm-text-3)' }}>
          Loading…
        </div>
      )}

      {data && s && (
        <>
          {/* Summary metrics */}
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              label="Total Spend"
              value={fmt$(s.totalCost)}
              delta={`${days}d`}
              icon={CircleDollarSign}
              accent="purple"
            />
            <MetricCard
              label="API Calls"
              value={s.totalCalls.toLocaleString()}
              delta={`${days}d`}
              icon={Zap}
              accent="blue"
            />
            <MetricCard
              label="Tokens Used"
              value={fmtTokens(s.totalInputTokens + s.totalOutputTokens)}
              delta={`${days}d`}
              icon={Cpu}
              accent="amber"
            />
            <MetricCard
              label="Routing Savings"
              value={fmt$(s.estimatedSavings)}
              delta={`-${s.savingsPercent}%`}
              icon={TrendingDown}
              accent="green"
            />
          </section>

          <section className="grid gap-6 lg:grid-cols-2">
            {/* Spend by model */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" style={{ color: 'var(--adm-accent-purple)' }} />
                  Spend by Model
                </CardTitle>
                <CardDescription>Cost and call volume per AI provider.</CardDescription>
              </CardHeader>
              <CardContent>
                {data.byModel.length === 0 ? (
                  <p className="text-sm" style={{ color: 'var(--adm-text-3)' }}>No data yet.</p>
                ) : (
                  <div className="space-y-3">
                    {data.byModel.map((row) => {
                      const pct = s.totalCost > 0 ? (row.cost / s.totalCost) * 100 : 0;
                      const color = PROVIDER_COLOR[row.provider] ?? 'var(--adm-accent-blue)';
                      return (
                        <div key={`${row.provider}-${row.model}`} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span style={{ color: 'var(--adm-text-1)' }}>
                              {PROVIDER_LABELS[row.provider] ?? row.provider}
                            </span>
                            <span style={{ color: 'var(--adm-text-2)' }}>
                              {fmt$(row.cost)} &middot; {row.calls.toLocaleString()} calls
                            </span>
                          </div>
                          <div className="h-1.5 w-full overflow-hidden rounded-full" style={{ background: 'var(--adm-surface-3)' }}>
                            <div
                              className="h-full rounded-full transition-all"
                              style={{ width: `${pct}%`, background: color }}
                            />
                          </div>
                          <p className="text-[11px]" style={{ color: 'var(--adm-text-3)' }}>
                            {fmtTokens(row.inputTokens)} in / {fmtTokens(row.outputTokens)} out
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Spend by task */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="h-4 w-4" style={{ color: 'var(--adm-accent-blue)' }} />
                  Spend by Feature
                </CardTitle>
                <CardDescription>Which tasks consume the most budget.</CardDescription>
              </CardHeader>
              <CardContent>
                {data.byTask.length === 0 ? (
                  <p className="text-sm" style={{ color: 'var(--adm-text-3)' }}>No data yet.</p>
                ) : (
                  <div className="space-y-2">
                    {data.byTask.slice(0, 10).map((row) => {
                      const pct = s.totalCost > 0 ? (row.cost / s.totalCost) * 100 : 0;
                      return (
                        <div key={row.task} className="flex items-center gap-3">
                          <div className="h-1.5 flex-1 overflow-hidden rounded-full" style={{ background: 'var(--adm-surface-3)' }}>
                            <div
                              className="h-full rounded-full"
                              style={{ width: `${pct}%`, background: 'var(--adm-accent-blue)' }}
                            />
                          </div>
                          <span className="w-28 truncate text-right text-xs font-mono" style={{ color: 'var(--adm-text-2)' }}>
                            {row.task.replace(/_/g, ' ')}
                          </span>
                          <span className="w-20 text-right text-xs" style={{ color: 'var(--adm-text-3)' }}>
                            {fmt$(row.cost)}
                          </span>
                          <span className="w-16 text-right text-xs" style={{ color: 'var(--adm-text-3)' }}>
                            {row.calls.toLocaleString()}×
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </section>

          {/* Daily spend chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" style={{ color: 'var(--adm-accent-amber)' }} />
                Daily Spend — Last {days} days
              </CardTitle>
              <CardDescription>Cost per day across all providers.</CardDescription>
            </CardHeader>
            <CardContent>
              {data.daily.length === 0 ? (
                <p className="text-sm" style={{ color: 'var(--adm-text-3)' }}>No daily data yet.</p>
              ) : (
                <div className="flex h-32 items-end gap-px overflow-x-auto">
                  {data.daily.map((day) => {
                    const heightPct = (day.cost / maxDailyCost) * 100;
                    return (
                      <div key={day.date} className="group relative flex flex-1 flex-col items-center" style={{ minWidth: 8 }}>
                        <div
                          className="w-full rounded-sm transition-opacity group-hover:opacity-80"
                          style={{
                            height: `${Math.max(heightPct, 2)}%`,
                            background: 'var(--adm-accent-purple)',
                          }}
                          title={`${day.date}: ${fmt$(day.cost)} (${day.calls} calls)`}
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Savings breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingDown className="h-4 w-4" style={{ color: 'var(--adm-accent-green)' }} />
                Routing Intelligence — Cost Savings
              </CardTitle>
              <CardDescription>
                Estimated savings vs. sending every request to the highest-capability model.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 sm:grid-cols-3">
                <div className="rounded-lg p-4" style={{ background: 'var(--adm-surface-2)', border: '1px solid var(--adm-border)' }}>
                  <p className="text-xs uppercase tracking-wider" style={{ color: 'var(--adm-text-3)' }}>Actual Cost</p>
                  <p className="mt-1 text-2xl font-semibold" style={{ color: 'var(--adm-text-1)' }}>{fmt$(s.totalCost)}</p>
                  <p className="mt-1 text-xs" style={{ color: 'var(--adm-text-3)' }}>Routed across {data.byModel.length} model(s)</p>
                </div>
                <div className="rounded-lg p-4" style={{ background: 'var(--adm-surface-2)', border: '1px solid var(--adm-border)' }}>
                  <p className="text-xs uppercase tracking-wider" style={{ color: 'var(--adm-text-3)' }}>Hypothetical (all GPT-55)</p>
                  <p className="mt-1 text-2xl font-semibold" style={{ color: 'var(--adm-accent-red)' }}>
                    {fmt$(s.totalCost + s.estimatedSavings)}
                  </p>
                  <p className="mt-1 text-xs" style={{ color: 'var(--adm-text-3)' }}>Without intelligent routing</p>
                </div>
                <div className="rounded-lg p-4" style={{ background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.18)' }}>
                  <p className="text-xs uppercase tracking-wider" style={{ color: 'var(--adm-accent-green)' }}>Savings</p>
                  <p className="mt-1 text-2xl font-semibold" style={{ color: 'var(--adm-accent-green)' }}>
                    {fmt$(s.estimatedSavings)}
                  </p>
                  <p className="mt-1 text-xs" style={{ color: 'var(--adm-text-3)' }}>{s.savingsPercent}% reduction</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
