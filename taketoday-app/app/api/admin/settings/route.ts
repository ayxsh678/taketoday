import { jsonOk } from "@/lib/admin/api";
import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/admin/authz";
import { appConfig } from "@/lib/config/app";
import { SITE } from "@/lib/site";

export async function GET(_request: NextRequest) {
  const access = await requireAdmin("settings:manage");
  if (!access.ok) return access.response;

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
    integrations: [],
    security: {
      hasSecretKey: Boolean(appConfig.secretKey),
    },
  });
}
