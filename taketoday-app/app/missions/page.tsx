"use client";

import { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import { MissionCard } from "@/components/contributor/MissionCard";
import { cn } from "@/lib/utils";

interface Mission {
  id: string;
  title: string;
  description: string;
  type: string;
  status: string;
  targetCount: number;
  currentCount: number;
  endsAt: string;
  region: string | null;
  topic: string | null;
  rewardPoints: number;
  _count: { participants: number };
}

const TYPE_FILTERS = [
  { value: "", label: "All Missions" },
  { value: "FACT_CHECK_CAMPAIGN", label: "Fact-Check" },
  { value: "REGIONAL_COVERAGE", label: "Regional" },
  { value: "CRISIS_COVERAGE", label: "Crisis" },
  { value: "ELECTION_MONITORING", label: "Election" },
  { value: "INVESTIGATION_SPRINT", label: "Investigation" },
  { value: "TRANSLATION_DRIVE", label: "Translation" },
];

export default function MissionsPage() {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [filter, setFilter] = useState("");
  const [joinedIds, setJoinedIds] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    startTransition(async () => {
      const url = filter ? `/api/missions?type=${filter}` : "/api/missions";
      const res = await fetch(url);
      const data = await res.json() as { missions?: Mission[] };
      setMissions(data.missions ?? []);
      setLoaded(true);
    });
  }, [filter]);

  async function handleJoin(missionId: string) {
    const res = await fetch(`/api/missions/${missionId}/join`, { method: "POST" });
    if (res.ok) {
      setJoinedIds((prev) => new Set([...prev, missionId]));
    }
  }

  return (
    <div className="min-h-screen bg-paper">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-10">
          <nav className="font-mono text-[10px] tracking-[0.22em] uppercase text-ink/50 mb-6">
            <Link href="/" className="hover:text-ink">Home</Link>
            <span className="mx-2 text-ink/30">/</span>
            <Link href="/contribute" className="hover:text-ink">Contribute</Link>
            <span className="mx-2 text-ink/30">/</span>
            <span className="text-ink">Missions</span>
          </nav>

          <h1 className="font-serif text-[42px] leading-none tracking-tight text-ink mb-3">
            Civic Missions
          </h1>
          <p className="text-[16px] text-ink/60 max-w-lg leading-relaxed">
            Collaborative journalism missions. Contribute, verify, and investigate — together. Your work creates real-world impact.
          </p>
        </div>

        {/* Impact stats */}
        <div className="grid grid-cols-3 gap-4 mb-10">
          {[
            { label: "Active missions", value: missions.length },
            { label: "Total contributors", value: missions.reduce((acc, m) => acc + m._count.participants, 0).toLocaleString() },
            { label: "Contributions filed", value: missions.reduce((acc, m) => acc + m.currentCount, 0).toLocaleString() },
          ].map((s) => (
            <div key={s.label} className="border border-ink/10 rounded-xl p-4 text-center">
              <div className="font-serif text-2xl text-ink">{s.value}</div>
              <div className="text-[11px] text-ink/40 mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Type filter */}
        <div className="flex flex-wrap gap-2 mb-8">
          {TYPE_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-[12px] font-medium border transition-colors",
                filter === f.value
                  ? "bg-ink text-paper border-ink"
                  : "bg-paper text-ink/60 border-ink/15 hover:border-ink/30",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {isPending && (
          <div className="grid gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-44 rounded-xl bg-ink/5 animate-pulse" />
            ))}
          </div>
        )}

        {!isPending && loaded && missions.length === 0 && (
          <div className="py-20 text-center border border-dashed border-ink/15 rounded-xl">
            <p className="text-[15px] text-ink/40 mb-2">No active missions right now.</p>
            <p className="text-[13px] text-ink/30">Check back soon — new missions launch regularly.</p>
          </div>
        )}

        {!isPending && missions.length > 0 && (
          <div className="grid gap-4">
            {missions.map((m) => (
              <MissionCard
                key={m.id}
                mission={m}
                isJoined={joinedIds.has(m.id)}
                onJoin={handleJoin}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
