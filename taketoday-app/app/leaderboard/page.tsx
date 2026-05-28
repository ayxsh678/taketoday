"use client";

import { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

type BoardType = "OVERALL" | "REPORTING" | "FACT_CHECKING" | "INVESTIGATION" | "ACCURACY" | "COMMUNITY" | "RISING";

interface Entry {
  id: string;
  rank: number;
  score: number;
  user: {
    username: string;
    displayName: string;
    avatar: string | null;
    isVerifiedJournalist: boolean;
    reputation: { tier: string } | null;
  };
}

const BOARDS: { type: BoardType; label: string; icon: string; desc: string }[] = [
  { type: "OVERALL",       label: "Overall",      icon: "🏆", desc: "Combined trust score" },
  { type: "REPORTING",     label: "Reporting",    icon: "📡", desc: "Published contributions" },
  { type: "FACT_CHECKING", label: "Fact-Checking",icon: "🎯", desc: "Verification accuracy" },
  { type: "INVESTIGATION", label: "Investigation",icon: "🔬", desc: "Research depth" },
  { type: "ACCURACY",      label: "Accuracy",     icon: "✅", desc: "Editorial precision" },
  { type: "COMMUNITY",     label: "Community",    icon: "🤝", desc: "Community impact" },
  { type: "RISING",        label: "Rising",       icon: "📈", desc: "Most active this week" },
];

const TIER_COLORS: Record<string, string> = {
  NEWCOMER:    "text-gray-500",
  CONTRIBUTOR: "text-blue-600",
  TRUSTED:     "text-green-600",
  VERIFIED:    "text-emerald-600",
  EXPERT:      "text-purple-700",
  STAFF:       "text-orange-600",
};

export default function LeaderboardPage() {
  const [board, setBoard] = useState<BoardType>("OVERALL");
  const [entries, setEntries] = useState<Entry[]>([]);
  const [isPending, startTransition] = useTransition();
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    startTransition(async () => {
      const res = await fetch(`/api/leaderboard?type=${board}&limit=50`);
      const data = await res.json() as { entries?: Entry[] };
      setEntries(data.entries ?? []);
      setLoaded(true);
    });
  }, [board]);

  const top3 = entries.slice(0, 3);

  return (
    <div className="min-h-screen bg-paper">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-10">
          <nav className="font-mono text-[10px] tracking-[0.22em] uppercase text-ink/50 mb-6">
            <Link href="/" className="hover:text-ink">Home</Link>
            <span className="mx-2 text-ink/30">/</span>
            <span className="text-ink">Leaderboard</span>
          </nav>
          <h1 className="font-serif text-[42px] leading-none tracking-tight text-ink mb-2">
            Contributors
          </h1>
          <p className="text-[15px] text-ink/50">
            Ranked by verified impact, accuracy, and community trust — not vanity metrics.
          </p>
        </div>

        {/* Board selector */}
        <div className="flex flex-wrap gap-2 mb-10">
          {BOARDS.map((b) => (
            <button
              key={b.type}
              onClick={() => setBoard(b.type)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors border",
                board === b.type
                  ? "bg-ink text-paper border-ink"
                  : "bg-paper text-ink/70 border-ink/15 hover:border-ink/30 hover:text-ink",
              )}
            >
              <span>{b.icon}</span>
              {b.label}
            </button>
          ))}
        </div>

        {/* Board description */}
        <p className="text-[13px] text-ink/40 mb-8 font-mono">
          {BOARDS.find((b) => b.type === board)?.desc} · Updated in real time
        </p>

        {isPending && (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 rounded-xl bg-ink/5 animate-pulse" />
            ))}
          </div>
        )}

        {!isPending && loaded && entries.length === 0 && (
          <div className="py-16 text-center text-ink/40">
            No data yet — be the first to earn your place.
          </div>
        )}

        {!isPending && loaded && entries.length > 0 && (
          <>
            {/* Podium: top 3 */}
            {top3.length >= 3 && (
              <div className="grid grid-cols-3 gap-3 mb-8">
                {[top3[1], top3[0], top3[2]].map((entry, podiumIdx) => {
                  if (!entry) return null;
                  const heights = ["h-24", "h-32", "h-20"];
                  const medals = ["🥈", "🥇", "🥉"];
                  const textSizes = ["text-base", "text-xl", "text-base"];
                  return (
                    <Link
                      key={entry.id}
                      href={`/profile/${entry.user.username}`}
                      className={cn(
                        "flex flex-col items-center justify-end pb-4 rounded-xl border border-ink/10 hover:border-ink/25 transition-colors bg-paper",
                        heights[podiumIdx],
                      )}
                    >
                      <span className={cn("mb-1", textSizes[podiumIdx])}>{medals[podiumIdx]}</span>
                      <div className="w-8 h-8 rounded-full bg-ink/10 flex items-center justify-center text-sm font-medium overflow-hidden">
                        {entry.user.avatar ? (
                          <Image src={entry.user.avatar} alt="" width={32} height={32} className="w-full h-full object-cover" />
                        ) : (
                          entry.user.displayName[0]
                        )}
                      </div>
                      <div className="text-[11px] font-medium text-ink mt-1 text-center px-2 truncate max-w-full">
                        {entry.user.displayName}
                      </div>
                      <div className="font-mono text-[10px] text-ink/40">{entry.score.toFixed(1)}</div>
                    </Link>
                  );
                })}
              </div>
            )}

            {/* Full rankings */}
            <div className="space-y-2">
              {entries.map((entry) => (
                <Link
                  key={entry.id}
                  href={`/profile/${entry.user.username}`}
                  className="flex items-center gap-4 p-3 rounded-xl border border-ink/8 hover:border-ink/20 hover:bg-ink/2 transition-colors group"
                >
                  <span className={cn(
                    "w-8 text-center font-mono text-sm shrink-0",
                    entry.rank === 1 ? "text-yellow-500 font-bold" :
                    entry.rank === 2 ? "text-gray-400 font-bold" :
                    entry.rank === 3 ? "text-orange-400 font-bold" :
                    "text-ink/30",
                  )}>
                    #{entry.rank}
                  </span>

                  <div className="w-8 h-8 rounded-full bg-ink/10 flex items-center justify-center text-sm font-medium shrink-0 overflow-hidden">
                    {entry.user.avatar ? (
                      <Image src={entry.user.avatar} alt="" width={32} height={32} className="w-full h-full object-cover" />
                    ) : (
                      entry.user.displayName[0]
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[14px] font-medium text-ink group-hover:underline underline-offset-2">
                        {entry.user.displayName}
                      </span>
                      {entry.user.isVerifiedJournalist && (
                        <span className="text-[10px] text-blue-600">✓ Verified</span>
                      )}
                      {entry.user.reputation?.tier && (
                        <span className={cn("text-[10px] font-mono", TIER_COLORS[entry.user.reputation.tier] ?? "text-ink/40")}>
                          {entry.user.reputation.tier}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-ink/40">@{entry.user.username}</div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="font-mono text-[15px] font-semibold text-ink">{entry.score.toFixed(1)}</div>
                    <div className="text-[10px] text-ink/30">score</div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
