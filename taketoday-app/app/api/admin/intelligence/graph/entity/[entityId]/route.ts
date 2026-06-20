import { jsonError } from "@/lib/admin/api";
export async function GET() { return jsonError("Intelligence features are disabled.", 503); }
export async function POST() { return jsonError("Intelligence features are disabled.", 503); }
export async function PUT() { return jsonError("Intelligence features are disabled.", 503); }
export async function DELETE() { return jsonError("Intelligence features are disabled.", 503); }
