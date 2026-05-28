import { NextRequest } from "next/server";
import { jsonError, jsonOk, rateLimit } from "@/lib/admin/api";
import { requireAdmin } from "@/lib/admin/authz";
import { appConfig } from "@/lib/config/app";
import { prisma } from "@/lib/db/prisma";

export async function GET(request: NextRequest) {
  if (rateLimit(request)) return jsonError("Rate limit exceeded. Please try again later.", 429);

  const access = await requireAdmin("settings:manage");
  if (!access.ok) return access.response;

  const integrations = await prisma.integration.findMany({
    orderBy: { provider: "asc" },
  });

  const mappedIntegrations = integrations.map((i) => ({
    id: i.id,
    provider: i.provider,
    name: i.name,
    enabled: i.enabled,
    hasConfig: i.config !== null,
    hasSecret: Boolean(i.secretRef),
    createdAt: i.createdAt.toISOString(),
    updatedAt: i.updatedAt.toISOString(),
  }));

  // Environment-detected capabilities (no DB needed)
  const envCapabilities = {
    gemini: Boolean(appConfig.geminiApiKey),
    openai: Boolean(appConfig.openaiApiKey),
    cloudinary: Boolean(appConfig.cloudinaryUrl),
    pythonService: Boolean(appConfig.pythonServiceUrl),
    google: Boolean(appConfig.authGoogleId),
  };

  return jsonOk({
    branding: {
      name: "TakeToday",
      tagline: "News. Simplified.",
      siteUrl: appConfig.siteUrl,
    },
    seoDefaults: {
      titleSuffix: "TakeToday",
      canonicalBase: appConfig.siteUrl,
    },
    envCapabilities,
    integrations: mappedIntegrations,
    security: {
      require2Fa: appConfig.require2Fa,
      hasSecretKey: Boolean(appConfig.secretKey),
    },
  });
}
