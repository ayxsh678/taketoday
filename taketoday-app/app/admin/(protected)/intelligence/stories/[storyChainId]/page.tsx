"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, FileText, HelpCircle, TrendingUp, BookOpen,
  ExternalLink, RefreshCw, AlertCircle, CheckCircle2, Clock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// ─── types ────────────────────────────────────────────────────────────────────

interface StoryChain {
  id: string;
  title: string;
  slug: string;
  livingNarrative: string | null;
  importanceScore: number;
  totalArticles: number;
  totalQuestions: number;
  unresolvedThreads: string[];
  lastUpdated: string;
}

interface Article {
  id: string;
  headline: string;
  slug: string;
  publishedAt: string | null;
  importanceScore: number;
  status: string;
}

interface Question {
  id: string;
  text: string;
  questionType: string;
  priority: string;
  status: string;
  raisedCount: number;
  importanceScore: number;
}

interface Prediction {
  id: string;
  text: string;
  predictionType: string;
  confidence: number;
  timeframe: string | null;
  status: string;
  basis: string | null;
}

interface Dossier {
  id: string;
  title: string;
  executiveSummary: string | null;
  keyFindings: string[];
  openQuestions: string[];
  confidenceScore: number;
  generatedAt: string;
}

interface ChainDetail {
  chain: StoryChain;
  articles: Article[];
  questions: Question[];
  predictions: Prediction[];
  dossier: Dossier | null;
}

// ─── helpers ──────────────────────────────────────────────────────────────────

type Tab = "narrative" | "articles" | "questions" | "predictions" | "dossier";

function priorityTone(p: string): "red" | "amber" | "blue" | "neutral" {
  if (p === "CRITICAL") return "red";
  if (p === "HIGH") return "amber";
  if (p === "MEDIUM") return "blue";
  return "neutral";
}

function statusTone(s: string): "green" | "amber" | "neutral" {
  if (s === "VERIFIED" || s === "ANSWERED" || s === "RESOLVED") return "green";
  if (s === "DISPUTED" || s === "OPEN" || s === "ACTIVE") return "amber";
  return "neutral";
}

