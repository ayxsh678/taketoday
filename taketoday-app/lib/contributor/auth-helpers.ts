import { prisma } from "@/lib/db/prisma";

/**
 * Generate a unique contributor username from a display name or email prefix.
 * Sanitizes to lowercase alphanumeric + underscores, appends a numeric suffix
 * on collision, and falls back to a base36 timestamp for guaranteed uniqueness.
 */
export async function generateUniqueUsername(
  name: string,
  email: string,
): Promise<string> {
  const base =
    (name || email.split("@")[0])
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "_")
      .replace(/_+/g, "_")
      .replace(/^_|_$/g, "")
      .slice(0, 20) || "user";

  for (let attempt = 0; attempt < 10; attempt++) {
    const candidate =
      attempt === 0 ? base : `${base}_${Math.floor(1000 + Math.random() * 9000)}`;
    const exists = await prisma.publicUser.findUnique({ where: { username: candidate } });
    if (!exists) return candidate;
  }
  return `${base}_${Date.now().toString(36)}`;
}

/**
 * Create a new PublicUser for a first-time Google sign-in.
 * Also seeds the ContributorReputation row with default values.
 */
export async function createGoogleUser(
  email: string,
  displayName: string,
  avatar: string | null,
) {
  const username = await generateUniqueUsername(displayName, email);
  return prisma.publicUser.create({
    data: {
      email,
      username,
      displayName: displayName || username,
      avatar,
      reputation: { create: {} },
    },
    include: { reputation: true },
  });
}
