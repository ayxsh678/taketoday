// Global test setup — mocks for Next.js server environment

import { vi } from "vitest";

// server-only throws when imported outside Next.js server context
vi.mock("server-only", () => ({}));

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
    },
    publicUser: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    contributionEmbedding: {
      upsert: vi.fn(),
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
