import { randomBytes, createHash } from "crypto";

const RESET_TTL_MS = 60 * 60 * 1000;       // 1 hour
const VERIFY_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export function generateToken(): { plaintext: string; hash: string } {
  const plaintext = randomBytes(32).toString("hex"); // 64 hex chars
  const hash = createHash("sha256").update(plaintext).digest("hex");
  return { plaintext, hash };
}

export function hashToken(plaintext: string): string {
  return createHash("sha256").update(plaintext).digest("hex");
}

export function resetTokenExpiry(): Date {
  return new Date(Date.now() + RESET_TTL_MS);
}

export function verifyTokenExpiry(): Date {
  return new Date(Date.now() + VERIFY_TTL_MS);
}
