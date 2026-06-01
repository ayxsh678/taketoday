"use client";

import { useState, useEffect, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/input";
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Copy,
  CheckCircle2,
  Loader2,
  Sparkles,
  Download,
  ImageIcon,
  ListIcon,
} from "lucide-react";
import type { CarouselOutput, CarouselSlide, CarouselFormat } from "@/lib/ai/tasks/carousel";

// ─── constants ────────────────────────────────────────────────────────────────

const FORMATS: { value: CarouselFormat; label: string; desc: string }[] = [
  { value: "instagram", label: "Instagram", desc: "Visual-first, 5–10 slides" },
  { value: "linkedin", label: "LinkedIn", desc: "Professional, data-driven" },
  { value: "twitter", label: "X / Twitter", desc: "Punchy, 3–5 slides" },
  { value: "educational", label: "Educational", desc: "Step-by-step, numbered" },
  { value: "story", label: "Story", desc: "Vertical, minimal text" },
];

const FORMAT_BADGES: Record<CarouselFormat, "violet" | "blue" | "green" | "amber" | "neutral"> = {
  instagram: "violet",
  linkedin: "blue",
  twitter: "neutral",
  educational: "green",
  story: "amber",
};

const SLIDE_TYPE_TONES: Record<string, "violet" | "blue" | "green" | "amber" | "neutral"> = {
  title: "violet",
  content: "blue",
  stat: "green",
  quote: "amber",
  cta: "neutral",
};

// ─── saved carousel row type ──────────────────────────────────────────────────

interface SavedCarousel {
  id: string;
  format: string;
  slideCount: number;
  title: string;
  status: string;
  articleId: string | null;
  articleHeadline: string | null;
  articleSlug: string | null;
  createdAt: string;
}

// ─── sub-components ───────────────────────────────────────────────────────────

