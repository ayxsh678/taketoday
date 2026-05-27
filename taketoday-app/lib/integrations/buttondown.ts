// ─── Buttondown newsletter client ─────────────────────────────────────────────
// Sends a broadcast email when an article is published.
// Docs: https://api.buttondown.email/v1/

import { appConfig } from "@/lib/config/app";

const BASE = "https://api.buttondown.email/v1";

export interface ArticleBroadcast {
  subject: string;
  /** Plain-text or HTML body */
  body: string;
  /** Optional: subscriber-facing preview text */
  preview?: string;
}

export interface ButtondownResult {
  ok: boolean;
  emailId?: string;
  error?: string;
}

async function apiFetch(path: string, init: RequestInit): Promise<Response> {
  const key = appConfig.buttondownApiKey;
  if (!key) throw new Error("BUTTONDOWN_API_KEY not configured");

  return fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Token ${key}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
  });
}

/**
 * Send an email broadcast to all subscribers for a newly published article.
 * Returns the Buttondown email ID on success.
 */
export async function sendArticleBroadcast(
  broadcast: ArticleBroadcast,
): Promise<ButtondownResult> {
  try {
    const res = await apiFetch("/emails", {
      method: "POST",
      body: JSON.stringify({
        subject: broadcast.subject,
        body: broadcast.body,
        ...(broadcast.preview ? { secondary_id: broadcast.preview } : {}),
        status: "about_to_send",
      }),
    });

    const data = (await res.json()) as { id?: string; [key: string]: unknown };

    if (!res.ok) {
      return {
        ok: false,
        error: `Buttondown API error ${res.status}: ${JSON.stringify(data)}`,
      };
    }

    return { ok: true, emailId: data.id };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Buttondown request failed",
    };
  }
}

/**
 * Check Buttondown API connectivity.
 * Returns subscriber count on success.
 */
export async function checkButtondownHealth(): Promise<
  { ok: true; subscriberCount: number } | { ok: false; error: string }
> {
  try {
    const res = await apiFetch("/subscribers?count=true", { method: "GET" });
    if (!res.ok) return { ok: false, error: `HTTP ${res.status}` };
    const data = (await res.json()) as { count?: number };
    return { ok: true, subscriberCount: data.count ?? 0 };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Health check failed" };
  }
}
