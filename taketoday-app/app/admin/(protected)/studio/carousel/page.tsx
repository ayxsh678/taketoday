"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight, Download, Image, RefreshCw, Send } from "lucide-react";

type Slide = { headline: string; body: string; cta: string };
type Draft = { draftId: string; slides: Slide[]; hashtags: string[]; caption: string };
type Article = { id: string; headline: string; featuredImage?: { url: string } | null };

const TONES = ["Breaking", "Explainer", "Opinion", "Listicle"] as const;

// ─── Editorial slide template ──────────────────────────────────────────────
// Matches the @taketoday.co design: dark bg, full-bleed photo, serif headline
type SlideTemplateProps = {
  slide: Slide;
  index: number;
  total: number;
  imageUrl: string;
  innerRef?: React.RefCallback<HTMLDivElement>;
};

function SlideTemplate({ slide, index, total, imageUrl, innerRef }: SlideTemplateProps) {
  return (
    <div
      ref={innerRef}
      style={{
        width: 360,
        height: 360,
        position: "relative",
        overflow: "hidden",
        backgroundColor: "#0d0d0d",
        fontFamily: "Georgia, 'Times New Roman', serif",
        flexShrink: 0,
      }}
    >
      {/* Full-bleed background photo */}
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl}
          alt=""
          crossOrigin="anonymous"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center",
          }}
        />
      ) : null}

      {/* Dark gradient: opaque at top, transparent toward bottom */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: imageUrl
            ? "linear-gradient(to bottom, rgba(8,8,8,0.92) 0%, rgba(8,8,8,0.80) 45%, rgba(8,8,8,0.45) 70%, rgba(8,8,8,0.15) 100%)"
            : "rgba(8,8,8,0.97)",
        }}
      />

      {/* Left accent bar */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: 5,
          backgroundColor: "#ffffff",
        }}
      />

      {/* Content */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          padding: "28px 28px 28px 36px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-start",
        }}
      >
        {/* Headline */}
        <h2
          style={{
            margin: 0,
            fontFamily: "Georgia, 'Times New Roman', serif",
            fontSize: 26,
            fontWeight: 900,
            lineHeight: 1.12,
            textTransform: "uppercase",
            color: "#EAD9B8",
            letterSpacing: "0.01em",
            wordBreak: "break-word",
          }}
        >
          {slide.headline}
        </h2>

        {/* Divider */}
        <div
          style={{
            height: 1,
            backgroundColor: "rgba(255,255,255,0.35)",
            margin: "14px 0",
            flexShrink: 0,
          }}
        />

        {/* Body */}
        <p
          style={{
            margin: 0,
            fontFamily: "Georgia, 'Times New Roman', serif",
            fontSize: 13,
            fontWeight: 400,
            lineHeight: 1.55,
            color: "rgba(255,255,255,0.88)",
          }}
        >
          {slide.body}
        </p>
      </div>

      {/* Slide counter */}
      <div
        style={{
          position: "absolute",
          bottom: 14,
          left: 36,
          fontSize: 10,
          color: "rgba(255,255,255,0.45)",
          fontFamily: "Georgia, serif",
          letterSpacing: "0.06em",
        }}
      >
        {index + 1} / {total}
      </div>

      {/* Watermark */}
      <div
        style={{
          position: "absolute",
          bottom: 14,
          right: 18,
          fontSize: 11,
          color: "rgba(255,255,255,0.55)",
          fontFamily: "Georgia, serif",
          fontStyle: "italic",
          letterSpacing: "0.02em",
        }}
      >
        @taketoday.co
      </div>
    </div>
  );
}

// ─── Channel selector modal ────────────────────────────────────────────────
type ChannelModalProps = {
  draft: Draft;
  onClose: () => void;
};

