import { captureApiError, jsonOk } from '@/lib/admin/api';
import { requireAdmin } from '@/lib/admin/authz';
import { listActiveStoryChains } from '@/lib/intelligence/repositories/story-chain';
import { NextRequest } from 'next/server';

// GET /api/admin/intelligence/stories?limit=20&offset=0
export async function GET(req: NextRequest) {
  const access = await requireAdmin('content:read');
  if (!access.ok) return access.response;

  const limit = Math.min(parseInt(req.nextUrl.searchParams.get('limit') ?? '20', 10), 50);
  const offset = parseInt(req.nextUrl.searchParams.get('offset') ?? '0', 10);

  try {
    const chains = await listActiveStoryChains(limit, offset);
    return jsonOk({ chains, count: chains.length });
  } catch (err) {
    return captureApiError(err);
  }
}