function relativeTime(dateStr: string): string {
  const mins = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ─── component ────────────────────────────────────────────────────────────────

export default function StoryChainDetailPage() {
  const { storyChainId } = useParams<{ storyChainId: string }>();
  const router = useRouter();
  const [data, setData] = useState<ChainDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("narrative");
  const [running, setRunning] = useState<"research" | "predictions" | null>(null);

  const fetchData = () => {
    setLoading(true);
    fetch(`/api/admin/intelligence/stories/${storyChainId}`)
      .then((r) => r.json())
      .then((j) => setData(j.data as ChainDetail))
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [storyChainId]);

  const runResearch = async () => {
    setRunning("research");
    try {
      await fetch(`/api/admin/intelligence/research/${storyChainId}`, { method: "POST" });
      fetchData();
    } finally {
      setRunning(null);
    }
  };

  const runPredictions = async () => {
    setRunning("predictions");
    try {
      await fetch(`/api/admin/intelligence/predictions/${storyChainId}`, { method: "POST" });
      fetchData();
    } finally {
      setRunning(null);
    }
  };

  if (error) {
    return (
      <div className="flex items-center gap-2 rounded-md border p-4 m-6 text-sm"
        style={{ borderColor: "var(--adm-accent-red)", color: "var(--adm-accent-red)" }}>
        <AlertCircle className="h-4 w-4 shrink-0" /> {error}
      </div>
    );
  }

  const chain = data?.chain;
  const TABS: { id: Tab; label: string; count?: number }[] = [
    { id: "narrative", label: "Narrative" },
    { id: "articles", label: "Articles", count: data?.articles.length },
    { id: "questions", label: "Questions", count: data?.questions.length },
    { id: "predictions", label: "Predictions", count: data?.predictions.length },
    { id: "dossier", label: "Dossier" },
  ];

  return (
    <div className="space-y-6 p-6">
      {/* back + header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <button onClick={() => router.back()} className="mt-1 rounded p-1 transition-colors hover:opacity-70">
            <ArrowLeft className="h-4 w-4" style={{ color: "var(--adm-text-2)" }} />
          </button>
          <div>
            <h1 className="text-xl font-semibold" style={{ color: "var(--adm-text-1)" }}>
              {loading ? "Loading…" : chain?.title}
            </h1>
            <p className="mt-0.5 text-xs" style={{ color: "var(--adm-text-3)" }}>
              {chain && `Updated ${relativeTime(chain.lastUpdated)} · importance ${chain.importanceScore}`}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button
            variant="secondary"
            disabled={running === "research"}
            onClick={runResearch}
            className="gap-1.5 text-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${running === "research" ? "animate-spin" : ""}`} />
            Research
          </Button>
          <Button
            variant="secondary"
            disabled={running === "predictions"}
            onClick={runPredictions}
            className="gap-1.5 text-xs"
          >
            <TrendingUp className="h-3.5 w-3.5" />
            Predict
          </Button>
        </div>
      </div>

      {/* tabs */}
      <div className="flex gap-1 border-b" style={{ borderColor: "var(--adm-border)" }}>
        {TABS.map(({ id, label, count }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className="flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm transition-colors"
            style={{
              borderColor: tab === id ? "var(--adm-accent-blue)" : "transparent",
              color: tab === id ? "var(--adm-text-1)" : "var(--adm-text-3)",
            }}
          >
            {label}
            {count !== undefined && (
              <span className="rounded px-1 text-xs" style={{ background: "var(--adm-surface-2)" }}>
                {count}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-lg"
              style={{ background: "var(--adm-surface-2)" }} />
          ))}
        </div>
      )}

      {/* ── Narrative tab ──────────────────────────────────────────────────── */}
      {!loading && tab === "narrative" && chain && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Living Narrative</CardTitle>
              <CardDescription>Auto-synthesized from article chain</CardDescription>
            </CardHeader>
            <CardContent>
              {chain.livingNarrative ? (
                <p className="text-sm leading-relaxed" style={{ color: "var(--adm-text-1)" }}>
                  {chain.livingNarrative}
                </p>
              ) : (
                <p className="text-sm" style={{ color: "var(--adm-text-3)" }}>
                  Narrative not yet generated. Add more articles to this chain.
                </p>
              )}
            </CardContent>
          </Card>
          {chain.unresolvedThreads.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Unresolved Threads</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {chain.unresolvedThreads.map((t, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0"
                        style={{ color: "var(--adm-accent-amber)" }} />
                      <span style={{ color: "var(--adm-text-2)" }}>{t}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ── Articles tab ───────────────────────────────────────────────────── */}
      {!loading && tab === "articles" && (
        <div className="space-y-2">
          {(data?.articles ?? []).map((article) => (
            <div key={article.id}
              className="flex items-center justify-between rounded-lg border px-4 py-3"
              style={{ borderColor: "var(--adm-border)", background: "var(--adm-surface-1)" }}>
              <div className="min-w-0">
                <p className="truncate text-sm" style={{ color: "var(--adm-text-1)" }}>
                  {article.headline}
                </p>
                <p className="mt-0.5 text-xs" style={{ color: "var(--adm-text-3)" }}>
                  {article.publishedAt ? new Date(article.publishedAt).toLocaleDateString() : "Undated"}
                  {" · "}{article.status.toLowerCase().replace(/_/g, " ")}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Badge tone="neutral">{article.importanceScore}</Badge>
                <Link href={`/admin/content/${article.id}/edit`}>
                  <Button variant="ghost" className="h-7 w-7 p-0">
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>
            </div>
          ))}
          {(data?.articles ?? []).length === 0 && (
            <p className="py-8 text-center text-sm" style={{ color: "var(--adm-text-3)" }}>
              No articles in this chain yet.
            </p>
          )}
        </div>
      )}

      {/* ── Questions tab ──────────────────────────────────────────────────── */}
      {!loading && tab === "questions" && (
        <div className="space-y-2">
          {(data?.questions ?? []).map((q) => (
            <div key={q.id}
              className="rounded-lg border px-4 py-3"
              style={{ borderColor: "var(--adm-border)", background: "var(--adm-surface-1)" }}>
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm" style={{ color: "var(--adm-text-1)" }}>{q.text}</p>
                <div className="flex shrink-0 gap-1.5">
                  <Badge tone={priorityTone(q.priority)}>{q.priority}</Badge>
                  <Badge tone={statusTone(q.status)}>{q.status}</Badge>
                </div>
              </div>
              <p className="mt-1 text-xs" style={{ color: "var(--adm-text-3)" }}>
                {q.questionType} · raised {q.raisedCount}×
              </p>
            </div>
          ))}
          {(data?.questions ?? []).length === 0 && (
            <p className="py-8 text-center text-sm" style={{ color: "var(--adm-text-3)" }}>
              No questions generated yet.
            </p>
          )}
        </div>
      )}

      {/* ── Predictions tab ────────────────────────────────────────────────── */}
      {!loading && tab === "predictions" && (
        <div className="space-y-2">
          {(data?.predictions ?? []).map((pred) => (
            <div key={pred.id}
              className="rounded-lg border px-4 py-3"
              style={{ borderColor: "var(--adm-border)", background: "var(--adm-surface-1)" }}>
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm" style={{ color: "var(--adm-text-1)" }}>{pred.text}</p>
                <div className="flex shrink-0 gap-1.5">
                  <Badge tone={pred.confidence >= 70 ? "green" : pred.confidence >= 50 ? "amber" : "neutral"}>
                    {pred.confidence}%
                  </Badge>
                  <Badge tone={statusTone(pred.status)}>{pred.status}</Badge>
                </div>
              </div>
              <div className="mt-1 flex gap-3 text-xs" style={{ color: "var(--adm-text-3)" }}>
                <span>{pred.predictionType.replace(/_/g, " ")}</span>
                {pred.timeframe && <span>{pred.timeframe}</span>}
              </div>
              {pred.basis && (
                <p className="mt-1.5 text-xs" style={{ color: "var(--adm-text-2)" }}>
                  {pred.basis}
                </p>
              )}
            </div>
          ))}
          {(data?.predictions ?? []).length === 0 && (
            <p className="py-8 text-center text-sm" style={{ color: "var(--adm-text-3)" }}>
              No predictions yet. Click &quot;Predict&quot; to generate.
            </p>
          )}
        </div>
      )}

      {/* ── Dossier tab ────────────────────────────────────────────────────── */}
      {!loading && tab === "dossier" && (
        data?.dossier ? (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Executive Summary</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge tone="green">{data.dossier.confidenceScore}% confidence</Badge>
                    <span className="text-xs" style={{ color: "var(--adm-text-3)" }}>
                      {relativeTime(data.dossier.generatedAt)}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed" style={{ color: "var(--adm-text-1)" }}>
                  {data.dossier.executiveSummary ?? "—"}
                </p>
              </CardContent>
            </Card>
            {data.dossier.keyFindings.length > 0 && (
              <Card>
                <CardHeader><CardTitle className="text-sm">Key Findings</CardTitle></CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {data.dossier.keyFindings.map((f, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0"
                          style={{ color: "var(--adm-accent-green)" }} />
                        <span style={{ color: "var(--adm-text-2)" }}>{f}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
            {data.dossier.openQuestions.length > 0 && (
              <Card>
                <CardHeader><CardTitle className="text-sm">Open Questions (Dossier)</CardTitle></CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {data.dossier.openQuestions.map((q, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0"
                          style={{ color: "var(--adm-accent-amber)" }} />
                        <span style={{ color: "var(--adm-text-2)" }}>{q}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 rounded-xl border py-16"
            style={{ borderColor: "var(--adm-border)", background: "var(--adm-surface-1)" }}>
            <FileText className="h-10 w-10 opacity-30" style={{ color: "var(--adm-accent-blue)" }} />
            <p className="text-sm" style={{ color: "var(--adm-text-2)" }}>
              No research dossier yet. Click &quot;Research&quot; to run the research agent.
            </p>
          </div>
        )
      )}
    </div>
  );
}
