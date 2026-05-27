import {
  Bot,
  CalendarClock,
  CheckCircle2,
  FileText,
  Megaphone,
  MousePointerClick,
  Newspaper,
  TrendingUp,
} from "lucide-react";
import { ArticleStatus, JobStatus, type Notification as DbNotification } from "@prisma/client";
import { activityEvents, trafficSeries } from "@/lib/admin/data";
import { prisma } from "@/lib/db/prisma";
import { AdminMotion } from "@/components/admin/AdminMotion";
import { ActivityTimeline } from "@/components/admin/ActivityTimeline";
import { ArticleTable } from "@/components/admin/ArticleTable";
import { DashboardQuickActions } from "@/components/admin/DashboardQuickActions";
import { MetricCard } from "@/components/admin/MetricCard";
import { MiniChart } from "@/components/admin/MiniChart";
import { Badge } from "@/components/ui/badge";
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

export default async function AdminDashboardPage() {
  const now = new Date();
  const d30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const d60 = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

  let publishedTotal = 0, publishedLast30 = 0, publishedPrev30 = 0;
  let draftsTotal = 0, draftsLast30 = 0, draftsPrev30 = 0;
  let scheduledTotal = 0, scheduledLast30 = 0, scheduledPrev30 = 0;
  let pendingTotal = 0, pendingLast30 = 0, pendingPrev30 = 0;
  let socialTotal = 0, socialLast30 = 0, socialPrev30 = 0;
  let traffic = 0, trafficPrev = 0, ctr = 0;
  let aiTotal = 0, aiLast30 = 0, aiPrev30 = 0;
  let dbNotifications: DbNotification[] = [];
  let dbError = false;

  try {
    const [
      _publishedTotal,
      _publishedLast30,
      _publishedPrev30,
      _draftsTotal,
      _draftsLast30,
      _draftsPrev30,
      _scheduledTotal,
      _scheduledLast30,
      _scheduledPrev30,
      _pendingTotal,
      _pendingLast30,
      _pendingPrev30,
      _socialTotal,
      _socialLast30,
      _socialPrev30,
      videoJobsTotal,
      videoJobsLast30,
      videoJobsPrev30,
      ingestionSucceeded,
      ingestionLast30,
      ingestionPrev30,
      trafficAgg,
      trafficPrevAgg,
      ctrAgg,
      notifications,
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

      prisma.article.count({ where: { status: ArticleStatus.UNDER_REVIEW } }),
      prisma.article.count({ where: { status: ArticleStatus.UNDER_REVIEW, createdAt: { gte: d30 } } }),
      prisma.article.count({ where: { status: ArticleStatus.UNDER_REVIEW, createdAt: { gte: d60, lt: d30 } } }),

      prisma.socialPost.count({ where: { status: JobStatus.SUCCEEDED } }),
      prisma.socialPost.count({ where: { status: JobStatus.SUCCEEDED, publishedAt: { gte: d30 } } }),
      prisma.socialPost.count({ where: { status: JobStatus.SUCCEEDED, publishedAt: { gte: d60, lt: d30 } } }),

      prisma.shortVideoJob.count(),
      prisma.shortVideoJob.count({ where: { createdAt: { gte: d30 } } }),
      prisma.shortVideoJob.count({ where: { createdAt: { gte: d60, lt: d30 } } }),

      prisma.ingestionJob.count({ where: { status: JobStatus.SUCCEEDED } }),
      prisma.ingestionJob.count({ where: { status: JobStatus.SUCCEEDED, createdAt: { gte: d30 } } }),
      prisma.ingestionJob.count({ where: { status: JobStatus.SUCCEEDED, createdAt: { gte: d60, lt: d30 } } }),

      prisma.analyticsEvent.aggregate({
        where: { type: "pageview", createdAt: { gte: d30 } },
        _sum: { value: true },
      }),
      prisma.analyticsEvent.aggregate({
        where: { type: "pageview", createdAt: { gte: d60, lt: d30 } },
        _sum: { value: true },
      }),
      prisma.analyticsEvent.aggregate({
        where: { type: "ctr", createdAt: { gte: d30 } },
        _avg: { value: true },
      }),

      prisma.notification.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
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
    pendingTotal = _pendingTotal;
    pendingLast30 = _pendingLast30;
    pendingPrev30 = _pendingPrev30;
    socialTotal = _socialTotal;
    socialLast30 = _socialLast30;
    socialPrev30 = _socialPrev30;
    traffic = trafficAgg._sum.value ?? 0;
    trafficPrev = trafficPrevAgg._sum.value ?? 0;
    ctr = ctrAgg._avg.value ?? 0;
    aiTotal = videoJobsTotal + ingestionSucceeded;
    aiLast30 = videoJobsLast30 + ingestionLast30;
    aiPrev30 = videoJobsPrev30 + ingestionPrev30;
    dbNotifications = notifications;
  } catch {
    dbError = true;
  }

  return (
    <AdminMotion>
      <div className="space-y-6">
        {dbError && (
          <div className="rounded-md border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">
            ⚠ Database connection error — displayed values may not reflect live data.
          </div>
        )}

        <section className="flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
          <div>
            <Badge tone="green">Live newsroom</Badge>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">Dashboard Home</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-400">
              A single operating surface for editorial velocity, approvals, distribution health, and audience performance.
            </p>
          </div>
          <DashboardQuickActions />
        </section>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            label="Published news"
            value={formatCount(publishedTotal)}
            delta={computeDelta(publishedLast30, publishedPrev30)}
            icon={Newspaper}
          />
          <MetricCard
            label="Drafts"
            value={formatCount(draftsTotal)}
            delta={computeDelta(draftsLast30, draftsPrev30)}
            icon={FileText}
          />
          <MetricCard
            label="Scheduled posts"
            value={formatCount(scheduledTotal)}
            delta={computeDelta(scheduledLast30, scheduledPrev30)}
            icon={CalendarClock}
          />
          <MetricCard
            label="Pending approvals"
            value={formatCount(pendingTotal)}
            delta={computeDelta(pendingLast30, pendingPrev30)}
            icon={CheckCircle2}
          />
          <MetricCard
            label="Social posts published"
            value={formatCount(socialTotal)}
            delta={computeDelta(socialLast30, socialPrev30)}
            icon={Megaphone}
          />
          <MetricCard
            label="Website traffic"
            value={traffic === 0 ? "—" : formatCount(Math.round(traffic))}
            delta={computeDelta(Math.round(traffic), Math.round(trafficPrev))}
            icon={TrendingUp}
          />
          <MetricCard
            label="Engagement CTR"
            value={ctr === 0 ? "—" : `${ctr.toFixed(1)}%`}
            delta="—"
            icon={MousePointerClick}
          />
          <MetricCard
            label="AI-generated assets"
            value={formatCount(aiTotal)}
            delta={computeDelta(aiLast30, aiPrev30)}
            icon={Bot}
          />
        </section>

        <section className="grid gap-6 lg:grid-cols-2 xl:grid-cols-[1.4fr_0.6fr]">
          <Card>
            <CardHeader>
              <CardTitle>Traffic Performance</CardTitle>
              <CardDescription>Audience trend for the last seven publishing windows.</CardDescription>
            </CardHeader>
            <CardContent>
              <MiniChart data={trafficSeries} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Activity Timeline</CardTitle>
              <CardDescription>Approvals, AI jobs, publishing status, and distribution events.</CardDescription>
            </CardHeader>
            <CardContent>
              <ActivityTimeline events={activityEvents} />
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 lg:grid-cols-2 xl:grid-cols-[1.4fr_0.6fr]">
          <Card>
            <CardHeader>
              <CardTitle>Recent Content</CardTitle>
              <CardDescription>Content pipeline with workflow status, owner, and priority.</CardDescription>
            </CardHeader>
            <CardContent>
              <ArticleTable />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>System alerts and operational events.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {dbNotifications.length > 0 ? (
                dbNotifications.map((item) => (
                  <div key={item.id} className="rounded-md border border-white/10 bg-white/4 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium text-white">{item.title}</p>
                      {!item.read && <Badge tone="amber">new</Badge>}
                    </div>
                    <p className="mt-2 text-sm leading-6 text-zinc-400">{item.message}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-zinc-500">No notifications.</p>
              )}
            </CardContent>
          </Card>
        </section>
      </div>
    </AdminMotion>
  );
}
