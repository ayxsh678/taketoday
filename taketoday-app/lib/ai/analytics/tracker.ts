/**
 * AI usage tracking: writes events to the DB and provides aggregate stats.
 * All write operations are fire-and-forget (never throw).
 */

import { prisma } from "@/lib/db/prisma";
import { Prisma } from "@prisma/client";
import type { AITaskType, AIProviderSlug } from "../core/types";

export interface AIUsageEvent {
  taskType: AITaskType;
  provider: AIProviderSlug | string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  costUsd?: number;
  latencyMs: number;
  success: boolean;
  error?: string;
  metadata?: Record<string, unknown>;
}

export interface AIUsageStats {
  totalCalls: number;
  successRate: number;
  avgLatencyMs: number;
  totalCostUsd: number;
  byProvider: Record<
    string,
    { calls: number; successRate: number; avgLatencyMs: number; totalCostUsd: number }
  >;
  byTaskType: Record<
    string,
    { calls: number; successRate: number; avgLatencyMs: number }
  >;
}

export interface DailyUsageStat {
  date: string;
  totalCalls: number;
  successCalls: number;
  totalCostUsd: number;
  avgLatencyMs: number;
}

export async function trackUsage(event: AIUsageEvent): Promise<void> {
  try {
    await prisma.aIUsageEvent.create({
      data: {
        taskType: event.taskType,
        provider: event.provider,
        model: event.model,
        inputTokens: event.inputTokens,
        outputTokens: event.outputTokens,
        costUsd: event.costUsd,
        latencyMs: event.latencyMs,
        success: event.success,
        error: event.error,
        metadata: event.metadata
          ? (event.metadata as Prisma.InputJsonValue)
          : undefined,
      },
    });
  } catch {
    // Fire-and-forget: never throw
  }
}

export async function getUsageStats(opts: {
  from: Date;
  to: Date;
  taskType?: AITaskType;
  provider?: AIProviderSlug;
}): Promise<AIUsageStats> {
  const where = {
    createdAt: { gte: opts.from, lte: opts.to },
    ...(opts.taskType ? { taskType: opts.taskType } : {}),
    ...(opts.provider ? { provider: opts.provider } : {}),
  };

  const events = await prisma.aIUsageEvent.findMany({ where });

  const totalCalls = events.length;
  const successCalls = events.filter((e) => e.success).length;
  const successRate = totalCalls > 0 ? successCalls / totalCalls : 0;
  const avgLatencyMs =
    totalCalls > 0
      ? events.reduce((sum, e) => sum + e.latencyMs, 0) / totalCalls
      : 0;
  const totalCostUsd = events.reduce((sum, e) => sum + (e.costUsd ?? 0), 0);

  const byProvider: AIUsageStats["byProvider"] = {};
  const byTaskType: AIUsageStats["byTaskType"] = {};

  for (const event of events) {
    const p = event.provider;
    if (!byProvider[p]) {
      byProvider[p] = { calls: 0, successRate: 0, avgLatencyMs: 0, totalCostUsd: 0 };
    }
    byProvider[p].calls++;
    if (event.success) byProvider[p].successRate++;
    byProvider[p].avgLatencyMs += event.latencyMs;
    byProvider[p].totalCostUsd += event.costUsd ?? 0;

    const t = event.taskType;
    if (!byTaskType[t]) {
      byTaskType[t] = { calls: 0, successRate: 0, avgLatencyMs: 0 };
    }
    byTaskType[t].calls++;
    if (event.success) byTaskType[t].successRate++;
    byTaskType[t].avgLatencyMs += event.latencyMs;
  }

  // Normalize aggregates
  for (const key of Object.keys(byProvider)) {
    const p = byProvider[key];
    p.successRate = p.calls > 0 ? p.successRate / p.calls : 0;
    p.avgLatencyMs = p.calls > 0 ? p.avgLatencyMs / p.calls : 0;
  }

  for (const key of Object.keys(byTaskType)) {
    const t = byTaskType[key];
    t.successRate = t.calls > 0 ? t.successRate / t.calls : 0;
    t.avgLatencyMs = t.calls > 0 ? t.avgLatencyMs / t.calls : 0;
  }

  return {
    totalCalls,
    successRate,
    avgLatencyMs,
    totalCostUsd,
    byProvider,
    byTaskType,
  };
}

export async function getDailyUsage(days: number): Promise<DailyUsageStat[]> {
  const from = new Date();
  from.setDate(from.getDate() - days);

  const events = await prisma.aIUsageEvent.findMany({
    where: { createdAt: { gte: from } },
    orderBy: { createdAt: "asc" },
  });

  const byDay = new Map<string, DailyUsageStat>();

  for (const event of events) {
    const date = event.createdAt.toISOString().slice(0, 10);
    if (!byDay.has(date)) {
      byDay.set(date, {
        date,
        totalCalls: 0,
        successCalls: 0,
        totalCostUsd: 0,
        avgLatencyMs: 0,
      });
    }
    const stat = byDay.get(date)!;
    stat.totalCalls++;
    if (event.success) stat.successCalls++;
    stat.totalCostUsd += event.costUsd ?? 0;
    stat.avgLatencyMs += event.latencyMs;
  }

  // Normalize avgLatencyMs
  const result: DailyUsageStat[] = [];
  for (const stat of byDay.values()) {
    result.push({
      ...stat,
      avgLatencyMs: stat.totalCalls > 0 ? stat.avgLatencyMs / stat.totalCalls : 0,
    });
  }

  return result.sort((a, b) => a.date.localeCompare(b.date));
}
