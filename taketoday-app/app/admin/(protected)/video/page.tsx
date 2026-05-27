"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/input";
import { Clock, Film, Plus, RefreshCw, Zap } from "lucide-react";

// ─── types ────────────────────────────────────────────────────────────────────

interface VideoJob {
  id: string;
  script: string;
  voiceProvider: string;
  avatarProvider: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

// ─── helpers ──────────────────────────────────────────────────────────────────

function getStatusBadge(status: string) {
  const map: Record<string, "neutral" | "blue" | "green" | "red"> = {
    queued: "neutral",
    running: "blue",
    succeeded: "green",
    failed: "red",
  };
  const tone = map[status] ?? "neutral";
  return <Badge tone={tone}>{status}</Badge>;
}

function fmtDate(str: string) {
  return new Date(str).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ─── component ────────────────────────────────────────────────────────────────

export default function VideoPage() {
  const [jobs, setJobs] = useState<VideoJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [script, setScript] = useState("");
  const [voiceProvider, setVoiceProvider] = useState("elevenlabs");
  const [avatarProvider, setAvatarProvider] = useState("heygen");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  async function fetchJobs() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/video");
      if (res.status === 404) {
        setJobs([]);
        return;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as { ok: boolean; data: { jobs: VideoJob[] } };
      setJobs(json.data.jobs);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load video jobs");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void fetchJobs();
  }, []);

  async function handleSubmit() {
    if (script.length < 20 || isSubmitting) return;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/admin/video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ script, voiceProvider, avatarProvider }),
      });
      if (res.status === 404) {
        setSubmitError("Video API not configured yet.");
        return;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as { ok: boolean; data: { job: VideoJob } };
      setJobs((prev) => [json.data.job, ...prev]);
      setScript("");
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Failed to submit job");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* ── header ── */}
      <div>
        <Badge tone="violet">Video Studio</Badge>
        <h1 className="mt-4 text-2xl font-bold tracking-tight text-white lg:text-4xl">
          Video Studio
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-7 text-zinc-300">
          Queue short-form video jobs powered by voice and avatar synthesis.
        </p>
      </div>

      {/* ── create job form ── */}
      <Card>
        <CardHeader>
          <CardTitle>New video job</CardTitle>
          <CardDescription>
            Write a script, choose voice and avatar providers, then submit.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            className="min-h-32"
            placeholder="Paste or write the video script…"
            value={script}
            onChange={(e) => setScript(e.target.value)}
          />

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-400">Voice provider</label>
              <select
                value={voiceProvider}
                onChange={(e) => setVoiceProvider(e.target.value)}
                className="h-9 w-full rounded-md border border-white/10 bg-zinc-950/60 px-3 text-sm text-white outline-none transition focus:border-white/25"
              >
                <option value="elevenlabs">ElevenLabs</option>
                <option value="openai">OpenAI</option>
                <option value="polly">Amazon Polly</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-400">Avatar provider</label>
              <select
                value={avatarProvider}
                onChange={(e) => setAvatarProvider(e.target.value)}
                className="h-9 w-full rounded-md border border-white/10 bg-zinc-950/60 px-3 text-sm text-white outline-none transition focus:border-white/25"
              >
                <option value="heygen">HeyGen</option>
                <option value="synthesia">Synthesia</option>
                <option value="d-id">D-ID</option>
              </select>
            </div>
          </div>

          {submitError && (
            <p className="text-sm text-red-300">{submitError}</p>
          )}

          <Button
            variant="primary"
            disabled={script.length < 20 || isSubmitting}
            onClick={handleSubmit}
            className="w-full"
          >
            {isSubmitting ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Film className="h-4 w-4" />
            )}
            {isSubmitting ? "Submitting…" : "Submit job"}
          </Button>
        </CardContent>
      </Card>

      {/* ── jobs table ── */}
      {loading ? (
        <Card>
          <CardContent className="h-32 animate-pulse rounded-lg bg-white/4" />
        </Card>
      ) : error ? (
        <div className="rounded-lg border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Video jobs</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {jobs.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-16 text-zinc-500">
                <Film className="h-8 w-8 opacity-30" />
                <p className="text-sm">No video jobs queued yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-left text-xs text-zinc-500">
                      <th className="px-4 py-2.5 font-medium">ID</th>
                      <th className="px-4 py-2.5 font-medium">Script</th>
                      <th className="px-4 py-2.5 font-medium">Voice</th>
                      <th className="px-4 py-2.5 font-medium">Avatar</th>
                      <th className="px-4 py-2.5 font-medium">Status</th>
                      <th className="px-4 py-2.5 font-medium">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {jobs.map((job, i) => (
                      <tr
                        key={job.id}
                        className={`text-zinc-300 ${
                          i < jobs.length - 1 ? "border-b border-white/10" : ""
                        }`}
                      >
                        <td className="px-4 py-3 font-mono text-xs text-zinc-400">
                          {job.id.slice(0, 8)}…
                        </td>
                        <td className="px-4 py-3 max-w-xs">
                          <span className="text-sm text-zinc-300">
                            {job.script.length > 60
                              ? `${job.script.slice(0, 60)}…`
                              : job.script}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-zinc-400">{job.voiceProvider}</td>
                        <td className="px-4 py-3 text-xs text-zinc-400">{job.avatarProvider}</td>
                        <td className="px-4 py-3">{getStatusBadge(job.status)}</td>
                        <td className="px-4 py-3 text-xs text-zinc-500">{fmtDate(job.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
