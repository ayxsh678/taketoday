import { captureApiError, jsonOk } from '@/lib/admin/api';
import { requireAdmin } from '@/lib/admin/authz';
import { getArticlePropagationGraph } from '@/lib/intelligence/knowledge-graph';
import { NextRequest } from 'next/server';

// GET /api/admin/intelligence/graph/propagation/[articleId]?depth=3
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ articleId: string }> },
) {
  const access = await requireAdmin('content:read');
  if (!access.ok) return access.response;

  const { articleId } = await params;
  const depth = Math.min(parseInt(req.nextUrl.searchParams.get('depth') ?? '3', 10), 5);

  try {
    const graph = await getArticlePropagationGraph(articleId, depth);
    return jsonOk(graph);
  } catch (err) {
    return captureApiError(err);
  }
}
