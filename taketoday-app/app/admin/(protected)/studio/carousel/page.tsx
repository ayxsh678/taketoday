"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight, Download, ImageIcon, RefreshCw, Search, Send, Upload, X } from "lucide-react";

type Slide = { headline: string; body: string; cta: string };
type Draft = { draftId: string; slides: Slide[]; hashtags: string[]; caption: string };
type Article = { id: string; headline: string; featuredImage?: { url: string } | null };
type MediaAsset = { id: string; url: string; altText: string | null; width: number | null; height: number | null; publicId: string };

const TONES = ["Breaking", "Explainer", "Opinion", "Listicle"] as const;

// ─── Media picker modal ────────────────────────────────────────────────────
function MediaPickerModal({ onSelect, onClose }: { onSelect: (url: string) => void; onClose: () => void }) {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchAssets = useCallback((query: string) => {
    setLoading(true);
    const url = `/api/admin/media${query ? `?q=${encodeURIComponent(query)}` : ""}`;
    fetch(url)
      .then((r) => r.json())
      .then((d: { data?: { assets: MediaAsset[] } }) => setAssets(d.data?.assets ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchAssets(q); }, [q, fetchAssets]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const resp = await fetch("/api/admin/media", { method: "POST", body: fd });
      const json = (await resp.json()) as { ok: boolean; data: MediaAsset };
      if (json.ok) {
        setAssets((prev) => [json.data, ...prev]);
        onSelect(json.data.url);
        onClose();
      }
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-card border rounded-xl shadow-2xl w-full max-w-3xl flex flex-col" style={{ maxHeight: "80vh" }}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b shrink-0">
          <h2 className="font-semibold">Media Library</h2>
          <div className="flex items-center gap-2">
            <input ref={fileInputRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleUpload} />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-medium disabled:opacity-50"
            >
              <Upload className="size-3" />
              {uploading ? "Uploading…" : "Upload"}
            </button>
            <button onClick={onClose} className="rounded-md p-1 hover:bg-muted">
              <X className="size-4" />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="px-5 py-3 border-b shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by filename or alt text…"
              className="w-full rounded-md border bg-background pl-9 pr-3 py-2 text-sm"
            />
          </div>
        </div>

        {/* Grid */}
        <div className="overflow-y-auto p-4 flex-1">
          {loading ? (
            <p className="text-sm text-muted-foreground text-center py-8">Loading…</p>
          ) : assets.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No assets found.</p>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
              {assets.map((asset) => (
                <button
                  key={asset.id}
                  onClick={() => { onSelect(asset.url); onClose(); }}
                  className="group relative aspect-square rounded-lg overflow-hidden border hover:border-primary transition-colors bg-muted"
                  title={asset.altText ?? asset.publicId}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={asset.url}
                    alt={asset.altText ?? ""}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Editorial slide template ──────────────────────────────────────────────
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
      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 5, backgroundColor: "#ffffff" }} />

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

        <div style={{ height: 1, backgroundColor: "rgba(255,255,255,0.35)", margin: "14px 0", flexShrink: 0 }} />

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
function ChannelModal({ draft, onClose }: { draft: Draft; onClose: () => void }) {
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
    const resp = await fetch("/api/studio/post", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        draftId: draft.draftId,
        platforms: [...platforms],
        content: `${draft.caption}\n\n${draft.hashtags.join(" ")}`,
        mediaUrls: [],
        ...(scheduledAt ? { scheduledAt: new Date(scheduledAt).toISOString() } : {}),
      }),
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
// pickerTarget: null = closed, "shared" = shared image, number = slide index override
type PickerTarget = null | "shared" | number;

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
  const [showChannelModal, setShowChannelModal] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<PickerTarget>(null);
  const [articles, setArticles] = useState<Article[]>([]);

  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false, align: "start" });
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    fetch("/api/studio/articles")
      .then((r) => r.json())
      .then((d: { data?: { articles: Article[] } }) => setArticles(d.data?.articles ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!articleId) return;
    const a = articles.find((x) => x.id === articleId);
    if (a?.featuredImage?.url) setSharedImageUrl(a.featuredImage.url);
  }, [articleId, articles]);

  const handlePickerSelect = (url: string) => {
    if (pickerTarget === "shared") {
      setSharedImageUrl(url);
    } else if (typeof pickerTarget === "number") {
      setSlideImages((prev) => {
        const next = [...prev];
        next[pickerTarget] = url;
        return next;
      });
    }
  };

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
          scale: 3,
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
              {articles.map((a) => <option key={a.id} value={a.id}>{a.headline}</option>)}
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

          {/* Shared background image picker */}
          <div className="sm:col-span-2">
            <label className="text-xs font-medium text-muted-foreground">
              Background Photo <span className="text-muted-foreground/60">(applies to all slides)</span>
            </label>
            <div className="mt-1 flex gap-2">
              {sharedImageUrl ? (
                <div className="relative size-10 rounded-md overflow-hidden border shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={sharedImageUrl} alt="" className="w-full h-full object-cover" />
                  <button
                    onClick={() => setSharedImageUrl("")}
                    className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity"
                  >
                    <X className="size-3 text-white" />
                  </button>
                </div>
              ) : null}
              <button
                onClick={() => setPickerTarget("shared")}
                className="flex items-center gap-2 flex-1 rounded-md border bg-background px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors text-left"
              >
                <ImageIcon className="size-4 shrink-0" />
                {sharedImageUrl ? "Change photo…" : "Pick from media library…"}
              </button>
              {sharedImageUrl ? null : (
                <input
                  placeholder="or paste URL"
                  onChange={(e) => setSharedImageUrl(e.target.value)}
                  className="rounded-md border bg-background px-3 py-2 text-sm w-48 shrink-0"
                />
              )}
            </div>
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
                onClick={() => setShowChannelModal(true)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-sm"
              >
                <Send className="size-4" />
                Post / Schedule
              </button>
            </div>
          </div>

          <div className="relative">
            <div className="overflow-hidden rounded-xl" ref={emblaRef}>
              <div className="flex gap-4 p-1">
                {editedSlides.map((slide, i) => (
                  <div key={i} className="flex-none">
                    <SlideTemplate
                      slide={slide}
                      index={i}
                      total={editedSlides.length}
                      imageUrl={getSlideImage(i)}
                      innerRef={(el) => { slideRefs.current[i] = el; }}
                    />

                    {/* Per-slide editors */}
                    <div className="mt-3 space-y-2 w-90">
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

                      {/* Per-slide image picker */}
                      <div className="flex gap-2 items-center">
                        {slideImages[i] ? (
                          <div className="relative size-8 rounded overflow-hidden border shrink-0">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={slideImages[i]} alt="" className="w-full h-full object-cover" />
                            <button
                              onClick={() => setSlideImages((prev) => { const n = [...prev]; n[i] = ""; return n; })}
                              className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity"
                            >
                              <X className="size-2.5 text-white" />
                            </button>
                          </div>
                        ) : null}
                        <button
                          onClick={() => setPickerTarget(i)}
                          className="flex items-center gap-1.5 flex-1 text-xs text-muted-foreground border rounded-md px-2 py-1.5 hover:bg-muted/50 transition-colors text-left"
                        >
                          <ImageIcon className="size-3 shrink-0" />
                          {slideImages[i] ? "Change slide photo…" : "Override slide photo…"}
                        </button>
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
                          className="flex items-center gap-1 text-xs text-muted-foreground border rounded-md px-2 py-1.5 whitespace-nowrap hover:bg-muted/50 transition-colors"
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
              className="absolute left-0 top-45 -translate-x-3 rounded-full border bg-card p-1 shadow z-10"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              onClick={() => emblaApi?.scrollNext()}
              className="absolute right-0 top-45 translate-x-3 rounded-full border bg-card p-1 shadow z-10"
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

      {/* Modals */}
      {pickerTarget !== null && (
        <MediaPickerModal
          onSelect={handlePickerSelect}
          onClose={() => setPickerTarget(null)}
        />
      )}
      {showChannelModal && draft && (
        <ChannelModal draft={draft} onClose={() => setShowChannelModal(false)} />
      )}
    </div>
  );
}
