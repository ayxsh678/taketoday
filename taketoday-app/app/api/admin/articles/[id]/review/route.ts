import { jsonError } from "@/lib/admin/api";
export async function POST() {
  return jsonError("Review workflow is disabled. Publish articles directly.", 503);
}
