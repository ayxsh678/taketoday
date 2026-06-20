import { jsonError } from "@/lib/admin/api";
export async function GET() { return jsonError("Submissions feature is disabled.", 503); }
export async function PUT() { return jsonError("Submissions feature is disabled.", 503); }
