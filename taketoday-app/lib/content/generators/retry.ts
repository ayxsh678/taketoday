// ─── Retry utility with exponential backoff ────────────────────────────────

/** HTTP status codes that indicate a transient failure worth retrying. */
const RETRYABLE_HTTP_STATUSES = new Set([429, 500, 502, 503, 504]);

function isTransientError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;

  // AbortError from timeout — treat as transient network issue
  if (err.name === "AbortError" || err.name === "TimeoutError") return true;

  // Anthropic SDK rate-limit and server errors
  if ("status" in err && typeof err.status === "number") {
    return RETRYABLE_HTTP_STATUSES.has(err.status);
  }

  // Message-based heuristics for fetch errors
  const msg = err.message.toLowerCase();
  if (msg.includes("econnreset") || msg.includes("network") || msg.includes("fetch")) {
    return true;
  }

  // Embedded HTTP status in message, e.g. "HTTP 503"
  const match = /\b([45]\d\d)\b/.exec(err.message);
  if (match) {
    return RETRYABLE_HTTP_STATUSES.has(Number(match[1]));
  }

  return false;
}

function isNonRetryable(err: unknown): boolean {
  if (!(err instanceof Error)) return false;

  // 4xx client errors (except 429 rate-limit)
  const match = /\b(4[013456789]\d|40[234567])\b/.exec(err.message);
  if (match) return true;

  const msg = err.message.toLowerCase();
  return (
    msg.includes("invalid_api_key") ||
    msg.includes("authentication") ||
    msg.includes("not configured") ||
    msg.includes("not_found")
  );
}

export interface RetryOptions {
  /** Total attempts including the first try. Default: 3 */
  maxAttempts: number;
  /** Initial backoff delay in ms. Default: 400 */
  baseDelayMs: number;
  /** Maximum backoff delay cap in ms. Default: 8000 */
  maxDelayMs: number;
}

export const DEFAULT_RETRY: RetryOptions = {
  maxAttempts: 3,
  baseDelayMs: 400,
  maxDelayMs: 8000,
};

export const AGGRESSIVE_RETRY: RetryOptions = {
  maxAttempts: 5,
  baseDelayMs: 200,
  maxDelayMs: 16000,
};

export async function withRetry<T>(
  fn: () => Promise<T>,
  opts: RetryOptions = DEFAULT_RETRY,
  onRetry?: (err: unknown, attempt: number, nextDelayMs: number) => void,
): Promise<T> {
  let lastErr: unknown;

  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (attempt === opts.maxAttempts) break;
      if (isNonRetryable(err)) break;
      if (!isTransientError(err)) break;

      const delayMs = Math.min(
        opts.baseDelayMs * 2 ** (attempt - 1),
        opts.maxDelayMs,
      );
      onRetry?.(err, attempt, delayMs);
      await new Promise<void>((resolve) => setTimeout(resolve, delayMs));
    }
  }

  throw lastErr;
}
