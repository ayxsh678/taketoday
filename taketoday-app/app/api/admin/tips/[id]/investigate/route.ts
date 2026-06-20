import { jsonError } from "@/lib/admin/api";
export async function GET() { return jsonError("Tips feature is disabled.", 503); }
export async function POST() { return jsonError("Tips feature is disabled.", 503); }
export async function PUT() { return jsonError("Tips feature is disabled.", 503); }
export async function DELETE() { return jsonError("Tips feature is disabled.", 503); }
