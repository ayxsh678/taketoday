import { captureApiError, jsonOk } from '@/lib/admin/api';
import { requireAdmin } from '@/lib/admin/authz';
import { getStoryGraph, getStoryEntityGraph } from '@/lib/intelligence/knowledge-graph';
import { NextRequest } from 'next/server';

// GET /api/admin/intelligence/graph/story/[storyChainId]?view=articles|entities
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ storyChainId: string }> },
) {
  const access = await requireAdmin('content:read');
  if (!access.ok) return access.response;

  const { storyChainId } = await params;
  const view = req.nextUrl.searchParams.get('view') ?? 'articles';

  try {
    const graph =
      view === 'entities'
        ? await getStoryEntityGraph(storyChainId)
        : await getStoryGraph(storyChainId);
    return jsonOk(graph);
  } catch (err) {
    return captureApiError(err);
  }
}
