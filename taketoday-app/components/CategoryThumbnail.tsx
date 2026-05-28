import type { Category } from "@/types/article";

/**
 * TakeToday — CategoryThumbnail
 * Editorial placeholder image for articles without a photo.
 * Dark gradient per category + large watermark letter + accent strip.
 * Pure CSS — no external dependencies, works in server components.
 */

interface ThumbnailStyle {
  bg: string;       // CSS background gradient
  text: string;     // watermark text colour (rgba)
  strip: string;    // top accent strip colour
  label: string;    // short label override (e.g. "INT'L")
}

const STYLES: Record<Category, ThumbnailStyle> = {
  AI: {
    bg: "linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #0a0a0f 100%)",
    text: "rgba(160,160,255,0.10)",
    strip: "#3b3b8a",
    label: "AI",
  },
  Finance: {
    bg: "linear-gradient(135deg, #0a120a 0%, #0f1f0f 50%, #0a0f0a 100%)",
    text: "rgba(100,200,100,0.09)",
    strip: "#1f6b1f",
    label: "Finance",
  },
  Tech: {
    bg: "linear-gradient(135deg, #0f0f0f 0%, #1a1520 50%, #0a0a0f 100%)",
    text: "rgba(180,160,220,0.09)",
    strip: "#4a3f7a",
    label: "Tech",
  },
  Startups: {
    bg: "linear-gradient(135deg, #150d00 0%, #1f1200 50%, #100a00 100%)",
    text: "rgba(220,160,60,0.10)",
    strip: "#7a4f00",
    label: "Startups",
  },
  Briefings: {
    bg: "linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 50%, #0a0a0a 100%)",
    text: "rgba(200,200,200,0.08)",
    strip: "#3a3a3a",
    label: "Brief",
  },
  India: {
    bg: "linear-gradient(135deg, #150a00 0%, #1f1000 50%, #100800 100%)",
    text: "rgba(255,160,40,0.10)",
    strip: "#7a4000",
    label: "India",
  },
  International: {
    bg: "linear-gradient(135deg, #000a15 0%, #00101f 50%, #00080f 100%)",
    text: "rgba(60,160,220,0.10)",
    strip: "#005a8a",
    label: "INT'L",
  },
};

interface Props {
  category: Category;
  /** Tailwind aspect-ratio class, e.g. "aspect-[16/10]" */
  className?: string;
  /** Show a large watermark letter. Default true. */
  watermark?: boolean;
}

export function CategoryThumbnail({
  category,
  className = "",
  watermark = true,
}: Props) {
  const s = STYLES[category] ?? STYLES.Briefings;
  // Use the first character of the label as the giant watermark
  const letter = category === "International" ? "I" : category[0];

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{ background: s.bg }}
      aria-hidden
    >
      {/* Top accent strip */}
      <div
        className="absolute top-0 left-0 right-0 h-[3px]"
        style={{ background: s.strip }}
      />

      {/* Watermark letter */}
      {watermark && (
        <span
          className="absolute inset-0 flex items-center justify-center select-none pointer-events-none font-serif italic leading-none"
          style={{
            fontSize: "clamp(80px, 30%, 180px)",
            color: s.text,
          }}
        >
          {letter}
        </span>
      )}

      {/* Category label bottom-left */}
      <div className="absolute bottom-3 left-4">
        <span
          className="font-mono text-[9px] tracking-[0.22em] uppercase"
          style={{ color: "rgba(255,255,255,0.25)" }}
        >
          {s.label}
        </span>
      </div>
    </div>
  );
}
