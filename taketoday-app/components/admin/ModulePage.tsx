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
    <div className="space-y-8">
      <section className="flex flex-col items-start justify-between gap-6 xl:flex-row xl:items-center">
        <div className="flex-1">
          <Badge tone="blue">{blueprint.eyebrow}</Badge>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-white">{blueprint.title}</h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-zinc-300">{blueprint.description}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          {blueprint.actions.slice(0, 3).map((action, index) => (
            <Button 
              key={action} 
              variant={index === 0 ? "primary" : "secondary"} 
              className="px-6 py-3"
            >
              {action}
            </Button>
          ))}
        </div>
      </section>

      <div className="grid gap-8 xl:grid-cols-[1.3fr_0.9fr]">
        <Card className="border border-white/5">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold">Operational Workspace</CardTitle>
            <CardDescription className="mt-1 text-sm text-zinc-400">
              Fast controls for the module’s most common workflow.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <Input 
                placeholder="Search records, people, sources..." 
                className="h-12"
              />
              <Input 
                placeholder="Filter by status, role, platform..." 
                className="h-12"
              />
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {blueprint.actions.map((action) => (
                <button
                  key={action}
                  type="button"
                  className="flex w-full items-center justify-between rounded-lg border border-white/10 bg-white/[0.03] px-6 py-4 text-left text-sm font-medium text-zinc-200 transition-all hover:border-white/20 hover:bg-white/[0.05] hover:text-white focus:outline-none focus:ring-2 focus:ring-white/[0.1]"
                >
                  {action}
                  <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                </button>
              ))}
            </div>
            <Textarea 
              placeholder="Draft instructions, review notes, source URLs, or API payload notes..." 
              className="h-32"
            />
          </CardContent>
        </Card>

        <Card className="border border-white/5">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold">Controls and Security</CardTitle>
            <CardDescription className="mt-1 text-sm text-zinc-400">
              Production controls wired for RBAC, auditability, and safe automation.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            {["RBAC enforced", "Audit logs captured", "Rate-limit ready", "Validation via Zod", "2FA-ready sessions"].map((item) => (
              <div 
                key={item} 
                className="flex items-center gap-4 rounded-lg border border-white/10 bg-white/[0.02] px-5 py-3 text-sm font-medium text-zinc-200 transition-colors hover:bg-white/[0.03]"
              >
                <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0" />
                {item}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <Card className="lg:col-span-2 border border-white/5">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold">Performance Signal</CardTitle>
            <CardDescription className="mt-1 text-sm text-zinc-400">
              Interactive chart surface for module-level outcomes.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <MiniChart data={engagementSeries} className="h-48 w-full" />
          </CardContent>
        </Card>

        <Card className="border border-white/5">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold">AI Actions</CardTitle>
            <CardDescription className="mt-1 text-sm text-zinc-400">
              Assistant patterns ready for OpenAI or Claude providers.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            {["Summarize", "Rewrite", "Generate hashtags", "Bullish perspective", "Bearish perspective"].map((item) => (
              <Button 
                key={item} 
                variant="secondary" 
                className="w-full flex items-center justify-between px-5 py-3 text-left"
              >
                <div className="flex items-center gap-3">
                  <Sparkles className="h-4 w-4" />
                  {item}
                </div>
              </Button>
            ))}
          </CardContent>
        </Card>
      </div>

      {moduleKey === "users" && (
        <Card className="border border-white/5">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold">Permission Matrix</CardTitle>
            <CardDescription className="mt-1 text-sm text-zinc-400">
              Role boundaries for the current admin architecture.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 grid gap-4 md:grid-cols-2">
            {roleMatrix.map((role) => (
              <div 
                key={role.role} 
                className="flex flex-col items-start gap-3 rounded-lg border border-white/10 bg-white/[0.02] px-5 py-4 transition-colors hover:bg-white/[0.03]"
              >
                <div className="flex items-center gap-3">
                  <Badge tone="violet" className="flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    <span className="font-medium">{role.role}</span>
                  </Badge>
                </div>
                <p className="text-sm text-zinc-300 leading-6">{role.access}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {moduleKey === "social" && (
        <Card className="border border-white/5">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold">Platform Preview</CardTitle>
            <CardDescription className="mt-1 text-sm text-zinc-400">
              One composer, platform-specific rendering and retry logs.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 grid gap-4 md:grid-cols-3">
            {socialPlatforms.map((platform) => (
              <div 
                key={platform} 
                className="flex flex-col items-start gap-3 rounded-lg border border-white/10 bg-zinc-950/20 px-5 py-4 transition-colors hover:bg-zinc-950/30"
              >
                <div className="flex items-center gap-3">
                  <Search className="h-4 w-4" />
                  <span className="font-medium text-white">{platform}</span>
                </div>
                <p className="mt-2 text-sm text-zinc-300 leading-6">
                  Preview, schedule, publish, and inspect retries for {platform}.
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card className="border border-white/5">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold">Audit Trail</CardTitle>
          <CardDescription className="mt-1 text-sm text-zinc-400">
            Every sensitive action should write here before shipping to production.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4 space-y-3">
          {auditEvents.map((event) => (
            <div 
              key={`${event.actor}-${event.at}`} 
              className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.02] px-5 py-3 text-sm font-medium text-zinc-200 transition-colors hover:bg-white/[0.03]"
            >
              <span className="flex items-center gap-3">
                <span className="text-white">{event.actor}</span> {event.event}
              </span>
              <span className="text-zinc-400">{event.at}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
