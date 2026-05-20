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
import { activityEvents, adminArticles, notifications, trafficSeries } from "@/lib/admin/data";
import { quickActions } from "@/lib/admin/modules";
import { AdminMotion } from "@/components/admin/AdminMotion";
import { ActivityTimeline } from "@/components/admin/ActivityTimeline";
import { ArticleTable } from "@/components/admin/ArticleTable";
import { MetricCard } from "@/components/admin/MetricCard";
import { MiniChart } from "@/components/admin/MiniChart";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminDashboardPage() {
  const published = adminArticles.filter((article) => article.status === "published").length;
  const drafts = adminArticles.filter((article) => article.status === "draft").length;
  const scheduled = adminArticles.filter((article) => article.status === "scheduled").length;
  const pending = adminArticles.filter((article) => article.status === "under_review").length;

  return (
    <AdminMotion>
      <div className="space-y-6">
        <section className="flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
          <div>
            <Badge tone="green">Live newsroom</Badge>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">Dashboard Home</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-400">
              A single operating surface for editorial velocity, approvals, distribution health, and audience performance.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {quickActions.slice(0, 4).map((action, index) => (
              <Button key={action} variant={index === 0 ? "primary" : "secondary"}>
                {action}
              </Button>
            ))}
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Published news" value={String(published)} delta="+12%" icon={Newspaper} />
          <MetricCard label="Drafts" value={String(drafts)} delta="+4%" icon={FileText} />
          <MetricCard label="Scheduled posts" value={String(scheduled)} delta="+18%" icon={CalendarClock} />
          <MetricCard label="Pending approvals" value={String(pending)} delta="+2%" icon={CheckCircle2} />
          <MetricCard label="Social posts published" value="184" delta="+31%" icon={Megaphone} />
          <MetricCard label="Website traffic" value="31.8k" delta="+9%" icon={TrendingUp} />
          <MetricCard label="Engagement CTR" value="8.4%" delta="+1.2%" icon={MousePointerClick} />
          <MetricCard label="AI-generated assets" value="426" delta="+44%" icon={Bot} />
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.4fr_0.6fr]">
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

        <section className="grid gap-6 xl:grid-cols-[1.4fr_0.6fr]">
          <Card>
            <CardHeader>
              <CardTitle>Recent Uploads</CardTitle>
              <CardDescription>Content pipeline with workflow status, owner, and priority.</CardDescription>
            </CardHeader>
            <CardContent>
              <ArticleTable />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>Real-time alerts ready for sockets or push delivery.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {notifications.map((item) => (
                <div key={item.id} className="rounded-md border border-white/10 bg-white/[0.04] p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-white">{item.title}</p>
                    {!item.read && <Badge tone="amber">new</Badge>}
                  </div>
                  <p className="mt-2 text-sm leading-6 text-zinc-400">{item.message}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>
      </div>
    </AdminMotion>
  );
}
