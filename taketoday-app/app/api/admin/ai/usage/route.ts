import { NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/admin/authz';
import { jsonOk, captureApiError } from '@/lib/admin/api';
import { prisma } from '@/lib/db/prisma';

export async function GET(req: NextRequest) {
  const access = await requireAdmin('ai:run');
  if (!access.ok) return access.response;

  try {
    const { searchParams } = new URL(req.url);
    const days = Math.min(parseInt(searchParams.get('days') ?? '30', 10), 90);
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [totalRows, byModel, byTask, daily] = await Promise.all([
      prisma.aIUsage.aggregate({
        where: { createdAt: { gte: since } },
        _sum: { estimatedCost: true, inputTokens: true, outputTokens: true },
        _count: { id: true },
      }),

      prisma.aIUsage.groupBy({
        by: ['provider', 'model'],
        where: { createdAt: { gte: since } },
        _sum: { estimatedCost: true, inputTokens: true, outputTokens: true },
        _count: { id: true },
        orderBy: { _sum: { estimatedCost: 'desc' } },
      }),

      prisma.aIUsage.groupBy({
        by: ['task'],
        where: { createdAt: { gte: since } },
        _sum: { estimatedCost: true },
        _count: { id: true },
        orderBy: { _sum: { estimatedCost: 'desc' } },
      }),

      prisma.$queryRaw`
        SELECT
          DATE_TRUNC('day', "createdAt")::date::text AS date,
          CAST(SUM("estimatedCost") AS FLOAT) AS cost,
          COUNT(*)::int AS calls
        FROM ai_usage
        WHERE "createdAt" >= ${since}
        GROUP BY 1
        ORDER BY 1
      ` as Promise<Array<{ date: string; cost: number; calls: number }>>,
    ]);

    // Estimate savings: what it would have cost if all requests used gpt-55
    // GPT-55 rate: $2.50/M input + $10/M output
    const totalInputTokens = totalRows._sum.inputTokens ?? 0;
    const totalOutputTokens = totalRows._sum.outputTokens ?? 0;
    const hypotheticalCost =
      (totalInputTokens / 1_000_000) * 2.5 + (totalOutputTokens / 1_000_000) * 10;
    const actualCost = totalRows._sum.estimatedCost ?? 0;
    const estimatedSavings = Math.max(0, hypotheticalCost - actualCost);

    return jsonOk({
      period: { days, since: since.toISOString() },
      summary: {
        totalCost: actualCost,
        totalCalls: totalRows._count.id,
        totalInputTokens,
        totalOutputTokens,
        estimatedSavings,
        savingsPercent: hypotheticalCost > 0
          ? Math.round((estimatedSavings / hypotheticalCost) * 100)
          : 0,
      },
      byModel: byModel.map((r) => ({
        provider: r.provider as string,
        model: r.model as string,
        cost: (r._sum.estimatedCost ?? 0) as number,
        calls: r._count.id as number,
        inputTokens: (r._sum.inputTokens ?? 0) as number,
        outputTokens: (r._sum.outputTokens ?? 0) as number,
      })),
      byTask: byTask.map((r) => ({
        task: r.task as string,
        cost: (r._sum.estimatedCost ?? 0) as number,
        calls: r._count.id as number,
      })),
      daily: (daily as Array<{ date: string; cost: number; calls: number }>).map((r) => ({
        date: r.date,
        cost: Number(r.cost),
        calls: Number(r.calls),
      })),
    });
  } catch (err) {
    return captureApiError(err);
  }
}
