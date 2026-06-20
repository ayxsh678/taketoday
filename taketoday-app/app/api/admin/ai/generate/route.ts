import { jsonError } from "@/lib/admin/api";
export async function POST() {
  return jsonError("AI features are disabled.", 503);
}
