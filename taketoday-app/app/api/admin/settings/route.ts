import { NextRequest } from "next/server";
import { jsonError, jsonOk, rateLimit } from "@/lib/admin/api";
import { requireAdmin } from "@/lib/admin/authz";
import { appConfig } from "@lib/config/app";

export async function GET(request: NextRequest) {
  // Check rate limit
  if (rateLimit(request)) {
    return jsonError("Rate limit exceeded. Please try again later.", 429);
  }

  const access = await requireAdmin("settings:manage");
  if (!access.ok) return access.response;

  return jsonOk({
    branding: { name: "TakeToday", tagline: "News. Simplified." },
    seoDefaults: { titleSuffix: "TakeToday", canonicalBase: "https://taketoday.com" },
    integrations: {
      cloudinary: Boolean(appConfig.cloudinaryUrl),
      openai: Boolean(appConfig.openaiApiKey),
      anthropic: Boolean(appConfig.anthropicApiKey),
      social: ["X", "Instagram", "WhatsApp", "Telegram", "Facebook", "LinkedIn"],
    },
  });
}
