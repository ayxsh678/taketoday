import { captureApiError, jsonError, jsonOk } from '@/lib/admin/api';
import { requireAdmin } from '@/lib/admin/authz';
import { findEntityConnectionPath } from '@/lib/intelligence/knowledge-graph';
import { NextRequest } from 'next/server';

// GET /api/admin/intelligence/graph/path?from=[entityId]&to=[entityId]
export async function GET(req: NextRequest) {
  const access = await requireAdmin('content:read');
  if (!access.ok) return access.response;

  const from = req.nextUrl.searchParams.get('from');
  const to = req.nextUrl.searchParams.get('to');
  if (!from || !to) return jsonError('Missing required params: from, to', 400);

  try {
    const result = await findEntityConnectionPath(from, to);
    return jsonOk(result);
  } catch (err) {
    return captureApiError(err);
  }
}
