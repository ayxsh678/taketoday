import { jsonOk } from "@/lib/admin/api";
import { requireAdmin } from "@/lib/admin/authz";

export async function GET() {
  const access = await requireAdmin("media:write");
  if (!access.ok) return access.response;

  return jsonOk({
    folders: ["Top stories", "Social cards", "Reels", "Founders", "Markets"],
    assets: [
      { id: "asset_001", name: "openai-enterprise-card.png", type: "image", tags: ["AI", "OpenAI"], size: "412 KB" },
      { id: "asset_002", name: "upi-policy-thumb.jpg", type: "image", tags: ["India", "Finance"], size: "284 KB" },
      { id: "asset_003", name: "daily-brief-reel.mp4", type: "video", tags: ["Briefings"], size: "18 MB" },
    ],
  });
}