function SlideCard({
  slide,
  index,
  total,
  jobId,
}: {
  slide: CarouselSlide;
  index: number;
  total: number;
  jobId: string | null;
}) {
  const [copied, setCopied] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const slideNum = slide.slideNumber;
  const renderSrc = jobId ? `/api/admin/carousel/${jobId}/slide/${slideNum}` : null;

  async function copyPrompt() {
    await navigator.clipboard.writeText(slide.imagePrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div
      className="relative flex flex-col gap-3 rounded-xl p-4"
      style={{
        background: "var(--adm-surface-2)",
        border: "1px solid var(--adm-border)",
      }}
    >
      {/* rendered preview */}
      {renderSrc && (
        <div className="relative overflow-hidden rounded-lg" style={{ aspectRatio: "1/1" }}>
          {!imgLoaded && (
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{ background: "var(--adm-surface-1)" }}
            >
              <ImageIcon className="h-6 w-6 text-zinc-500" />
            </div>
          )}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={renderSrc}
            alt={`Slide ${slideNum}`}
            className="w-full"
            onLoad={() => setImgLoaded(true)}
            style={{ display: imgLoaded ? "block" : "none" }}
          />
        </div>
      )}

      {/* slide counter + download */}
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold" style={{ color: "var(--adm-text-3)" }}>
          Slide {slide.slideNumber} / {total}
        </span>
        <div className="flex items-center gap-1.5">
          <Badge tone={SLIDE_TYPE_TONES[slide.type] ?? "neutral"}>{slide.type}</Badge>
          {renderSrc && (
            <a
              href={renderSrc}
              download={`slide-${slideNum}.png`}
              className="rounded p-0.5 transition-colors hover:bg-white/6"
              style={{ color: "var(--adm-text-3)" }}
              title="Download PNG"
            >
              <Download className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
      </div>

      {/* heading */}
      <p className="text-base font-bold leading-snug" style={{ color: "var(--adm-text-1)" }}>
        {slide.heading}
      </p>

      {/* body */}
      {slide.body && (
        <p className="text-sm leading-relaxed" style={{ color: "var(--adm-text-2)" }}>
          {slide.body}
        </p>
      )}

      {/* layout hint */}
      <p className="text-[11px]" style={{ color: "var(--adm-text-3)" }}>
        Layout: {slide.layoutHint}
      </p>

      {/* image prompt */}
      <div
        className="rounded-lg px-3 py-2"
        style={{ background: "var(--adm-surface-1)", border: "1px solid var(--adm-border-dim)" }}
      >
        <div className="mb-1 flex items-center justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--adm-text-3)" }}>
            Image prompt
          </span>
          <button
            onClick={copyPrompt}
            className="rounded p-0.5 transition-colors hover:bg-white/6"
            style={{ color: "var(--adm-text-3)" }}
            title="Copy image prompt"
          >
            {copied ? (
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
        <p className="text-[12px] leading-relaxed italic" style={{ color: "var(--adm-text-2)" }}>
          {slide.imagePrompt}
        </p>
      </div>

      {/* visual style */}
      <p className="text-[11px]" style={{ color: "var(--adm-text-3)" }}>
        Style: {slide.visualStyle}
      </p>
    </div>
  );
}

// ─── saved carousels list ─────────────────────────────────────────────────────

function SavedList() {
  const [jobs, setJobs] = useState<SavedCarousel[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [formatFilter, setFormatFilter] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (formatFilter) params.set("format", formatFilter);
      const res = await fetch(`/api/admin/carousels?${params}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json() as { ok: boolean; data: { jobs: SavedCarousel[]; total: number; totalPages: number } };
      setJobs(json.data.jobs);
      setTotal(json.data.total);
      setTotalPages(json.data.totalPages);
    } finally {
      setLoading(false);
    }
  }, [page, formatFilter]);

  useEffect(() => { void load(); }, [load]);

  return (
    <div className="space-y-4">
      {/* filters */}
      <div className="flex items-center gap-3">
        <select
          value={formatFilter}
          onChange={(e) => { setFormatFilter(e.target.value); setPage(1); }}
          className="rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white focus:border-white/25 focus:outline-none"
        >
          <option value="">All formats</option>
          {FORMATS.map((f) => (
            <option key={f.value} value={f.value}>{f.label}</option>
          ))}
        </select>
        <span className="text-sm text-zinc-500">{total} saved</span>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-zinc-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading…
        </div>
      ) : jobs.length === 0 ? (
        <p className="text-sm text-zinc-500">No saved carousels yet.</p>
      ) : (
        <div className="overflow-hidden rounded-xl" style={{ border: "1px solid var(--adm-border)" }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--adm-border)", background: "var(--adm-surface-2)" }}>
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--adm-text-3)" }}>Title</th>
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--adm-text-3)" }}>Format</th>
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--adm-text-3)" }}>Slides</th>
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--adm-text-3)" }}>Article</th>
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--adm-text-3)" }}>Created</th>
                <th className="px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--adm-text-3)" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job, i) => (
                <tr
                  key={job.id}
                  style={{
                    borderBottom: i < jobs.length - 1 ? "1px solid var(--adm-border-dim)" : "none",
                    background: "var(--adm-surface-1)",
                  }}
                >
                  <td className="px-4 py-3 font-medium" style={{ color: "var(--adm-text-1)", maxWidth: 280 }}>
                    <span className="line-clamp-1">{job.title || "—"}</span>
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={FORMAT_BADGES[job.format as CarouselFormat] ?? "neutral"}>{job.format}</Badge>
                  </td>
                  <td className="px-4 py-3" style={{ color: "var(--adm-text-2)" }}>
                    {job.slideCount}
                  </td>
                  <td className="px-4 py-3" style={{ color: "var(--adm-text-2)" }}>
                    {job.articleHeadline ? (
                      <a
                        href={`/admin/content/${job.articleSlug}`}
                        className="line-clamp-1 text-violet-400 hover:text-violet-300 transition-colors"
                        style={{ maxWidth: 180, display: "block" }}
                      >
                        {job.articleHeadline}
                      </a>
                    ) : "—"}
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: "var(--adm-text-3)" }}>
                    {new Date(job.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      {Array.from({ length: job.slideCount }, (_, i) => i + 1).map((n) => (
                        <a
                          key={n}
                          href={`/api/admin/carousel/${job.id}/slide/${n}`}
                          download={`slide-${n}.png`}
                          className="text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors"
                          title={`Download slide ${n}`}
                        >
                          ↓{n}
                        </a>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* pagination */}
      {totalPages > 1 && (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            className="h-8 px-2 text-xs"
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
          >
            ← Prev
          </Button>
          <span className="text-xs text-zinc-500">
            Page {page} / {totalPages}
          </span>
          <Button
            variant="ghost"
            className="h-8 px-2 text-xs"
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next →
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── main component ───────────────────────────────────────────────────────────

export default function CarouselStudioPage() {
  const [tab, setTab] = useState<"studio" | "saved">("studio");

  const [content, setContent] = useState("");
  const [format, setFormat] = useState<CarouselFormat>("instagram");
  const [slideCount, setSlideCount] = useState(6);
  const [brandName, setBrandName] = useState("");
  const [ctaText, setCtaText] = useState("");
  const [tone, setTone] = useState("");
  const [audience, setAudience] = useState("");

  const [carousel, setCarousel] = useState<CarouselOutput | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [activeSlide, setActiveSlide] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    if (content.length < 10 || isRunning) return;
    setIsRunning(true);
    setError(null);
    setCarousel(null);
    setJobId(null);
    setActiveSlide(0);

    try {
      const res = await fetch("/api/admin/carousel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          format,
          slideCount,
          brandName: brandName || undefined,
          ctaText: ctaText || undefined,
          tone: tone || undefined,
          targetAudience: audience || undefined,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as { ok: boolean; data: { carousel: CarouselOutput; jobId: string } };
      setCarousel(json.data.carousel);
      setJobId(json.data.jobId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setIsRunning(false);
    }
  }

  const slide = carousel?.slides[activeSlide];

  return (
    <div className="space-y-8">
      {/* header */}
      <div>
        <Badge tone="violet">Carousel Studio</Badge>
        <h1 className="mt-4 text-2xl font-bold tracking-tight text-white lg:text-4xl">
          Carousel Studio
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-7 text-zinc-300">
          Turn any story, article, or topic into a platform-optimised carousel — slides, image
          prompts, and visual direction included.
        </p>
      </div>

      {/* tabs */}
      <div className="flex items-center gap-1 rounded-lg p-1" style={{ background: "var(--adm-surface-2)", width: "fit-content" }}>
        <button
          onClick={() => setTab("studio")}
          className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            tab === "studio" ? "bg-white/10 text-white" : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          <Sparkles className="h-3.5 w-3.5" />
          Studio
        </button>
        <button
          onClick={() => setTab("saved")}
          className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            tab === "saved" ? "bg-white/10 text-white" : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          <ListIcon className="h-3.5 w-3.5" />
          Saved
        </button>
      </div>

      {/* ── STUDIO TAB ── */}
      {tab === "studio" && (
        <div className="grid gap-6 lg:grid-cols-[1fr_480px]">
          {/* LEFT: config */}
          <div className="space-y-5">
            <Card>
              <CardHeader>
                <CardTitle>Platform format</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-5">
                  {FORMATS.map((f) => (
                    <button
                      key={f.value}
                      onClick={() => setFormat(f.value)}
                      className={`flex flex-col rounded-md border px-3 py-2.5 text-left transition ${
                        format === f.value
                          ? "border-white/25 bg-white/10 text-white"
                          : "border-white/10 text-zinc-400 hover:text-white"
                      }`}
                    >
                      <span className="text-xs font-medium">{f.label}</span>
                      <span className="mt-0.5 text-[11px] leading-tight text-zinc-500">
                        {f.desc}
                      </span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Content &amp; options</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  className="min-h-36"
                  placeholder="Paste article text, a headline, or bullet points to transform into slides…"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                />

                <div className="flex items-center gap-3">
                  <label className="w-28 shrink-0 text-sm text-zinc-400">Slides</label>
                  <input
                    type="range"
                    min={3}
                    max={12}
                    value={slideCount}
                    onChange={(e) => setSlideCount(Number(e.target.value))}
                    className="flex-1 accent-violet-500"
                  />
                  <span className="w-6 text-center text-sm font-semibold text-white">
                    {slideCount}
                  </span>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <input
                    type="text"
                    placeholder="Brand name (optional)"
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:border-white/25 focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder="CTA text (optional)"
                    value={ctaText}
                    onChange={(e) => setCtaText(e.target.value)}
                    className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:border-white/25 focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Tone — e.g. bold, educational (optional)"
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                    className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:border-white/25 focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Target audience (optional)"
                    value={audience}
                    onChange={(e) => setAudience(e.target.value)}
                    className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:border-white/25 focus:outline-none"
                  />
                </div>

                {error && (
                  <div className="flex items-start gap-2 rounded-md border border-red-400/20 bg-red-400/10 px-3 py-2 text-sm text-red-300">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    {error}
                  </div>
                )}

                <Button
                  variant="primary"
                  disabled={content.length < 10 || isRunning}
                  onClick={handleGenerate}
                  className="w-full"
                >
                  {isRunning ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  {isRunning ? "Generating…" : "Generate carousel"}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* RIGHT: preview */}
          <div className="space-y-4">
            {!carousel ? (
              <Card className="flex min-h-80 items-center justify-center">
                <CardContent>
                  <p className="text-center text-sm text-zinc-500">
                    Generated slides will appear here
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* carousel meta */}
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-base font-semibold text-white">{carousel.title}</p>
                        <p className="mt-0.5 text-xs text-zinc-400">
                          {carousel.slideCount} slides · {carousel.format} · {carousel.fontStyle}
                        </p>
                        {jobId && (
                          <p className="mt-1 text-[11px] text-zinc-600">
                            Saved · ID: {jobId}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        {carousel.colorPalette.map((hex) => (
                          <span
                            key={hex}
                            title={hex}
                            className="h-5 w-5 rounded-full border border-white/10"
                            style={{ background: hex }}
                          />
                        ))}
                      </div>
                    </div>
                    {carousel.brandingNotes && (
                      <p className="mt-3 text-xs leading-relaxed text-zinc-400">
                        {carousel.brandingNotes}
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* slide navigator */}
                <div className="flex items-center justify-between gap-2">
                  <Button
                    variant="ghost"
                    className="h-8 w-8 px-0"
                    disabled={activeSlide === 0}
                    onClick={() => setActiveSlide((p) => Math.max(0, p - 1))}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>

                  <div className="flex flex-1 items-center justify-center gap-1">
                    {carousel.slides.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setActiveSlide(i)}
                        className={`h-1.5 rounded-full transition-all ${
                          i === activeSlide ? "w-6 bg-violet-400" : "w-1.5 bg-white/20"
                        }`}
                      />
                    ))}
                  </div>

                  <Button
                    variant="ghost"
                    className="h-8 w-8 px-0"
                    disabled={activeSlide === carousel.slides.length - 1}
                    onClick={() =>
                      setActiveSlide((p) => Math.min(carousel.slides.length - 1, p + 1))
                    }
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>

                {/* active slide detail */}
                {slide && (
                  <SlideCard slide={slide} index={activeSlide} total={carousel.slideCount} jobId={jobId} />
                )}

                {/* all slides list */}
                <details className="group">
                  <summary className="cursor-pointer select-none text-xs text-zinc-500 hover:text-zinc-300">
                    All {carousel.slideCount} slides
                  </summary>
                  <div className="mt-3 space-y-3">
                    {carousel.slides.map((s, i) => (
                      <SlideCard key={i} slide={s} index={i} total={carousel.slideCount} jobId={jobId} />
                    ))}
                  </div>
                </details>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── SAVED TAB ── */}
      {tab === "saved" && <SavedList />}
    </div>
  );
}
