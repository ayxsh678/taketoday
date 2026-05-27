"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/input";
import { AlertCircle, CheckCircle2, Copy, Loader2, Sparkles } from "lucide-react";

// ─── constants ────────────────────────────────────────────────────────────────

const MODES = [
  { value: "rewrite", label: "Rewrite", description: "Journalist rewrite" },
  { value: "summarize", label: "Summarize", description: "2–3 sentence summary" },
  { value: "captions", label: "Captions", description: "3 social captions" },
  { value: "hashtags", label: "Hashtags", description: "Relevant tags" },
  { value: "headlines", label: "Headlines", description: "3 headline variants" },
  { value: "short_format", label: "Short format", description: "Under 100 words" },
  { value: "fact_check", label: "Fact check", description: "Claims to verify" },
  { value: "sentiment", label: "Sentiment", description: "Tone analysis" },
  { value: "bullish", label: "Bullish", description: "Optimistic view" },
  { value: "bearish", label: "Bearish", description: "Risk perspective" },
];

// ─── types ────────────────────────────────────────────────────────────────────

interface AiOutput {
  mode: string;
  provider: string;
  output: string;
  warning?: string;
  inputTokens?: number;
  outputTokens?: number;
}

// ─── component ────────────────────────────────────────────────────────────────

export default function AiPage() {
  const [mode, setMode] = useState("summarize");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState<AiOutput | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleRun() {
    if (input.length < 10 || isRunning) return;
    setIsRunning(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, input }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as { ok: boolean; data: AiOutput };
      setOutput(json.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to run AI mode");
    } finally {
      setIsRunning(false);
    }
  }

  async function handleCopy() {
    if (!output) return;
    await navigator.clipboard.writeText(output.output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-8">
      {/* ── header ── */}
      <div>
        <Badge tone="violet">AI Tools</Badge>
        <h1 className="mt-4 text-2xl font-bold tracking-tight text-white lg:text-4xl">
          AI Tools
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-7 text-zinc-300">
          Claude-powered content operations: rewrite, summarize, caption, fact-check, and more.
        </p>
      </div>

      {/* ── two-column grid ── */}
      <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
        {/* ── LEFT: mode selector + input ── */}
        <div className="space-y-5">
          {/* mode pills */}
          <Card>
            <CardHeader>
              <CardTitle>Mode</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-5">
                {MODES.map((m) => (
                  <button
                    key={m.value}
                    onClick={() => setMode(m.value)}
                    className={`flex flex-col rounded-md border px-3 py-2.5 text-left transition ${
                      mode === m.value
                        ? "border-white/25 bg-white/10 text-white"
                        : "border-white/10 text-zinc-400 hover:text-white"
                    }`}
                  >
                    <span className="text-xs font-medium">{m.label}</span>
                    <span className="mt-0.5 text-[11px] text-zinc-500 leading-tight">
                      {m.description}
                    </span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* input textarea + run button */}
          <Card>
            <CardHeader>
              <CardTitle>Input</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                className="min-h-40"
                placeholder="Paste article text, headline, or notes…"
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
              {error && (
                <div className="flex items-start gap-2 rounded-md border border-red-400/20 bg-red-400/10 px-3 py-2 text-sm text-red-300">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}
              <Button
                variant="primary"
                disabled={input.length < 10 || isRunning}
                onClick={handleRun}
                className="w-full"
              >
                {isRunning ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                {isRunning ? "Running…" : "Run"}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* ── RIGHT: output ── */}
        <Card className="flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Output</CardTitle>
            {output && (
              <div className="flex items-center gap-2">
                <Badge tone={output.provider === "claude" ? "green" : "neutral"}>
                  {output.provider}
                </Badge>
                <button
                  onClick={handleCopy}
                  className="rounded p-1 text-zinc-400 transition hover:text-white"
                  title="Copy output"
                >
                  {copied ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              </div>
            )}
          </CardHeader>
          <CardContent className="flex flex-1 flex-col">
            {!output ? (
              <div className="flex flex-1 items-center justify-center py-16 text-sm text-zinc-500">
                Run a mode to see output here
              </div>
            ) : (
              <div className="space-y-3">
                {output.warning && (
                  <div className="flex items-start gap-2 rounded-md border border-amber-400/20 bg-amber-400/10 px-3 py-2 text-sm text-amber-200">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    {output.warning}
                  </div>
                )}
                <pre className="whitespace-pre-wrap font-mono text-sm text-zinc-200">
                  {output.output}
                </pre>
                {(output.inputTokens != null || output.outputTokens != null) && (
                  <p className="text-xs text-zinc-500">
                    Input: {output.inputTokens ?? "—"} · Output:{" "}
                    {output.outputTokens ?? "—"} tokens
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
