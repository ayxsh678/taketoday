"use client";

import { useEffect, useState } from "react";
import { Eye, Globe, Link2, TrendingUp } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface AnalyticsData {
  topArticles: { slug: string; headline: string; views: number }[];
  byCountry:   { country:  string; count: number }[];
  byReferrer:  { referrer: string; count: number }[];
  dailyViews:  { day: string;      count: number }[];
}

function Bar({ value, max }: { value: number; max: number }) {
  const pct = max === 0 ? 0 : Math.round((value / max) * 100);
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/8">
      <div className="h-full rounded-full bg-white/30 transition-all" style={{ width: `${pct}%` }} />
    </div>
  );
}

function Row({ label, value, max }: { label: string; value: number; max: number }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className="line-clamp-1 text-sm text-zinc-300">{label}</span>
        <span className="shrink-0 text-xs text-zinc-500">{value.toLocaleString()}</span>
      </div>
      <Bar value={value} max={max} />
    </div>
  );
}

export function AnalyticsWidget() {
  const [data, setData]       = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void fetch("/api/admin/analytics")
      .then((r) => r.json())
      .then((j) => { setData((j as { data: AnalyticsData }).data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader><CardTitle>Analytics</CardTitle></CardHeader>
        <CardContent><p className="text-sm text-zinc-500">Loading…</p></CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const maxViews    = Math.max(...data.topArticles.map((a) => a.views),   1);
  const maxCountry  = Math.max(...data.byCountry.map((c)  => c.count),    1);
  const maxReferrer = Math.max(...data.byReferrer.map((r) => r.count),    1);
  const maxDaily    = Math.max(...data.dailyViews.map((d) => d.count),    1);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-4 w-4" /> Top Articles
          </CardTitle>
          <CardDescription>All time · by total views</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.topArticles.length === 0
            ? <p className="text-sm text-zinc-500">No views yet.</p>
            : data.topArticles.map((a) => (
                <Row key={a.slug} label={a.headline} value={a.views} max={maxViews} />
              ))
          }
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" /> Daily Views
          </CardTitle>
          <CardDescription>Last 7 days</CardDescription>
        </CardHeader>
        <CardContent>
          {data.dailyViews.length === 0
            ? <p className="text-sm text-zinc-500">No data yet.</p>
            : (
              <div className="flex items-end gap-1.5" style={{ height: 96 }}>
                {data.dailyViews.map((d) => (
                  <div key={d.day} className="flex flex-1 flex-col items-center gap-1">
                    <div
                      className="w-full rounded-sm bg-white/20 transition-all"
                      style={{ height: Math.max(4, (d.count / maxDaily) * 80) }}
                      title={`${d.day}: ${d.count}`}
                    />
                    <span className="text-[9px] text-zinc-600">{d.day.split(" ")[0]}</span>
                  </div>
                ))}
              </div>
            )
          }
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-4 w-4" /> By Country
          </CardTitle>
          <CardDescription>Last 30 days</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.byCountry.length === 0
            ? <p className="text-sm text-zinc-500">No data yet.</p>
            : data.byCountry.map((c) => (
                <Row key={c.country} label={c.country} value={c.count} max={maxCountry} />
              ))
          }
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-4 w-4" /> Traffic Sources
          </CardTitle>
          <CardDescription>Last 30 days</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.byReferrer.length === 0
            ? <p className="text-sm text-zinc-500">No data yet.</p>
            : data.byReferrer.map((r) => (
                <Row key={r.referrer} label={r.referrer} value={r.count} max={maxReferrer} />
              ))
          }
        </CardContent>
      </Card>
    </div>
  );
}
