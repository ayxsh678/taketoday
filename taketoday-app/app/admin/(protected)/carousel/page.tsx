"use client";

import { useState } from "react";
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

const SLIDE_TYPE_TONES: Record<string, "violet" | "blue" | "green" | "amber" | "neutral"> = {
  title: "violet",
  content: "blue",
  stat: "green",
  quote: "amber",
  cta: "neutral",
};

// ─── sub-components ───────────────────────────────────────────────────────────

function SlideCard({ slide, index, total }: { slide: CarouselSlide; index: number; total: number }) {
  const [copied, setCopied] = useState(false);

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
      {/* slide counter */}
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold" style={{ color: "var(--adm-text-3)" }}>
          Slide {slide.slideNumber} / {total}
        </span>
        <Badge tone={SLIDE_TYPE_TONES[slide.type] ?? "neutral"}>{slide.type}</Badge>
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

// ─── main component ───────────────────────────────────────────────────────────

export default function CarouselStudioPage() {
  const [content, setContent] = useState("");
  const [format, setFormat] = useState<CarouselFormat>("instagram");
  const [slideCount, setSlideCount] = useState(6);
  const [brandName, setBrandName] = useState("");
  const [ctaText, setCtaText] = useState("");
  const [tone, setTone] = useState("");
  const [audience, setAudience] = useState("");

  const [carousel, setCarousel] = useState<CarouselOutput | null>(null);
  const [activeSlide, setActiveSlide] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    if (content.length < 10 || isRunning) return;
    setIsRunning(true);
    setError(null);
    setCarousel(null);
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
      const json = (await res.json()) as { ok: boolean; data: { carousel: CarouselOutput } };
      setCarousel(json.data.carousel);
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

      <div className="grid gap-6 lg:grid-cols-[1fr_480px]">
        {/* ── LEFT: config ── */}
        <div className="space-y-5">
          {/* format picker */}
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

          {/* content + options */}
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

              {/* slide count */}
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

              {/* optional fields */}
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

        {/* ── RIGHT: preview ── */}
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
                  onClick={() => setActiveSlide((p) =>
                    Math.min(carousel.slides.length - 1, p + 1)
                  )}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              {/* active slide detail */}
              {slide && (
                <SlideCard slide={slide} index={activeSlide} total={carousel.slideCount} />
              )}

              {/* all slides list */}
              <details className="group">
                <summary className="cursor-pointer select-none text-xs text-zinc-500 hover:text-zinc-300">
                  All {carousel.slideCount} slides
                </summary>
                <div className="mt-3 space-y-3">
                  {carousel.slides.map((s, i) => (
                    <SlideCard key={i} slide={s} index={i} total={carousel.slideCount} />
                  ))}
                </div>
              </details>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
