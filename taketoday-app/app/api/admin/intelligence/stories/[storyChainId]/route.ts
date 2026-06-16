import { captureApiError, jsonError, jsonOk } from '@/lib/admin/api';
import { requireAdmin } from '@/lib/admin/authz';
import { findStoryChainById } from '@/lib/intelligence/repositories/story-chain';
import { listQuestions } from '@/lib/intelligence/repositories/question';
import { listPredictionsForStoryChain } from '@/lib/intelligence/repositories/prediction';
import { findDossierForStoryChain } from '@/lib/intelligence/repositories/dossier';
import { prisma } from '@/lib/db/prisma';
import { NextRequest } from 'next/server';

// GET /api/admin/intelligence/stories/[storyChainId]
// Returns chain + recent articles + questions + predictions + dossier
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ storyChainId: string }> },
) {
  const access = await requireAdmin('content:read');
  if (!access.ok) return access.response;

  const { storyChainId } = await params;

  try {
    const [chain, articles, questions, predictions, dossier] = await Promise.all([
      findStoryChainById(storyChainId),
      prisma.article.findMany({
        where: { storyChainId },
        orderBy: { publishedAt: 'desc' },
        take: 20,
        select: {
          id: true,
          headline: true,
          slug: true,
          publishedAt: true,
          importanceScore: true,
          status: true,
        },
      }),
      listQuestions({ storyChainId, limit: 30 }),
      listPredictionsForStoryChain(storyChainId),
      findDossierForStoryChain(storyChainId),
    ]);

    if (!chain) return jsonError('Story chain not found', 404);

    return jsonOk({ chain, articles, questions, predictions, dossier });
  } catch (err) {
    return captureApiError(err);
  }
}
