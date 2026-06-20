const ROLE_LIMITS: Record<string, number> = {
  ADMIN: 600,
  EDITOR: 300,
};
const DEFAULT_LIMIT = 60;

const memoryBuckets = new Map<string, number[]>();

function inMemoryCheck(key: string, maxReqs: number): boolean {
  const now = Date.now();
  const window = 60_000;
  const prev = (memoryBuckets.get(key) ?? []).filter((t) => now - t < window);
  if (prev.length >= maxReqs) return true;
  prev.push(now);
  memoryBuckets.set(key, prev);
  return false;
}

export async function checkRateLimit(
  identifier: string,
  role?: string | null,
): Promise<boolean> {
  const maxReqs = role ? (ROLE_LIMITS[role] ?? DEFAULT_LIMIT) : DEFAULT_LIMIT;
  return inMemoryCheck(identifier, maxReqs);
}
