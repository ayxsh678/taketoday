"use client";

import { useState, useEffect, useTransition } from "react";
import { cn } from "@/lib/utils";

interface TrustFlag {
  id: string;
  userId: string;
  flagType: string;
  severity: number;
  details: Record<string, unknown> | null;
  resolvedAt: string | null;
  createdAt: string;
  user: { username: string; displayName: string; email: string };
}

const FLAG_COLORS: Record<string, string> = {
  SPAM_FARMING: "bg-orange-100 text-orange-800",
  COORDINATED_MANIPULATION: "bg-red-100 text-red-800",
  AI_GENERATED_JUNK: "bg-yellow-100 text-yellow-800",
  VOTE_BRIGADING: "bg-purple-100 text-purple-800",
  REPUTATION_ABUSE: "bg-pink-100 text-pink-800",
  SYBIL_SUSPECTED: "bg-red-200 text-red-900",
  QUALITY_BREACH: "bg-gray-100 text-gray-700",
};

export default function TrustSafetyPage() {
  const [flags, setFlags] = useState<TrustFlag[]>([]);
  const [filter, setFilter] = useState<"open" | "resolved">("open");
  const [isPending, startTransition] = useTransition();

  function load() {
    startTransition(async () => {
      const res = await fetch(`/api/admin/trust-safety?resolved=${filter === "resolved"}&limit=100`);
      const data = await res.json() as { flags?: TrustFlag[] };
      setFlags(data.flags ?? []);
    });
  }

  useEffect(() => { load(); }, [filter]);

  async function resolveFlag(flagId: string) {
    await fetch("/api/admin/trust-safety", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ flagId }),
    });
    setFlags((prev) => prev.filter((f) => f.id !== flagId));
  }

  const openCount = flags.filter((f) => !f.resolvedAt).length;

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-ink">Trust & Safety</h1>
        <p className="text-sm text-ink/50 mt-1">Automated and manual abuse flags for contributor accounts</p>
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-6">
        {(["open", "resolved"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "px-4 py-1.5 rounded-lg text-sm font-medium border transition-colors",
              filter === f ? "bg-ink text-paper border-ink" : "bg-paper text-ink/60 border-ink/15 hover:border-ink/30",
            )}
          >
            {f === "open" ? `Open${openCount ? ` (${openCount})` : ""}` : "Resolved"}
          </button>
        ))}
      </div>

      {isPending && <div className="text-sm text-ink/40">Loading…</div>}

      {!isPending && flags.length === 0 && (
        <div className="py-16 text-center text-ink/30 text-sm border border-dashed border-ink/10 rounded-xl">
          No {filter} flags.
        </div>
      )}

      <div className="space-y-3">
        {flags.map((flag) => (
          <div key={flag.id} className="border border-ink/10 rounded-xl p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className={cn("text-[11px] px-2 py-0.5 rounded-full font-mono", FLAG_COLORS[flag.flagType] ?? "bg-gray-100 text-gray-700")}>
                    {flag.flagType.replace(/_/g, " ")}
                  </span>
                  <span className={cn(
                    "text-[11px] px-2 py-0.5 rounded-full font-mono",
                    flag.severity >= 0.7 ? "bg-red-100 text-red-800" :
                    flag.severity >= 0.4 ? "bg-orange-100 text-orange-700" :
                    "bg-gray-100 text-gray-600",
                  )}>
                    Severity {Math.round(flag.severity * 100)}%
                  </span>
                  {flag.resolvedAt && (
                    <span className="text-[11px] text-green-700 font-mono">✓ Resolved</span>
                  )}
                </div>

                <div className="text-sm font-medium text-ink mb-0.5">
                  {flag.user.displayName}{" "}
                  <span className="font-normal text-ink/40">@{flag.user.username}</span>
                </div>
                <div className="text-xs text-ink/40 mb-2">{flag.user.email}</div>

                {flag.details && Object.keys(flag.details).length > 0 && (
                  <div className="text-xs text-ink/40 font-mono bg-ink/3 rounded-lg px-2.5 py-1.5">
                    {JSON.stringify(flag.details, null, 0).slice(0, 200)}
                  </div>
                )}
              </div>

              <div className="text-right shrink-0">
                <div className="text-xs text-ink/30 mb-2">
                  {new Date(flag.createdAt).toLocaleDateString()}
                </div>
                {!flag.resolvedAt && (
                  <button
                    onClick={() => resolveFlag(flag.id)}
                    className="text-xs px-3 py-1.5 bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
                  >
                    Resolve
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
