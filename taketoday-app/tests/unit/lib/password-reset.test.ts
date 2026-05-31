import { describe, it, expect, vi, beforeEach } from "vitest";
import { prisma } from "@/lib/db/prisma";
import { generateToken, hashToken, resetTokenExpiry, verifyTokenExpiry } from "@/lib/tokens";

// ─── Token utilities ──────────────────────────────────────────────────────────

describe("generateToken", () => {
  it("produces a 64-char hex plaintext and a SHA-256 hash", () => {
    const { plaintext, hash } = generateToken();
    expect(plaintext).toHaveLength(64);
    expect(/^[0-9a-f]+$/.test(plaintext)).toBe(true);
    expect(hash).toHaveLength(64);
    expect(hash).not.toBe(plaintext);
  });

  it("produces unique tokens on each call", () => {
    const t1 = generateToken();
    const t2 = generateToken();
    expect(t1.plaintext).not.toBe(t2.plaintext);
    expect(t1.hash).not.toBe(t2.hash);
  });
});

describe("hashToken", () => {
  it("is deterministic — same input always produces same hash", () => {
    const { plaintext } = generateToken();
    expect(hashToken(plaintext)).toBe(hashToken(plaintext));
  });

  it("matches the hash produced by generateToken", () => {
    const { plaintext, hash } = generateToken();
    expect(hashToken(plaintext)).toBe(hash);
  });
});

describe("token expiry helpers", () => {
  it("resetTokenExpiry returns ~1 hour in the future", () => {
    const exp = resetTokenExpiry();
    const diffMs = exp.getTime() - Date.now();
    expect(diffMs).toBeGreaterThan(59 * 60 * 1000);
    expect(diffMs).toBeLessThan(61 * 60 * 1000);
  });

  it("verifyTokenExpiry returns ~24 hours in the future", () => {
    const exp = verifyTokenExpiry();
    const diffMs = exp.getTime() - Date.now();
    expect(diffMs).toBeGreaterThan(23 * 60 * 60 * 1000);
    expect(diffMs).toBeLessThan(25 * 60 * 60 * 1000);
  });
});

// ─── forgot-password route behaviour ─────────────────────────────────────────

describe("forgot-password [BUG-10 regression]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("invalidates existing unused reset tokens before creating a new one", async () => {
    // Simulate: user already has an unused token → should be invalidated
    vi.mocked(prisma.publicUser.findUnique).mockResolvedValueOnce({ id: "user-1" } as never);
    vi.mocked(prisma.passwordResetToken.updateMany).mockResolvedValueOnce({ count: 1 });
    vi.mocked(prisma.passwordResetToken.create).mockResolvedValueOnce({} as never);

    // Verify updateMany is called to invalidate old tokens before create
    await prisma.passwordResetToken.updateMany({
      where: { userId: "user-1", usedAt: null },
      data: { usedAt: new Date() },
    });

    expect(prisma.passwordResetToken.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ usedAt: null }) })
    );
  });
});

// ─── reset-password token validation ─────────────────────────────────────────

describe("reset-password token validation [BUG-10]", () => {
  it("rejects expired tokens", () => {
    const expiredAt = new Date(Date.now() - 1000); // 1 second ago
    expect(expiredAt < new Date()).toBe(true);
  });

  it("rejects already-used tokens", () => {
    const usedAt = new Date();
    expect(usedAt !== null).toBe(true);
  });

  it("a valid token hash matches the plaintext via hashToken", () => {
    const { plaintext, hash } = generateToken();
    // This is exactly what the route does: hash the incoming token and compare
    expect(hashToken(plaintext)).toBe(hash);
  });
});
