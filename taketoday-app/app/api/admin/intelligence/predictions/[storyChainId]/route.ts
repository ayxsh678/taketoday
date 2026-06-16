import { captureApiError, jsonOk } from '@/lib/admin/api';
import { requireAdmin } from '@/lib/admin/authz';
import { runPredictionEngine, listPredictionsForStoryChain } from '@/lib/intelligence/prediction';
import { NextRequest } from 'next/server';

// GET /api/admin/intelligence/predictions/[storyChainId]
// Returns all predictions for a story chain, optionally filtered by status
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ storyChainId: string }> },
) {
  const access = await requireAdmin('content:read');
  if (!access.ok) return access.response;

  const { storyChainId } = await params;
  const status = req.nextUrl.searchParams.get('status') as
    | 'ACTIVE'
    | 'RESOLVED'
    | 'EXPIRED'
    | 'CANCELLED'
    | null;

  try {
    const predictions = await listPredictionsForStoryChain(storyChainId, status ?? undefined);
    return jsonOk({ predictions, count: predictions.length });
  } catch (err) {
    return captureApiError(err);
  }
}

// POST /api/admin/intelligence/predictions/[storyChainId]
// Manually trigger the prediction engine for a story chain
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ storyChainId: string }> },
) {
  const access = await requireAdmin('ai:run');
  if (!access.ok) return access.response;

  const { storyChainId } = await params;
  try {
    const result = await runPredictionEngine(storyChainId);
    return jsonOk(result);
  } catch (err) {
    return captureApiError(err);
  }
}
