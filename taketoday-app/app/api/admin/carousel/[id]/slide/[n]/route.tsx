import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import type { CarouselOutput, CarouselSlide, CarouselFormat } from "@/lib/ai/tasks/carousel";

function getDimensions(format: CarouselFormat): { w: number; h: number } {
  switch (format) {
    case "linkedin": return { w: 1200, h: 628 };
    case "twitter":  return { w: 1200, h: 675 };
    default:         return { w: 1080, h: 1080 };
  }
}

function hexToRgb(hex: string): string {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `rgb(${r}, ${g}, ${b})`;
}

function isLight(hex: string): boolean {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 128;
}

const SLIDE_TYPE_COLORS: Record<string, string> = {
  title: "#7C3AED",
  content: "#2563EB",
  stat: "#059669",
  quote: "#D97706",
  cta: "#DC2626",
};

function renderSlide(slide: CarouselSlide, carousel: CarouselOutput, w: number, h: number) {
  const bg = carousel.colorPalette[0] ?? "#0A0A0A";
  const accent = carousel.colorPalette[1] ?? "#7C3AED";
  const light = isLight(bg);
  const textPrimary = light ? "#0A0A0A" : "#FFFFFF";
  const textSecondary = light ? "#4B4B4B" : "#B3B3B3";
  const badgeColor = SLIDE_TYPE_COLORS[slide.type] ?? "#6B6B6B";
  const padding = Math.round(w * 0.074);

  return (
    <div
      style={{
        width: w,
        height: h,
        background: bg,
        display: "flex",
        flexDirection: "column",
        padding: `${padding}px`,
        position: "relative",
        fontFamily: "sans-serif",
      }}
    >
      {/* top accent bar */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 6,
          background: accent,
        }}
      />

      {/* slide number + type badge */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: Math.round(h * 0.04),
        }}
      >
        <span
          style={{
            fontSize: Math.round(w * 0.018),
            color: textSecondary,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            fontWeight: 600,
          }}
        >
          {slide.slideNumber} / {carousel.slideCount}
        </span>
        <span
          style={{
            fontSize: Math.round(w * 0.016),
            color: "#FFFFFF",
            background: badgeColor,
            padding: `${Math.round(w * 0.006)}px ${Math.round(w * 0.014)}px`,
            borderRadius: 4,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            fontWeight: 700,
          }}
        >
          {slide.type}
        </span>
      </div>

      {/* heading */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            fontSize: Math.round(w * (slide.heading.length > 50 ? 0.048 : 0.062)),
            fontWeight: 800,
            color: textPrimary,
            lineHeight: 1.1,
            letterSpacing: "-0.02em",
            marginBottom: slide.body ? Math.round(h * 0.03) : 0,
          }}
        >
          {slide.heading}
        </div>

        {slide.body && (
          <div
            style={{
              fontSize: Math.round(w * 0.026),
              color: textSecondary,
              lineHeight: 1.55,
              maxWidth: "85%",
            }}
          >
            {slide.body}
          </div>
        )}
      </div>

      {/* footer */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderTop: `1px solid ${light ? "rgba(0,0,0,0.12)" : "rgba(255,255,255,0.12)"}`,
          paddingTop: Math.round(h * 0.022),
          marginTop: Math.round(h * 0.022),
        }}
      >
        <span
          style={{
            fontSize: Math.round(w * 0.016),
            color: textSecondary,
            fontStyle: "italic",
          }}
        >
          {slide.visualStyle}
        </span>
        <span
          style={{
            fontSize: Math.round(w * 0.02),
            fontWeight: 700,
            color: accent,
            letterSpacing: "-0.01em",
          }}
        >
          TakeToday
        </span>
      </div>
    </div>
  );
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; n: string }> }
) {
  const { id, n } = await params;
  const slideIndex = parseInt(n, 10) - 1;

  if (isNaN(slideIndex) || slideIndex < 0) {
    return new Response("Invalid slide number", { status: 400 });
  }

  const job = await prisma.carouselJob.findUnique({ where: { id } });
  if (!job) return new Response("Not found", { status: 404 });

  const carousel = job.result as unknown as CarouselOutput;
  const slide = carousel.slides[slideIndex];
  if (!slide) return new Response("Slide not found", { status: 404 });

  const { w, h } = getDimensions(carousel.format as CarouselFormat);

  return new ImageResponse(renderSlide(slide, carousel, w, h), {
    width: w,
    height: h,
    headers: {
      "Content-Disposition": `attachment; filename="slide-${slide.slideNumber}.png"`,
      "Cache-Control": "public, max-age=3600",
    },
  });
}
