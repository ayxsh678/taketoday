// Global test setup — mocks for Next.js server environment

import { vi } from "vitest";

// server-only throws when imported outside Next.js server context
vi.mock("server-only", () => ({}));

// next-auth can't resolve next/server in the Vitest node env
vi.mock("next-auth", () => ({
  default: vi.fn(() => ({
    handlers: {},
    auth: vi.fn(),
    signIn: vi.fn(),
    signOut: vi.fn(),
  })),
}));
vi.mock("next-auth/providers/google", () => ({ default: vi.fn(() => ({})) }));
vi.mock("next-auth/providers/credentials", () => ({ default: vi.fn(() => ({})) }));

// Mock contributor authz — GET /api/contribute is public but the module also exports POST which uses requireContributor
vi.mock("@/lib/contributor/authz", () => ({
  requireContributor: vi.fn().mockResolvedValue({ ok: false, response: new Response("Unauthorized", { status: 401 }) }),
}));;

// Mock Next.js server-only APIs
vi.mock("next/headers", () => ({
  cookies: vi.fn(() => ({ get: vi.fn(), set: vi.fn() })),
  headers: vi.fn(() => new Headers()),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
  notFound: vi.fn(),
}));

// Mock Prisma client
vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    article: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    job: {
      create: vi.fn(),
      update: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      updateMany: vi.fn(),
    },
    notification: {
      findMany: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      count: vi.fn(),
      findFirst: vi.fn(),
    },
    adminUser: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      upsert: vi.fn(),
    },
    ingestionJob: {
      findMany: vi.fn(),
      create: vi.fn(),
      count: vi.fn(),
    },
    socialPost: {
      findMany: vi.fn(),
      createMany: vi.fn(),
      groupBy: vi.fn(),
      count: vi.fn(),
    },
    reviewComment: {
      create: vi.fn(),
    },
    contribution: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    publicUser: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    passwordResetToken: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    emailVerificationToken: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    contributionEmbedding: {
      upsert: vi.fn(),
    },
    transparencyLog: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
    investigationMember: {
      count: vi.fn(),
    },
    userBadge: {
      findMany: vi.fn(),
    },
    $transaction: vi.fn(),
    $queryRaw: vi.fn(),
    $executeRaw: vi.fn(),
  },
}));

// Mock auth
vi.mock("@/auth", () => ({
  auth: vi.fn(async () => ({
    user: {
      id: "test-admin-id",
      email: "test@example.com",
      name: "Test Admin",
      isAdmin: true,
      role: "Super Admin",
    },
  })),
}));

// Mock Sentry
vi.mock("@sentry/nextjs", () => ({
  captureException: vi.fn(),
  init: vi.fn(),
}));
