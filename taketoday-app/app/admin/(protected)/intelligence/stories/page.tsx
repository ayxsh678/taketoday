"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Brain, AlertCircle } from "lucide-react";
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

function relativeTime(dateStr: string): string {
  const mins = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function importanceBadge(score: number) {
  if (score >= 75) return { tone: "violet" as const, label: "High" };
  if (score >= 55) return { tone: "blue" as const, label: "Medium" };
  return { tone: "neutral" as const, label: "Low" };
}

export default function StoryChainsPage() {
  const [chains, setChains] = useState<StoryChain[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetch("/api/admin/intelligence/stories?limit=50")
      .then((r) => r.json())
      .then((j) => setChains((j.data as { chains: StoryChain[] }).chains ?? []))
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold" style={{ color: "var(--adm-text-1)" }}>
            Story Chains
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--adm-text-2)" }}>
            Living narrative containers — articles grouped by developing story
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-md border p-3 text-sm"
          style={{ borderColor: "var(--adm-accent-red)", color: "var(--adm-accent-red)" }}>
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      {loading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-36 animate-pulse rounded-xl"
              style={{ background: "var(--adm-surface-2)" }} />
          ))}
        </div>
      )}

      {!loading && chains.length === 0 && (
        <div className="flex flex-col items-center gap-4 rounded-xl border py-16"
          style={{ borderColor: "var(--adm-border)", background: "var(--adm-surface-1)" }}>
          <Brain className="h-10 w-10 opacity-30" style={{ color: "var(--adm-accent-purple)" }} />
          <p className="text-sm" style={{ color: "var(--adm-text-2)" }}>
            No story chains yet. The intelligence pipeline creates them automatically.
          </p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {chains.map((chain) => {
          const badge = importanceBadge(chain.importanceScore);
          return (
            <Card key={chain.id} className="flex flex-col">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="line-clamp-2 text-sm leading-snug">
                    {chain.title}
                  </CardTitle>
                  <Badge tone={badge.tone}>{badge.label}</Badge>
                </div>
                {chain.livingNarrative && (
                  <CardDescription className="line-clamp-2 text-xs">
                    {chain.livingNarrative}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="mt-auto pt-0">
                <div className="flex items-center justify-between">
                  <div className="flex gap-4 text-xs" style={{ color: "var(--adm-text-3)" }}>
                    <span>{chain.totalArticles} articles</span>
                    <span>{chain.totalQuestions} questions</span>
                    <span>{chain._count.predictions} predictions</span>
                  </div>
                  <Link href={`/admin/intelligence/stories/${chain.id}`}>
                    <Button variant="ghost" className="h-7 gap-1 px-2 text-xs">
                      View <ArrowUpRight className="h-3 w-3" />
                    </Button>
                  </Link>
                </div>
                <p className="mt-1.5 text-xs" style={{ color: "var(--adm-text-3)" }}>
                  Updated {relativeTime(chain.lastUpdated)}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
