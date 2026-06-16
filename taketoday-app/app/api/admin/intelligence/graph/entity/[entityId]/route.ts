import { captureApiError, jsonOk } from '@/lib/admin/api';
import { requireAdmin } from '@/lib/admin/authz';
import { getEntityGraph } from '@/lib/intelligence/knowledge-graph';
import { NextRequest } from 'next/server';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ entityId: string }> },
) {
  const access = await requireAdmin('content:read');
  if (!access.ok) return access.response;

  const { entityId } = await params;
  try {
    const graph = await getEntityGraph(entityId);
    return jsonOk(graph);
  } catch (err) {
    return captureApiError(err);
  }
}
