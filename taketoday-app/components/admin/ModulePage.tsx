import { ArrowRight, CheckCircle2, Lock, Search, Sparkles } from "lucide-react";
import { auditEvents, moduleBlueprints, type ModuleKey } from "@/lib/admin/modules";
import { engagementSeries, roleMatrix, socialPlatforms } from "@/lib/admin/data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";
import { MiniChart } from "@/components/admin/MiniChart";

export function ModulePage({ moduleKey }: { moduleKey: ModuleKey }) {
  const blueprint = moduleBlueprints[moduleKey];

  return (
    <div className="space-y-6">
      <section className="flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
        <div>
          <Badge tone="blue">{blueprint.eyebrow}</Badge>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">{blueprint.title}</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-400">{blueprint.description}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {blueprint.actions.slice(0, 3).map((action, index) => (
            <Button key={action} variant={index === 0 ? "primary" : "secondary"}>
              {action}
            </Button>
          ))}
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <Card>
          <CardHeader>
            <CardTitle>Operational Workspace</CardTitle>
            <CardDescription>Fast controls for the module’s most common workflow.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <Input placeholder="Search records, people, sources..." />
              <Input placeholder="Filter by status, role, platform..." />
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              {blueprint.actions.map((action) => (
                <button
                  key={action}
                  type="button"
                  className="flex items-center justify-between rounded-md border border-white/10 bg-white/[0.04] p-4 text-left text-sm text-zinc-300 transition hover:border-white/20 hover:bg-white/[0.07] hover:text-white"
                >
                  {action}
                  <ArrowRight className="h-4 w-4" />
                </button>
              ))}
            </div>
            <Textarea placeholder="Draft instructions, review notes, source URLs, or API payload notes..." />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Controls and Security</CardTitle>
            <CardDescription>Production controls wired for RBAC, auditability, and safe automation.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {["RBAC enforced", "Audit logs captured", "Rate-limit ready", "Validation via Zod", "2FA-ready sessions"].map((item) => (
              <div key={item} className="flex items-center gap-3 rounded-md bg-white/[0.04] px-3 py-2 text-sm text-zinc-300">
                <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                {item}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Performance Signal</CardTitle>
            <CardDescription>Interactive chart surface for module-level outcomes.</CardDescription>
          </CardHeader>
          <CardContent>
            <MiniChart data={engagementSeries} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>AI Actions</CardTitle>
            <CardDescription>Assistant patterns ready for OpenAI or Claude providers.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {["Summarize", "Rewrite", "Generate hashtags", "Bullish perspective", "Bearish perspective"].map((item) => (
              <Button key={item} variant="secondary" className="w-full justify-start">
                <Sparkles className="h-4 w-4" />
                {item}
              </Button>
            ))}
          </CardContent>
        </Card>
      </div>

      {moduleKey === "users" && (
        <Card>
          <CardHeader>
            <CardTitle>Permission Matrix</CardTitle>
            <CardDescription>Role boundaries for the current admin architecture.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            {roleMatrix.map((role) => (
              <div key={role.role} className="rounded-md border border-white/10 p-4">
                <Badge tone="violet">
                  <Lock className="mr-1 h-3 w-3" />
                  {role.role}
                </Badge>
                <p className="mt-3 text-sm text-zinc-400">{role.access}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {moduleKey === "social" && (
        <Card>
          <CardHeader>
            <CardTitle>Platform Preview</CardTitle>
            <CardDescription>One composer, platform-specific rendering and retry logs.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-3">
            {socialPlatforms.map((platform) => (
              <div key={platform} className="rounded-md border border-white/10 bg-zinc-950/40 p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-white">
                  <Search className="h-4 w-4" />
                  {platform}
                </div>
                <p className="mt-3 text-sm leading-6 text-zinc-400">Preview, schedule, publish, and inspect retries for {platform}.</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Audit Trail</CardTitle>
          <CardDescription>Every sensitive action should write here before shipping to production.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {auditEvents.map((event) => (
            <div key={`${event.actor}-${event.at}`} className="flex items-center justify-between rounded-md bg-white/[0.04] px-3 py-2 text-sm">
              <span className="text-zinc-300">
                <span className="font-medium text-white">{event.actor}</span> {event.event}
              </span>
              <span className="text-zinc-500">{event.at}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
