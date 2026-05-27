// ─── Shared server-side Python service client ─────────────────────────────────
// Centralises base URL resolution, auth headers, and timeout handling
// for all generator-to-Python-service calls.

import { appConfig } from "@/lib/config/app";

const DEFAULT_TIMEOUT_MS = 30_000;

export class ServiceProxyError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body: string,
  ) {
    super(message);
    this.name = "ServiceProxyError";
  }
}

function buildHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (appConfig.internalServiceToken) {
    headers["Authorization"] = `Bearer ${appConfig.internalServiceToken}`;
  }
  return headers;
}

/**
 * POST to the Python content service.
 * Throws `ServiceProxyError` on non-2xx responses.
 * Throws `AbortError` on timeout (treated as transient by withRetry).
 */
export async function proxyPost<TRequest, TResponse>(
  path: string,
  body: TRequest,
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<TResponse> {
  const url = `${appConfig.pythonServiceUrl}${path}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: buildHeaders(),
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    const text = await res.text();

    if (!res.ok) {
      throw new ServiceProxyError(
        `Python service ${path} returned HTTP ${res.status}`,
        res.status,
        text,
      );
    }

    try {
      return JSON.parse(text) as TResponse;
    } catch {
      throw new ServiceProxyError(
        `Python service ${path} returned non-JSON body`,
        res.status,
        text,
      );
    }
  } finally {
    clearTimeout(timer);
  }
}

/**
 * GET from the Python content service.
 * Throws `ServiceProxyError` on non-2xx responses.
 */
export async function proxyGet<TResponse>(
  path: string,
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<TResponse> {
  const url = `${appConfig.pythonServiceUrl}${path}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: buildHeaders(),
      signal: controller.signal,
    });

    const text = await res.text();

    if (!res.ok) {
      throw new ServiceProxyError(
        `Python service ${path} returned HTTP ${res.status}`,
        res.status,
        text,
      );
    }

    try {
      return JSON.parse(text) as TResponse;
    } catch {
      throw new ServiceProxyError(
        `Python service ${path} returned non-JSON body`,
        res.status,
        text,
      );
    }
  } finally {
    clearTimeout(timer);
  }
}
