import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/subscribe
 *
 * Body: { email: string; name?: string }
 *
 * Adds the subscriber to Buttondown. Requires BUTTONDOWN_API_KEY in env.
 * Handles duplicate subscribers gracefully (returns success, not an error).
 */

const BUTTONDOWN_URL = "https://api.buttondown.email/v1/subscribers";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Body must be an object" }, { status: 400 });
  }

  const { email, name } = body as { email?: unknown; name?: unknown };

  if (!email || typeof email !== "string" || !email.includes("@")) {
    return NextResponse.json(
      { error: "A valid email address is required." },
      { status: 400 },
    );
  }

  const apiKey = process.env.BUTTONDOWN_API_KEY;
  if (!apiKey) {
    // Fail visibly in development so misconfiguration is caught early.
    console.error("BUTTONDOWN_API_KEY is not set");
    return NextResponse.json(
      { error: "Newsletter service is not configured." },
      { status: 503 },
    );
  }

  const payload: Record<string, unknown> = {
    email: email.trim().toLowerCase(),
    tags: ["taketoday-web"],
  };
  if (name && typeof name === "string" && name.trim()) {
    payload.metadata = { name: name.trim() };
  }

  let res: Response;
  try {
    res = await fetch(BUTTONDOWN_URL, {
      method: "POST",
      headers: {
        Authorization: `Token ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  } catch {
    return NextResponse.json(
      { error: "Could not reach newsletter service. Try again shortly." },
      { status: 502 },
    );
  }

  // 201 = subscribed, 409 = already subscribed — both are success from the
  // user's perspective.
  if (res.status === 201 || res.status === 409) {
    return NextResponse.json({ ok: true });
  }

  // Surface Buttondown's own error message when available.
  let detail = "";
  try {
    const data = (await res.json()) as Record<string, unknown>;
    detail = typeof data.detail === "string" ? data.detail : "";
  } catch { /* ignore */ }

  return NextResponse.json(
    { error: detail || "Subscription failed. Please try again." },
    { status: res.status >= 400 ? res.status : 500 },
  );
}
