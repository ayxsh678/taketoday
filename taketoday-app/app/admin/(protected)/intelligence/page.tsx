"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Brain, BookOpen, HelpCircle, TrendingUp, ChevronRight, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface StoryChain {
  id: string;
  title: string;
  slug: string;
  isActive: boolean;
  importanceScore: number;
  totalArticles: number;
  totalQuestions: number;
  lastUpdated: string;
  livingNarrative: string | null;
  _count: { articles: number; questions: number; predictions: number };
}

interface StatsData {
  chains: StoryChain[];
  count: number;
}

function relativeTime(dateStr: string): string {
  const mins = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function IntelligencePage() {
  const [data, setData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetch("/api/admin/intelligence/stories?limit=6")
      .then((r) => r.json())
      .then((j) => setData(j.data as StatsData))
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, []);

  const chains = data?.chains ?? [];
  const totalArticles = chains.reduce((s, c) => s + c.totalArticles, 0);
  const totalQuestions = chains.reduce((s, c) => s + c.totalQuestions, 0);
  const totalPredictions = chains.reduce((s, c) => s + c._count.predictions, 0);

  return (
    <div className="space-y-8 p-6">
      {/* header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold" style={{ color: "var(--adm-text-1)" }}>
            Intelligence
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--adm-text-2)" }}>
            Living research layer — story chains, open questions, predictions
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/intelligence/stories">
            <Button variant="secondary">Story Chains</Button>
          </Link>
          <Link href="/admin/intelligence/questions">
            <Button variant="secondary">Questions</Button>
          </Link>
        </div>
      </div>

      {/* stat cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { icon: Brain, label: "Story Chains", value: chains.length, accent: "var(--adm-accent-purple)" },
          { icon: BookOpen, label: "Articles Tracked", value: totalArticles, accent: "var(--adm-accent-blue)" },
          { icon: HelpCircle, label: "Open Questions", value: totalQuestions, accent: "var(--adm-accent-amber)" },
          { icon: TrendingUp, label: "Predictions", value: totalPredictions, accent: "var(--adm-accent-green)" },
        ].map(({ icon: Icon, label, value, accent }) => (
          <Card key={label}>
            <CardContent className="pt-5">
              <div className="flex items-center gap-3">
                <div className="rounded-md p-2" style={{ background: `${accent}18` }}>
                  <Icon className="h-4 w-4" style={{ color: accent }} />
                </div>
                <div>
                  <p className="text-2xl font-semibold" style={{ color: "var(--adm-text-1)" }}>
                    {loading ? "—" : value}
                  </p>
                  <p className="text-xs" style={{ color: "var(--adm-text-2)" }}>{label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* recent story chains */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base">Active Story Chains</CardTitle>
            <CardDescription>Recently updated intelligence threads</CardDescription>
          </div>
          <Link href="/admin/intelligence/stories">
            <Button variant="ghost" className="text-xs gap-1">
              View all <ChevronRight className="h-3 w-3" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="flex items-center gap-2 rounded-md border p-3 text-sm"
              style={{ borderColor: "var(--adm-accent-red)", color: "var(--adm-accent-red)" }}>
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}
          {loading && (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 animate-pulse rounded-lg"
                  style={{ background: "var(--adm-surface-2)" }} />
              ))}
            </div>
          )}
          {!loading && chains.length === 0 && (
            <p className="py-8 text-center text-sm" style={{ color: "var(--adm-text-3)" }}>
              No story chains yet. Publish articles to start building intelligence.
            </p>
          )}
          <div className="divide-y" style={{ borderColor: "var(--adm-border-dim)" }}>
            {chains.map((chain) => (
              <Link
                key={chain.id}
                href={`/admin/intelligence/stories/${chain.id}`}
                className="flex items-start justify-between gap-4 py-3 transition-colors hover:opacity-80"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium" style={{ color: "var(--adm-text-1)" }}>
                    {chain.title}
                  </p>
                  {chain.livingNarrative && (
                    <p className="mt-0.5 line-clamp-1 text-xs" style={{ color: "var(--adm-text-2)" }}>
                      {chain.livingNarrative.slice(0, 120)}
                    </p>
                  )}
                  <div className="mt-1 flex items-center gap-3">
                    <span className="text-xs" style={{ color: "var(--adm-text-3)" }}>
                      {chain.totalArticles} articles
                    </span>
                    <span className="text-xs" style={{ color: "var(--adm-text-3)" }}>
                      {chain.totalQuestions} questions
                    </span>
                    <span className="text-xs" style={{ color: "var(--adm-text-3)" }}>
                      {relativeTime(chain.lastUpdated)}
                    </span>
                  </div>
                </div>
                <Badge tone={chain.importanceScore >= 70 ? "violet" : chain.importanceScore >= 50 ? "blue" : "neutral"}>
                  {chain.importanceScore}
                </Badge>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
