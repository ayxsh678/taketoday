import { engagementSeries, trafficSeries } from "@/lib/admin/data";
import { jsonOk } from "@/lib/admin/api";
import { requireAdmin } from "@/lib/admin/authz";

export async function GET() {
  const access = await requireAdmin("analytics:read");
  if (!access.ok) return access.response;

  return jsonOk({
    traffic: trafficSeries,
    engagement: engagementSeries,
    topStories: [
      { slug: "openai-enterprise-workspace-controls", views: 18420, ctr: 9.8 },
      { slug: "india-upi-merchant-caps-fintech", views: 14210, ctr: 8.6 },
      { slug: "nvidia-datacenter-cloud-buyers", views: 11840, ctr: 7.9 },
    ],
    sourcePerformance: [
      { source: "RSS", conversion: 22 },
      { source: "Manual", conversion: 31 },
      { source: "X trends", conversion: 18 },
    ],
  });
}
