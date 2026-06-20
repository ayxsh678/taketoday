import { jsonOk } from "@/lib/admin/api";
export async function GET() {
  return jsonOk({ usage: [], total: 0 });
}
