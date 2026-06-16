"use client";

import { useEffect, useState } from "react";
import { AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface Question {
  id: string;
  text: string;
  questionType: string;
  priority: string;
  status: string;
  raisedCount: number;
  importanceScore: number;
  storyChainId: string | null;
  createdAt: string;
  answerArticle: { id: string; headline: string } | null;
}

type StatusFilter = "ALL" | "OPEN" | "ANSWERED" | "PARTIALLY_ANSWERED" | "UNANSWERABLE";

const STATUS_TABS: { value: StatusFilter; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "OPEN", label: "Open" },
  { value: "ANSWERED", label: "Answered" },
  { value: "PARTIALLY_ANSWERED", label: "Partial" },
  { value: "UNANSWERABLE", label: "Stale" },
];

function priorityTone(p: string): "red" | "amber" | "blue" | "neutral" {
  if (p === "CRITICAL") return "red";
  if (p === "HIGH") return "amber";
  if (p === "MEDIUM") return "blue";
  return "neutral";
}

function statusTone(s: string): "green" | "amber" | "blue" | "neutral" {
  if (s === "ANSWERED") return "green";
  if (s === "OPEN") return "amber";
  if (s === "PARTIALLY_ANSWERED") return "blue";
  return "neutral";
}

export default function QuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("OPEN");

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ limit: "50" });
    if (statusFilter !== "ALL") params.set("status", statusFilter);

    fetch(`/api/admin/intelligence/questions?${params}`)
      .then((r) => r.json())
      .then((j) => setQuestions((j.data as { questions: Question[] }).questions ?? []))
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, [statusFilter]);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold" style={{ color: "var(--adm-text-1)" }}>
          Question Explorer
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--adm-text-2)" }}>
          Investigative questions raised by the intelligence pipeline
        </p>
      </div>

      {/* status filter tabs */}
      <div className="flex gap-1">
        {STATUS_TABS.map(({ value, label }) => (
          <Button
            key={value}
            variant={statusFilter === value ? "primary" : "secondary"}
            onClick={() => setStatusFilter(value)}
            className="text-xs"
          >
            {label}
          </Button>
        ))}
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-md border p-3 text-sm"
          style={{ borderColor: "var(--adm-accent-red)", color: "var(--adm-accent-red)" }}>
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      {loading && (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-lg"
              style={{ background: "var(--adm-surface-2)" }} />
          ))}
        </div>
      )}

      {!loading && questions.length === 0 && (
        <p className="py-10 text-center text-sm" style={{ color: "var(--adm-text-3)" }}>
          No questions with status &quot;{statusFilter.toLowerCase()}&quot;.
        </p>
      )}

      <div className="space-y-2">
        {questions.map((q) => (
          <Card key={q.id}>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-medium leading-snug" style={{ color: "var(--adm-text-1)" }}>
                  {q.text}
                </p>
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  <div className="flex gap-1.5">
                    <Badge tone={priorityTone(q.priority)}>{q.priority}</Badge>
                    <Badge tone={statusTone(q.status)}>{q.status}</Badge>
                  </div>
                  <Badge tone="neutral" className="text-xs">{q.questionType}</Badge>
                </div>
              </div>
              <div className="mt-2 flex items-center gap-3 text-xs" style={{ color: "var(--adm-text-3)" }}>
                <span>Raised {q.raisedCount}×</span>
                <span>Score {q.importanceScore}</span>
                {q.answerArticle && (
                  <span style={{ color: "var(--adm-accent-green)" }}>
                    Answered by: {q.answerArticle.headline.slice(0, 60)}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
