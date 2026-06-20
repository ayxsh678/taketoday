import { jsonError } from "@/lib/admin/api";
export async function GET() { return jsonError("Feature disabled.", 503); }
export async function POST() { return jsonError("Feature disabled.", 503); }
