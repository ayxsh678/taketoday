import { captureApiError, jsonOk } from '@/lib/admin/api';
import { requireAdmin } from '@/lib/admin/authz';
import { listQuestions } from '@/lib/intelligence/repositories/question';
import type { QuestionStatus, QuestionType } from '@prisma/client';
import { NextRequest } from 'next/server';

// GET /api/admin/intelligence/questions?status=OPEN&type=FUTURE&storyChainId=...&limit=30&offset=0
export async function GET(req: NextRequest) {
  const access = await requireAdmin('content:read');
  if (!access.ok) return access.response;

  const sp = req.nextUrl.searchParams;
  const status = sp.get('status') as QuestionStatus | null;
  const type = sp.get('type') as QuestionType | null;
  const storyChainId = sp.get('storyChainId') ?? undefined;
  const limit = Math.min(parseInt(sp.get('limit') ?? '30', 10), 100);
  const offset = parseInt(sp.get('offset') ?? '0', 10);

  try {
    const questions = await listQuestions({
      status: status ?? undefined,
      type: type ?? undefined,
      storyChainId,
      limit,
      offset,
    });
    return jsonOk({ questions, count: questions.length });
  } catch (err) {
    return captureApiError(err);
  }
}
