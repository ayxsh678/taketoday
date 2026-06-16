import { captureApiError, jsonOk } from '@/lib/admin/api';
import { requireAdmin } from '@/lib/admin/authz';
import { runResearchAgent, hasFreshDossier } from '@/lib/intelligence/research';
import { findDossierForStoryChain } from '@/lib/intelligence/repositories/dossier';
import { NextRequest } from 'next/server';

// GET /api/admin/intelligence/research/[storyChainId]
// Returns the existing dossier for a story chain (if any)
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ storyChainId: string }> },
) {
  const access = await requireAdmin('content:read');
  if (!access.ok) return access.response;

  const { storyChainId } = await params;
  try {
    const dossier = await findDossierForStoryChain(storyChainId);
    return jsonOk({ dossier });
  } catch (err) {
    return captureApiError(err);
  }
}

// POST /api/admin/intelligence/research/[storyChainId]
// Triggers (or re-triggers) a research agent run for the story chain.
// Skips if a fresh dossier exists (< 24h), unless ?force=true
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ storyChainId: string }> },
) {
  const access = await requireAdmin('ai:run');
  if (!access.ok) return access.response;

  const { storyChainId } = await params;
  const force = req.nextUrl.searchParams.get('force') === 'true';

  try {
    if (!force) {
      const fresh = await hasFreshDossier(storyChainId);
      if (fresh) {
        return jsonOk({ skipped: true, reason: 'fresh_dossier_exists' });
      }
    }

    const result = await runResearchAgent(storyChainId);
    return jsonOk(result);
  } catch (err) {
    return captureApiError(err);
  }
}
