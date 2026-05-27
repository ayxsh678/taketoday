import { describe, it, expect, vi } from "vitest";
import { withRetry, DEFAULT_RETRY } from "@/lib/content/generators/retry";

describe("withRetry", () => {
  it("returns result on first success", async () => {
    const fn = vi.fn().mockResolvedValue("ok");
    const result = await withRetry(fn);
    expect(result).toBe("ok");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("retries on transient 429 error and succeeds", async () => {
    const err = Object.assign(new Error("Rate limited"), { status: 429 });
    const fn = vi
      .fn()
      .mockRejectedValueOnce(err)
      .mockResolvedValue("ok");

    const result = await withRetry(fn, { maxAttempts: 3, baseDelayMs: 0, maxDelayMs: 0 });
    expect(result).toBe("ok");
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("does not retry on non-retryable 401 error", async () => {
    const err = Object.assign(new Error("invalid_api_key"), { status: 401 });
    const fn = vi.fn().mockRejectedValue(err);

    await expect(
      withRetry(fn, { maxAttempts: 3, baseDelayMs: 0, maxDelayMs: 0 }),
    ).rejects.toThrow("invalid_api_key");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("exhausts all attempts on persistent transient error", async () => {
    const err = Object.assign(new Error("Service unavailable"), { status: 503 });
    const fn = vi.fn().mockRejectedValue(err);

    await expect(
      withRetry(fn, { maxAttempts: 3, baseDelayMs: 0, maxDelayMs: 0 }),
    ).rejects.toThrow("Service unavailable");
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it("calls onRetry callback on each retry", async () => {
    const err = Object.assign(new Error("server error"), { status: 503 });
    const fn = vi
      .fn()
      .mockRejectedValueOnce(err)
      .mockRejectedValueOnce(err)
      .mockResolvedValue("ok");

    const onRetry = vi.fn();
    await withRetry(fn, { maxAttempts: 3, baseDelayMs: 0, maxDelayMs: 0 }, onRetry);
    expect(onRetry).toHaveBeenCalledTimes(2);
  });

  it("uses DEFAULT_RETRY config by default", async () => {
    expect(DEFAULT_RETRY.maxAttempts).toBe(3);
    expect(DEFAULT_RETRY.baseDelayMs).toBe(400);
  });
});
