import { jsonError } from "@/lib/admin/api";
export async function POST() {
  return jsonError("AI verification is disabled.", 503);
}
