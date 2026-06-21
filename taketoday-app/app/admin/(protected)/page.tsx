import {
  CalendarClock,
  FileText,
  Newspaper,
  Archive,
} from "lucide-react";
import { ArticleStatus, type AuditLog } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import type { ActivityEvent } from "@/lib/admin/types";
import { ActivityTimeline } from "@/components/admin/ActivityTimeline";
import { AnalyticsWidget } from "@/components/admin/AnalyticsWidget";
import { ArticleTable } from "@/components/admin/ArticleTable";
import { DashboardQuickActions } from "@/components/admin/DashboardQuickActions";
import { MetricCard } from "@/components/admin/MetricCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

function computeDelta(current: number, prev: number): string {
  if (prev === 0 && current === 0) return "0%";
  if (prev === 0) return current > 0 ? "+100%" : "0%";
  const pct = ((current - prev) / prev) * 100;
  const sign = pct >= 0 ? "+" : "";
  return `${sign}${pct.toFixed(1)}%`;
}

function relativeTime(date: Date): string {
  const mins = Math.floor((Date.now() - date.getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr${hrs > 1 ? "s" : ""} ago`;
  return `${Math.floor(hrs / 24)} day${Math.floor(hrs / 24) > 1 ? "s" : ""} ago`;
}

type AuditLogWithActor = AuditLog & { actor: { name: string } | null };

function auditToActivity(log: AuditLogWithActor): ActivityEvent {
  const action = log.action.toLowerCase().replace(/_/g, " ");
  const severity: ActivityEvent["severity"] =
    /delete|reject|fail|revoke/.test(action) ? "danger" :
    /publish|approve|succeed|complete/.test(action) ? "success" :
    /review|submit|warn/.test(action) ? "warning" : "info";
  return {
    id: log.id,
    actor: log.actor?.name ?? "System",
    action,
    target: `${log.entity}${log.entityId ? ` · ${log.entityId.slice(-6)}` : ""}`,
    at: relativeTime(log.createdAt),
    severity,
  };
}

export default async function AdminDashboardPage() {
  const now = new Date();
  const d30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const d60 = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

  let publishedTotal = 0, publishedLast30 = 0, publishedPrev30 = 0;
  let draftsTotal = 0, draftsLast30 = 0, draftsPrev30 = 0;
  let scheduledTotal = 0, scheduledLast30 = 0, scheduledPrev30 = 0;
  let archivedTotal = 0;
  let liveActivityEvents: ActivityEvent[] = [];
  let dbError = false;

  try {
    const [
      _publishedTotal, _publishedLast30, _publishedPrev30,
      _draftsTotal, _draftsLast30, _draftsPrev30,
      _scheduledTotal, _scheduledLast30, _scheduledPrev30,
      _archivedTotal,
      recentAuditLogs,
    ] = await Promise.all([
      prisma.article.count({ where: { status: ArticleStatus.PUBLISHED } }),
      prisma.article.count({ where: { status: ArticleStatus.PUBLISHED, publishedAt: { gte: d30 } } }),
      prisma.article.count({ where: { status: ArticleStatus.PUBLISHED, publishedAt: { gte: d60, lt: d30 } } }),

      prisma.article.count({ where: { status: ArticleStatus.DRAFT } }),
      prisma.article.count({ where: { status: ArticleStatus.DRAFT, createdAt: { gte: d30 } } }),
      prisma.article.count({ where: { status: ArticleStatus.DRAFT, createdAt: { gte: d60, lt: d30 } } }),

      prisma.article.count({ where: { status: ArticleStatus.SCHEDULED } }),
      prisma.article.count({ where: { status: ArticleStatus.SCHEDULED, createdAt: { gte: d30 } } }),
      prisma.article.count({ where: { status: ArticleStatus.SCHEDULED, createdAt: { gte: d60, lt: d30 } } }),

      prisma.article.count({ where: { status: ArticleStatus.ARCHIVED } }),

      prisma.auditLog.findMany({
        include: { actor: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take: 8,
      }),
    ]);

    publishedTotal = _publishedTotal;
    publishedLast30 = _publishedLast30;
    publishedPrev30 = _publishedPrev30;
    draftsTotal = _draftsTotal;
    draftsLast30 = _draftsLast30;
    draftsPrev30 = _draftsPrev30;
    scheduledTotal = _scheduledTotal;
    scheduledLast30 = _scheduledLast30;
    scheduledPrev30 = _scheduledPrev30;
    archivedTotal = _archivedTotal;
    liveActivityEvents = recentAuditLogs.map(auditToActivity);
  } catch {
    dbError = true;
  }

  return (
    <div className="space-y-6">
      {dbError && (
        <div
          className="rounded-lg px-4 py-3 text-sm"
          style={{
            background: "rgba(248,113,113,0.08)",
            border: "1px solid rgba(248,113,113,0.2)",
            color: "var(--adm-accent-red)",
          }}
        >
          ⚠ Database connection error — displayed values may not reflect live data.
        </div>
      )}

      <section className="flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
        <div>
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider"
            style={{
              background: "rgba(52,211,153,0.10)",
              border: "1px solid rgba(52,211,153,0.22)",
              color: "var(--adm-accent-green)",
            }}
          >
            <span className="live-dot" />
            Live newsroom
          </span>
          <h1
            className="mt-3 text-3xl font-semibold tracking-tight"
            style={{ color: "var(--adm-text-1)" }}
          >
            Dashboard
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6" style={{ color: "var(--adm-text-2)" }}>
            Content pipeline, editorial velocity, and publish status.
          </p>
        </div>
        <DashboardQuickActions />
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Published"
          value={formatCount(publishedTotal)}
          delta={computeDelta(publishedLast30, publishedPrev30)}
          icon={Newspaper}
          accent="blue"
        />
        <MetricCard
          label="Drafts"
          value={formatCount(draftsTotal)}
          delta={computeDelta(draftsLast30, draftsPrev30)}
          icon={FileText}
          accent="purple"
        />
        <MetricCard
          label="Scheduled"
          value={formatCount(scheduledTotal)}
          delta={computeDelta(scheduledLast30, scheduledPrev30)}
          icon={CalendarClock}
          accent="amber"
        />
        <MetricCard
          label="Archived"
          value={formatCount(archivedTotal)}
          delta="—"
          icon={Archive}
          accent="red"
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest editorial actions.</CardDescription>
          </CardHeader>
          <CardContent>
            {liveActivityEvents.length > 0 ? (
              <ActivityTimeline events={liveActivityEvents} />
            ) : (
              <p className="text-sm text-zinc-500">No activity recorded yet.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Content</CardTitle>
            <CardDescription>Content pipeline with workflow status.</CardDescription>
          </CardHeader>
          <CardContent>
            <ArticleTable />
          </CardContent>
        </Card>
      </section>

      <AnalyticsWidget />
    </div>
  );
}
