import { jsonOk, rateLimit } from "@/lib/admin/api";
import { requireAdmin } from "@/lib/admin/authz";

export async function GET(request: Request) {
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
      cloudinary: Boolean(process.env.CLOUDINARY_URL),
      openai: Boolean(process.env.OPENAI_API_KEY),
      anthropic: Boolean(process.env.ANTHROPIC_API_KEY),
      social: ["X", "Instagram", "WhatsApp", "Telegram", "Facebook", "LinkedIn"],
    },
  });
}
