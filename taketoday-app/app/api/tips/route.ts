import { jsonError } from "@/lib/admin/api";
export async function POST() { return jsonError("Feature disabled.", 503); }
