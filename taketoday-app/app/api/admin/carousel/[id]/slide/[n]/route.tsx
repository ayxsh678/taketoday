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

// Split heading at first sentence boundary into [white part, accent part].
// Falls back to [heading, ""] if no clean split found.
function splitHeading(heading: string): [string, string] {
  const idx = heading.search(/[.!?]\s/);
  if (idx !== -1) {
    return [heading.slice(0, idx + 1), heading.slice(idx + 2)];
  }
  return [heading, ""];
}

// Validate bg URL is http/https (no local paths)
function safeBgUrl(raw: string | null): string | null {
  if (!raw) return null;
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    return raw;
  } catch {
    return null;
  }
}

function renderSlide(
  slide: CarouselSlide,
  carousel: CarouselOutput,
  w: number,
  h: number,
  bgUrl: string | null,
) {
  const accent = carousel.colorPalette[1] ?? "#C8553D";
  const pad = Math.round(w * 0.065);
  const [headWhite, headAccent] = splitHeading(slide.heading);
  const headSize = Math.round(
    w * (slide.heading.length > 60 ? 0.054 : slide.heading.length > 40 ? 0.064 : 0.074),
  );

  return (
    <div
      style={{
        width: w,
        height: h,
        background: "#0A0A0A",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        overflow: "hidden",
        fontFamily: "sans-serif",
      }}
    >
      {/* ── background image layer ── */}
      {bgUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={bgUrl}
          alt=""
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            width: w,
            height: h,
            objectFit: "cover",
            objectPosition: "center bottom",
          }}
        />
      )}

      {/* ── gradient overlay (always present, stronger when no image) ── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: bgUrl
            ? "linear-gradient(to bottom, rgba(10,10,10,0.97) 0%, rgba(10,10,10,0.88) 45%, rgba(10,10,10,0.55) 70%, rgba(10,10,10,0.25) 100%)"
            : "rgba(10,10,10,1)",
        }}
      />

      {/* ── left accent bar ── */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: 5,
          height: h,
          background: accent,
        }}
      />

      {/* ── content layer ── */}
      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          padding: `${pad}px ${pad}px ${pad}px ${pad + 5}px`,
          height: h,
        }}
      >
        {/* heading block */}
        <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "center" }}>
          <div
            style={{
              fontSize: headSize,
              fontWeight: 800,
              lineHeight: 1.08,
              letterSpacing: "-0.025em",
              display: "flex",
              flexDirection: "column",
              maxWidth: Math.round(w * 0.88),
            }}
          >
            {/* white part */}
            <span style={{ color: "#FFFFFF" }}>{headWhite}</span>
            {/* accent part */}
            {headAccent && (
              <span style={{ color: accent }}>{headAccent}</span>
            )}
          </div>

          {/* short red divider */}
          <div
            style={{
              width: Math.round(w * 0.055),
              height: 3,
              background: accent,
              marginTop: Math.round(h * 0.028),
              marginBottom: Math.round(h * 0.028),
            }}
          />

          {/* body */}
          {slide.body && (
            <div
              style={{
                fontSize: Math.round(w * 0.025),
                color: "rgba(255,255,255,0.82)",
                lineHeight: 1.6,
                maxWidth: Math.round(w * 0.82),
                fontWeight: 400,
              }}
            >
              {slide.body}
            </div>
          )}
        </div>

        {/* footer row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingTop: Math.round(h * 0.02),
            borderTop: "1px solid rgba(255,255,255,0.10)",
          }}
        >
          {/* slide dots */}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {Array.from({ length: carousel.slideCount }, (_, i) => (
              <div
                key={i}
                style={{
                  width: i === slide.slideNumber - 1 ? 20 : 6,
                  height: 6,
                  borderRadius: 3,
                  background:
                    i === slide.slideNumber - 1
                      ? accent
                      : "rgba(255,255,255,0.25)",
                }}
              />
            ))}
          </div>

          {/* branding */}
          <span
            style={{
              fontSize: Math.round(w * 0.022),
              fontWeight: 600,
              color: "rgba(255,255,255,0.45)",
              letterSpacing: "0.01em",
            }}
          >
            @taketoday.co
          </span>
        </div>
      </div>
    </div>
  );
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; n: string }> },
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
  const bgUrl = safeBgUrl(req.nextUrl.searchParams.get("bg"));

  return new ImageResponse(renderSlide(slide, carousel, w, h, bgUrl), {
    width: w,
    height: h,
    headers: {
      "Content-Disposition": `attachment; filename="slide-${slide.slideNumber}.png"`,
      "Cache-Control": "public, max-age=3600",
    },
  });
}
