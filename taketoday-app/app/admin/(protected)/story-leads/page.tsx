"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, RefreshCw, Trash2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface StoryLead {
  id: string;
  source: string;
  title: string;
  link: string;
  excerpt: string;
  publishedAt: string | null;
}

interface SourceCount {
  name: string;
  count: number;
}

function relTime(iso: string | null): string {
  if (!iso) return "";
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function StoryLeadsPage() {
  const router = useRouter();
  const [items, setItems]     = useState<StoryLead[]>([]);
  const [sources, setSources] = useState<SourceCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive]   = useState<string>("All");
  const [acting, setActing]   = useState<string | null>(null);

  const fetchLeads = useCallback(async (source?: string) => {
    setLoading(true);
    try {
      const url = new URL("/api/admin/story-leads", window.location.origin);
      if (source && source !== "All") url.searchParams.set("source", source);
      const res  = await fetch(url.toString());
      const json = await res.json() as { data: { items: StoryLead[]; sources: SourceCount[] } };
      setItems(json.data.items);
      setSources(json.data.sources);
    } catch { /* non-critical */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void fetchLeads(); }, [fetchLeads]);

  const act = async (id: string, action: "dismiss" | "use", lead?: StoryLead) => {
    setActing(id);
    try {
      await fetch("/api/admin/story-leads", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action }),
      });
      if (action === "use" && lead) {
        const params = new URLSearchParams({ headline: lead.title });
        if (lead.excerpt) params.set("excerpt", lead.excerpt);
        router.push(`/admin/content?${params.toString()}`);
        return;
      }
      setItems((prev) => prev.filter((i) => i.id !== id));
    } finally {
      setActing(null);
    }
  };

  const totalCount = sources.reduce((s, c) => s + c.count, 0);

  return (
    <div className="space-y-6">
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-white">Story Leads</h1>
          <p className="mt-2 text-sm leading-6 text-zinc-400">
            Incoming stories from RSS feeds. One click to start writing.
          </p>
        </div>
        <Button variant="secondary" onClick={() => void fetchLeads(active !== "All" ? active : undefined)}>
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </section>

      {/* source filter tabs */}
      <div className="flex flex-wrap gap-2">
        {[{ name: "All", count: totalCount }, ...sources.map((s) => ({ name: s.name, count: s.count }))].map((s) => (
          <button
            key={s.name}
            type="button"
            onClick={() => { setActive(s.name); void fetchLeads(s.name !== "All" ? s.name : undefined); }}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              active === s.name
                ? "bg-white text-zinc-900"
                : "bg-white/8 text-zinc-400 hover:bg-white/12"
            }`}
          >
            {s.name}
            <span className="rounded-full bg-white/20 px-1.5 py-0.5 text-[10px]">{s.count}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <p className="py-12 text-center text-sm text-zinc-500">Loading…</p>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-sm text-zinc-500">No new stories. Check back after next cron run.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <Card key={item.id} className="transition-colors hover:border-white/20">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge tone="neutral" className="text-[10px]">{item.source}</Badge>
                      {item.publishedAt && (
                        <span className="text-[11px] text-zinc-500">{relTime(item.publishedAt)}</span>
                      )}
                    </div>
                    <CardTitle className="text-base leading-snug">{item.title}</CardTitle>
                  </div>
                </div>
              </CardHeader>
              {item.excerpt && (
                <CardContent className="pb-3 pt-0">
                  <CardDescription className="line-clamp-2">{item.excerpt}</CardDescription>
                </CardContent>
              )}
              <CardContent className="flex items-center gap-2 pt-0">
                <Button
                  className="h-8 px-3 text-sm"
                  onClick={() => void act(item.id, "use", item)}
                  disabled={acting === item.id}
                >
                  <ArrowRight className="h-3.5 w-3.5" />
                  Use story
                </Button>
                <Button
                  variant="ghost"
                  className="h-8 px-3 text-sm"
                  className="text-zinc-500 hover:text-white"
                  onClick={() => window.open(item.link, "_blank", "noopener")}
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Source
                </Button>
                <Button
                  variant="ghost"
                  className="h-8 px-3 text-sm"
                  className="ml-auto text-zinc-600 hover:text-red-400"
                  onClick={() => void act(item.id, "dismiss")}
                  disabled={acting === item.id}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
