import { NextRequest, NextResponse } from "next/server";
import { appConfig } from "@/lib/config/app";

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

  // RFC-5321-ish: local@domain.tld — rejects obvious non-emails without
  // becoming a full RFC 5322 parser.
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || typeof email !== "string" || !EMAIL_RE.test(email.trim())) {
    return NextResponse.json(
      { error: "A valid email address is required." },
      { status: 400 },
    );
  }

  const apiKey = appConfig.buttondownApiKey;
  if (!apiKey) {
    // Fail visibly in development so misconfiguration is caught early.
    console.error("BUTTONDOWN_API_KEY is not set");
    return NextResponse.json(
      { error: "Newsletter service is not configured." },
      { status: 503 },
    );
  }

  const payload: Record<string, unknown> = {
    email_address: email.trim().toLowerCase(),
    tags: ["taketoday-web"],
  };
  if (name && typeof name === "string" && name.trim()) {
    payload.metadata = { name: name.trim() };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10_000);

  let res: Response;
  try {
    res = await fetch(BUTTONDOWN_URL, {
      method: "POST",
      headers: {
        Authorization: `Token ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
  } catch (err) {
    clearTimeout(timeoutId);
    const isTimeout = err instanceof DOMException && err.name === "AbortError";
    return NextResponse.json(
      {
        error: isTimeout
          ? "Newsletter service timed out. Try again shortly."
          : "Could not reach newsletter service. Try again shortly.",
      },
      { status: 502 },
    );
  }

  // 201 = subscribed, 409 = already subscribed — both are success.
  if (res.status === 201 || res.status === 409) {
    return NextResponse.json({ ok: true });
  }

  // Try to extract Buttondown's error detail.
  let bdError = "Subscription failed. Please try again.";
  try {
    const bdBody = await res.json() as Record<string, unknown>;
    // Buttondown returns errors as { detail: "..." } or { email: ["..."] }
    if (typeof bdBody.detail === "string" && bdBody.detail) {
      bdError = bdBody.detail;
    } else if (Array.isArray(bdBody.email) && typeof bdBody.email[0] === "string") {
      bdError = bdBody.email[0] as string;
    }
  } catch { /* ignore parse errors */ }

  // 422 from Buttondown usually means "email was unsubscribed" — treat as success
  // so the user isn't stuck with a dead end.
  if (res.status === 422) {
    console.warn("Buttondown 422 for subscribe:", bdError);
    return NextResponse.json({ ok: true });
  }

  // 401 = bad API key — surface a config error without leaking credentials.
  if (res.status === 401) {
    console.error("Buttondown 401: check BUTTONDOWN_API_KEY");
    return NextResponse.json(
      { error: "Newsletter service misconfigured. Contact support." },
      { status: 503 },
    );
  }

  return NextResponse.json(
    { error: bdError },
    { status: res.status >= 400 ? res.status : 500 },
  );
}
