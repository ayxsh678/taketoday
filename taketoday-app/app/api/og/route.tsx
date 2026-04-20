import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

export const runtime = "edge";

const W = 1200;
const H = 630;

// Design tokens (must be inline — no Tailwind in edge ImageResponse)
const PAPER = "#FAFAF7";
const INK = "#0A0A0A";
const INK_500 = "#6B6B6B";
const INK_200 = "#E5E3DD";
const ACCENT = "#C8553D";

/**
 * GET /api/og
 *
 * Query params:
 *   title    — article or page title (required)
 *   deck     — subtitle / description (optional)
 *   category — category label shown as a pill (optional)
 *   type     — "article" | "page" (optional, affects layout)
 *
 * Returns a 1200×630 PNG suitable for og:image / twitter:image.
 */
export function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const title = searchParams.get("title")?.slice(0, 120) ?? "TakeToday";
  const deck = searchParams.get("deck")?.slice(0, 180) ?? "";
  const category = searchParams.get("category") ?? "";

  // Clamp title font size based on length
  const titleSize = title.length > 70 ? 44 : title.length > 45 ? 52 : 62;

  return new ImageResponse(
    (
      <div
        style={{
          width: W,
          height: H,
          backgroundColor: PAPER,
          display: "flex",
          flexDirection: "column",
          padding: "64px 72px",
          fontFamily: "serif",
          position: "relative",
        }}
      >
        {/* Top accent rule */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 5,
            backgroundColor: ACCENT,
          }}
        />

        {/* Category pill */}
        {category ? (
          <div
            style={{
              display: "flex",
              marginBottom: 28,
            }}
          >
            <span
              style={{
                fontFamily: "monospace",
                fontSize: 13,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: ACCENT,
                border: `1px solid ${ACCENT}`,
                padding: "4px 12px",
              }}
            >
              {category}
            </span>
          </div>
        ) : (
          <div style={{ marginBottom: 28, display: "flex" }} />
        )}

        {/* Title */}
        <div
          style={{
            fontSize: titleSize,
            fontWeight: 700,
            color: INK,
            lineHeight: 1.08,
            letterSpacing: "-0.02em",
            maxWidth: 960,
            flex: 1,
            display: "flex",
            alignItems: "flex-start",
          }}
        >
          {title}
        </div>

        {/* Deck */}
        {deck ? (
          <div
            style={{
              fontSize: 22,
              color: INK_500,
              lineHeight: 1.45,
              maxWidth: 820,
              marginTop: 20,
              marginBottom: 40,
            }}
          >
            {deck}
          </div>
        ) : (
          <div style={{ marginBottom: 40, display: "flex" }} />
        )}

        {/* Footer rule + branding */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: `1px solid ${INK_200}`,
            paddingTop: 24,
          }}
        >
          <span
            style={{
              fontFamily: "monospace",
              fontSize: 13,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: INK_500,
            }}
          >
            News. Simplified.
          </span>

          <span
            style={{
              fontSize: 24,
              fontWeight: 700,
              color: INK,
              letterSpacing: "-0.02em",
            }}
          >
            TakeToday
          </span>
        </div>
      </div>
    ),
    {
      width: W,
      height: H,
    },
  );
}
