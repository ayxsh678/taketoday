/**
 * Durable rate limiting backed by Upstash Redis.
 *
 * Falls back to an in-memory sliding-window when UPSTASH_REDIS_REST_URL is
 * absent (local dev). In production without Upstash the limiter logs a warning
 * and fails open — set the env vars to enforce limits across all instances.
 *
 * Role-based limits (requests per 60 s):
 *   Super Admin / SUPER_ADMIN       600
 *   Editor / EDITOR                 300
 *   Content Manager / CONTENT_MGR   200
 *   Social Media Manager            120
 *   Analyst (default)                60
 */
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// ─── Role → limit map ─────────────────────────────────────────────────────────

const ROLE_LIMITS: Record<string, number> = {
  "Super Admin": 600,
  SUPER_ADMIN: 600,
  Editor: 300,
  EDITOR: 300,
  "Content Manager": 200,
  CONTENT_MANAGER: 200,
  "Social Media Manager": 120,
  SOCIAL_MEDIA_MANAGER: 120,
};
const DEFAULT_LIMIT = 60;

// ─── Upstash instances (one per tier, lazy-init) ──────────────────────────────

let redis: Redis | null = null;
const limiters = new Map<number, Ratelimit>();

function getRedis(): Redis | null {
  if (redis) return redis;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  redis = new Redis({ url, token });
  return redis;
}

function getUpstashLimiter(maxReqs: number): Ratelimit | null {
  const r = getRedis();
  if (!r) return null;
  if (!limiters.has(maxReqs)) {
    limiters.set(
      maxReqs,
      new Ratelimit({
        redis: r,
        limiter: Ratelimit.slidingWindow(maxReqs, "60 s"),
        prefix: `tt:rl:${maxReqs}`,
        analytics: false,
      }),
    );
  }
  return limiters.get(maxReqs)!;
}

// ─── In-memory fallback (dev / no Redis) ─────────────────────────────────────

const memoryBuckets = new Map<string, number[]>();

function inMemoryCheck(key: string, maxReqs: number): boolean {
  const now = Date.now();
  const window = 60_000;
  const prev = (memoryBuckets.get(key) ?? []).filter((t) => now - t < window);
  if (prev.length >= maxReqs) return true; // rate limited
  prev.push(now);
  memoryBuckets.set(key, prev);
  return false;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Returns `true` if the caller should be rate-limited (reject with 429).
 * `identifier` should be a stable per-user key (user ID preferred over IP).
 */
export async function checkRateLimit(
  identifier: string,
  role?: string | null,
): Promise<boolean> {
  const maxReqs = role ? (ROLE_LIMITS[role] ?? DEFAULT_LIMIT) : DEFAULT_LIMIT;
  const limiter = getUpstashLimiter(maxReqs);

  if (limiter) {
    const { success } = await limiter.limit(identifier);
    return !success;
  }

  // No Redis — warn once in production, fall back to in-memory
  if (process.env.NODE_ENV === "production") {
    console.warn(
      "[rate-limit] UPSTASH_REDIS_REST_URL not configured — rate limiting is in-memory only (not shared across instances). Set UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN to enforce limits.",
    );
  }
  return inMemoryCheck(identifier, maxReqs);
}
