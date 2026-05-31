import { jsonOk } from "@/lib/admin/api";
import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/admin/authz";
import { appConfig } from "@/lib/config/app";
import { prisma } from "@/lib/db/prisma";
import { SITE } from "@/lib/site";

export async function GET(_request: NextRequest) {

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
    groq: Boolean(appConfig.groqApiKey),
    openrouter: Boolean(appConfig.openrouterApiKey),
    mistral: Boolean(appConfig.mistralApiKey),
    cloudinary: Boolean(appConfig.cloudinaryUrl),
    pythonService: Boolean(appConfig.pythonServiceUrl),
    google: Boolean(appConfig.authGoogleId),
  };

  return jsonOk({
    branding: {
      siteName: SITE.name,
      tagline: SITE.tagline,
      siteUrl: appConfig.siteUrl,
    },
    seoDefaults: {
      titleSuffix: "TakeToday",
      canonicalBase: appConfig.siteUrl,
    },
    envCapabilities,
    integrations: mappedIntegrations,
    security: {
      hasSecretKey: Boolean(appConfig.secretKey),
    },
  });
}
