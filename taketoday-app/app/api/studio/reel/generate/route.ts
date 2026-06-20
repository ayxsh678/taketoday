import { jsonError } from "@/lib/admin/api";
export async function GET() { return jsonError("Studio feature is disabled.", 503); }
export async function POST() { return jsonError("Studio feature is disabled.", 503); }