function ChannelModal({ draft, onClose }: ChannelModalProps) {
  const [platforms, setPlatforms] = useState<Set<string>>(new Set(["INSTAGRAM"]));
  const [scheduledAt, setScheduledAt] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const toggle = (p: string) =>
    setPlatforms((prev) => {
      const next = new Set(prev);
      next.has(p) ? next.delete(p) : next.add(p);
      return next;
    });

  const handleSubmit = async () => {
    setLoading(true);
    const body = {
      draftId: draft.draftId,
      platforms: [...platforms],
      content: `${draft.caption}\n\n${draft.hashtags.join(" ")}`,
      mediaUrls: [],
      ...(scheduledAt ? { scheduledAt: new Date(scheduledAt).toISOString() } : {}),
    };
    const resp = await fetch("/api/studio/post", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = (await resp.json()) as { ok: boolean };
    setResult(json.ok ? "Posted successfully!" : "Something went wrong.");
    setLoading(false);
  };

  const LABELS: Record<string, string> = {
    INSTAGRAM: "Instagram",
    TWITTER: "Twitter / X",
    LINKEDIN: "LinkedIn",
    WHATSAPP: "WhatsApp",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-card border rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
        <h2 className="font-bold text-lg">Publish to Channels</h2>
        <div className="space-y-2">
          {Object.entries(LABELS).map(([key, label]) => (
            <label key={key} className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={platforms.has(key)} onChange={() => toggle(key)} className="size-4" />
              <span className="text-sm">{label}</span>
            </label>
          ))}
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Schedule (leave blank for immediate)</label>
          <input
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </div>
        {result && <p className="text-sm font-medium text-primary">{result}</p>}
        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded-md border text-sm">Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={loading || platforms.size === 0}
            className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm disabled:opacity-50"
          >
            {loading ? "Posting…" : scheduledAt ? "Schedule" : "Post Now"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────
export default function CarouselPage() {
  const [topic, setTopic] = useState("");
  const [articleId, setArticleId] = useState("");
  const [tone, setTone] = useState<(typeof TONES)[number]>("Breaking");
  const [slideCount, setSlideCount] = useState(5);
  const [sharedImageUrl, setSharedImageUrl] = useState("");
  const [slideImages, setSlideImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [editedSlides, setEditedSlides] = useState<Slide[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [articles, setArticles] = useState<Article[]>([]);

  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false, align: "start" });
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    fetch("/api/studio/articles")
      .then((r) => r.json())
      .then((d: { data?: { articles: Article[] } }) => setArticles(d.data?.articles ?? []))
      .catch(() => {});
  }, []);

  // Auto-fill shared image from selected article
  useEffect(() => {
    if (!articleId) return;
    const a = articles.find((x) => x.id === articleId);
    if (a?.featuredImage?.url) setSharedImageUrl(a.featuredImage.url);
  }, [articleId, articles]);

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    setError("");
    try {
      const resp = await fetch("/api/studio/carousel/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, tone, slideCount, ...(articleId ? { articleId } : {}) }),
      });
      const json = (await resp.json()) as { ok: boolean; data: Draft; error?: string };
      if (!json.ok) throw new Error(json.error ?? "Generation failed");
      setDraft(json.data);
      setEditedSlides(json.data.slides);
      setSlideImages(json.data.slides.map(() => ""));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  };

  const updateSlide = (index: number, field: keyof Slide, value: string) =>
    setEditedSlides((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });

  const getSlideImage = (i: number) => slideImages[i] || sharedImageUrl;

  const handleDownloadZip = useCallback(async () => {
    if (!editedSlides.length) return;
    setExporting(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();

      for (let i = 0; i < slideRefs.current.length; i++) {
        const el = slideRefs.current[i];
        if (!el) continue;
        const canvas = await html2canvas(el, {
          useCORS: true,
          allowTaint: true,
          scale: 3, // renders at 3× → 1080×1080
          backgroundColor: "#0d0d0d",
          logging: false,
        });
        const blob = await new Promise<Blob>((resolve) =>
          canvas.toBlob((b) => resolve(b!), "image/png"),
        );
        zip.file(`slide-${String(i + 1).padStart(2, "0")}.png`, blob);
      }

      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${topic.slice(0, 30).replace(/\s+/g, "-")}-carousel.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Export failed", e);
    } finally {
      setExporting(false);
    }
  }, [editedSlides, topic]);

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Carousel Generator</h1>
        <p className="text-muted-foreground text-sm mt-1">Generate AI-powered editorial carousels in the TakeToday style.</p>
      </div>

      {/* Form */}
      <div className="rounded-xl border bg-card p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="text-xs font-medium text-muted-foreground">Topic / Headline</label>
            <input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Myanmar just gave India a major security assurance"
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Source Article (optional)</label>
            <select
              value={articleId}
              onChange={(e) => setArticleId(e.target.value)}
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
            >
              <option value="">None</option>
              {articles.map((a) => (
                <option key={a.id} value={a.id}>{a.headline}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Tone</label>
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value as (typeof TONES)[number])}
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
            >
              {TONES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">
              Background Photo URL <span className="text-muted-foreground/60">(applies to all slides)</span>
            </label>
            <input
              value={sharedImageUrl}
              onChange={(e) => setSharedImageUrl(e.target.value)}
              placeholder="https://res.cloudinary.com/..."
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Slide Count ({slideCount})</label>
            <input
              type="range"
              min={3}
              max={10}
              value={slideCount}
              onChange={(e) => setSlideCount(Number(e.target.value))}
              className="mt-2 w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground"><span>3</span><span>10</span></div>
          </div>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <button
          onClick={handleGenerate}
          disabled={loading || !topic.trim()}
          className="px-6 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50"
        >
          {loading ? "Generating…" : "Generate Carousel"}
        </button>
      </div>

      {/* Preview */}
      {draft && editedSlides.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h2 className="font-semibold">Preview &amp; Edit</h2>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={handleDownloadZip}
                disabled={exporting}
                className="flex items-center gap-2 px-3 py-1.5 rounded-md border text-sm"
              >
                <Download className="size-4" />
                {exporting ? "Exporting…" : "Download ZIP (1080px)"}
              </button>
              <button
                onClick={() => setShowModal(true)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-sm"
              >
                <Send className="size-4" />
                Post / Schedule
              </button>
            </div>
          </div>

          {/* Embla carousel */}
          <div className="relative">
            <div className="overflow-hidden rounded-xl" ref={emblaRef}>
              <div className="flex gap-4 p-1">
                {editedSlides.map((slide, i) => (
                  <div key={i} className="flex-none">
                    {/* The actual template — this is what html2canvas captures */}
                    <SlideTemplate
                      slide={slide}
                      index={i}
                      total={editedSlides.length}
                      imageUrl={getSlideImage(i)}
                      innerRef={(el) => { slideRefs.current[i] = el; }}
                    />

                    {/* Editors below each slide */}
                    <div className="mt-3 space-y-2 w-[360px]">
                      <input
                        value={slide.headline}
                        onChange={(e) => updateSlide(i, "headline", e.target.value)}
                        className="w-full text-xs rounded-md border bg-background px-2 py-1.5 font-semibold uppercase"
                        placeholder="HEADLINE"
                      />
                      <textarea
                        value={slide.body}
                        onChange={(e) => updateSlide(i, "body", e.target.value)}
                        rows={3}
                        className="w-full text-xs rounded-md border bg-background px-2 py-1.5 resize-none"
                        placeholder="Body copy"
                      />
                      <div className="flex gap-2 items-center">
                        <Image className="size-3 text-muted-foreground shrink-0" />
                        <input
                          value={slideImages[i] ?? ""}
                          onChange={(e) => {
                            setSlideImages((prev) => {
                              const next = [...prev];
                              next[i] = e.target.value;
                              return next;
                            });
                          }}
                          placeholder="Override image URL for this slide…"
                          className="flex-1 text-xs rounded-md border bg-background px-2 py-1.5"
                        />
                        <button
                          onClick={async () => {
                            setLoading(true);
                            try {
                              const resp = await fetch("/api/studio/carousel/generate", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ topic, tone, slideCount: 1 }),
                              });
                              const json = (await resp.json()) as { ok: boolean; data: Draft };
                              if (json.ok && json.data.slides[0]) {
                                updateSlide(i, "headline", json.data.slides[0].headline);
                                updateSlide(i, "body", json.data.slides[0].body);
                              }
                            } finally {
                              setLoading(false);
                            }
                          }}
                          className="flex items-center gap-1 text-xs text-muted-foreground border rounded px-1.5 py-1 whitespace-nowrap"
                          title="Regenerate this slide"
                        >
                          <RefreshCw className="size-3" /> Regen
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <button
              onClick={() => emblaApi?.scrollPrev()}
              className="absolute left-0 top-[180px] -translate-x-3 rounded-full border bg-card p-1 shadow z-10"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              onClick={() => emblaApi?.scrollNext()}
              className="absolute right-0 top-[180px] translate-x-3 rounded-full border bg-card p-1 shadow z-10"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>

          {/* Caption + hashtags */}
          <div className="rounded-xl border bg-card p-4 space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Caption</label>
              <textarea
                defaultValue={draft.caption}
                rows={3}
                className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm resize-none"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Hashtags</label>
              <p className="mt-1 text-sm text-muted-foreground">{draft.hashtags.join(" ")}</p>
            </div>
          </div>
        </div>
      )}

      {showModal && draft && (
        <ChannelModal draft={draft} onClose={() => setShowModal(false)} />
      )}
    </div>
  );
}
