import { jsonError } from "@/lib/admin/api";
export async function GET() { return jsonError("Missions feature is disabled.", 503); }
export async function POST() { return jsonError("Missions feature is disabled.", 503); }
export async function PUT() { return jsonError("Missions feature is disabled.", 503); }
export async function DELETE() { return jsonError("Missions feature is disabled.", 503); }
