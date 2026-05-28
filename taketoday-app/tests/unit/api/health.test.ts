import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/app/api/admin/health/route";
import { prisma } from "@/lib/db/prisma";
import { NextRequest } from "next/server";

// Mock appConfig so env checks pass regardless of real env
vi.mock("@/lib/config/app", () => ({
  appConfig: {
    geminiApiKey: "AIza-test",
    databaseUrl: "postgresql://test",
    nextauthSecret: "test-secret",
    pythonServiceUrl: "",
    internalServiceToken: "",
    isDevelopment: false,
    buttondownApiKey: "",
    siteUrl: "http://localhost:3000",
  },
}));

function makeRequest(searchParams?: Record<string, string>) {
  const url = new URL("http://localhost/api/admin/health");
  if (searchParams) {
    for (const [k, v] of Object.entries(searchParams)) {
      url.searchParams.set(k, v);
    }
  }
  return new NextRequest(url);
}

describe("GET /api/admin/health", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns ok when DB is healthy", async () => {
    vi.mocked(prisma.$queryRaw).mockResolvedValue([{ "?column?": 1 }]);

    const res = await GET(makeRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.status).toBe("ok");
    expect(body.db).toBe(true);
  });

  it("returns 503 when DB is down", async () => {
    vi.mocked(prisma.$queryRaw).mockRejectedValue(new Error("Connection refused"));

    const res = await GET(makeRequest());
    const body = await res.json();

    expect(res.status).toBe(503);
    expect(body.status).toBe("degraded");
    expect(body.db).toBe(false);
  });

  it("does not expose check details without token", async () => {
    vi.mocked(prisma.$queryRaw).mockResolvedValue([]);

    const res = await GET(makeRequest());
    const body = await res.json();

    expect(body).not.toHaveProperty("checks");
    expect(body).not.toHaveProperty("version");
  });
});
