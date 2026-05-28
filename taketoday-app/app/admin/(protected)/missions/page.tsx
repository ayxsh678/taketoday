"use client";

import { useState, useEffect, useTransition } from "react";
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
  _count: { participants: number; contributions: number };
}

const MISSION_TYPES = [
  "FACT_CHECK_CAMPAIGN","REGIONAL_COVERAGE","CRISIS_COVERAGE",
  "ELECTION_MONITORING","INVESTIGATION_SPRINT","TRANSLATION_DRIVE",
  "MODERATION_PUSH","EVIDENCE_COLLECTION",
];

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-800",
  UPCOMING: "bg-blue-100 text-blue-800",
  COMPLETED: "bg-gray-100 text-gray-700",
  CANCELLED: "bg-red-100 text-red-700",
};

export default function AdminMissionsPage() {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [isPending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: "", description: "", type: "FACT_CHECK_CAMPAIGN",
    targetCount: "20", endsAt: "", region: "", topic: "", rewardPoints: "0",
  });

  useEffect(() => {
    startTransition(async () => {
      const res = await fetch("/api/admin/missions");
      const data = await res.json() as { missions?: Mission[] };
      setMissions(data.missions ?? []);
    });
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/admin/missions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        targetCount: Number(form.targetCount),
        rewardPoints: Number(form.rewardPoints),
        region: form.region || undefined,
        topic: form.topic || undefined,
      }),
    });
    if (res.ok) {
      const data = await res.json() as { mission: Mission };
      setMissions((prev) => [data.mission, ...prev]);
      setShowForm(false);
      setForm({ title: "", description: "", type: "FACT_CHECK_CAMPAIGN", targetCount: "20", endsAt: "", region: "", topic: "", rewardPoints: "0" });
    }
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Missions</h1>
          <p className="text-sm text-ink/50 mt-1">Create and manage civic journalism missions</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-ink text-paper rounded-lg text-sm font-medium hover:bg-ink/90 transition-colors"
        >
          {showForm ? "Cancel" : "+ New Mission"}
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <form onSubmit={handleCreate} className="border border-ink/15 rounded-xl p-6 mb-8 bg-paper space-y-4">
          <h2 className="font-medium text-ink text-base mb-4">Create Mission</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-xs text-ink/50 mb-1 block">Title *</label>
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required
                className="w-full border border-ink/20 rounded-lg px-3 py-2 text-sm text-ink bg-paper focus:outline-none focus:border-ink/40" />
            </div>
            <div className="col-span-2">
              <label className="text-xs text-ink/50 mb-1 block">Description *</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required rows={2}
                className="w-full border border-ink/20 rounded-lg px-3 py-2 text-sm text-ink bg-paper focus:outline-none focus:border-ink/40" />
            </div>
            <div>
              <label className="text-xs text-ink/50 mb-1 block">Type *</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full border border-ink/20 rounded-lg px-3 py-2 text-sm text-ink bg-paper focus:outline-none">
                {MISSION_TYPES.map((t) => <option key={t} value={t}>{t.replace(/_/g, " ")}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-ink/50 mb-1 block">Target Count *</label>
              <input type="number" min={1} value={form.targetCount} onChange={(e) => setForm({ ...form, targetCount: e.target.value })} required
                className="w-full border border-ink/20 rounded-lg px-3 py-2 text-sm text-ink bg-paper focus:outline-none" />
            </div>
            <div>
              <label className="text-xs text-ink/50 mb-1 block">Ends At *</label>
              <input type="datetime-local" value={form.endsAt} onChange={(e) => setForm({ ...form, endsAt: e.target.value })} required
                className="w-full border border-ink/20 rounded-lg px-3 py-2 text-sm text-ink bg-paper focus:outline-none" />
            </div>
            <div>
              <label className="text-xs text-ink/50 mb-1 block">Reward Points</label>
              <input type="number" min={0} value={form.rewardPoints} onChange={(e) => setForm({ ...form, rewardPoints: e.target.value })}
                className="w-full border border-ink/20 rounded-lg px-3 py-2 text-sm text-ink bg-paper focus:outline-none" />
            </div>
            <div>
              <label className="text-xs text-ink/50 mb-1 block">Region (optional)</label>
              <input value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} placeholder="e.g. South Asia"
                className="w-full border border-ink/20 rounded-lg px-3 py-2 text-sm text-ink bg-paper focus:outline-none" />
            </div>
            <div>
              <label className="text-xs text-ink/50 mb-1 block">Topic tag (optional)</label>
              <input value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} placeholder="e.g. climate"
                className="w-full border border-ink/20 rounded-lg px-3 py-2 text-sm text-ink bg-paper focus:outline-none" />
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <button type="submit" className="px-5 py-2 bg-ink text-paper rounded-lg text-sm font-medium hover:bg-ink/90">
              Create Mission
            </button>
          </div>
        </form>
      )}

      {/* Missions list */}
      {isPending && <div className="text-sm text-ink/40">Loading…</div>}

      <div className="space-y-3">
        {missions.map((m) => {
          const pct = m.targetCount > 0 ? Math.round((m.currentCount / m.targetCount) * 100) : 0;
          return (
            <div key={m.id} className="border border-ink/10 rounded-xl p-4">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="font-medium text-ink">{m.title}</h3>
                    <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-mono", STATUS_COLORS[m.status] ?? "bg-gray-100 text-gray-700")}>
                      {m.status}
                    </span>
                  </div>
                  <p className="text-sm text-ink/50 line-clamp-1">{m.description}</p>
                </div>
                <div className="text-right text-xs text-ink/40 shrink-0">
                  <div>{m._count.participants} contributors</div>
                  <div>{new Date(m.endsAt).toLocaleDateString()}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-1.5 rounded-full bg-ink/8 overflow-hidden">
                  <div className="h-full rounded-full bg-ink/50" style={{ width: `${pct}%` }} />
                </div>
                <span className="text-xs text-ink/40 font-mono shrink-0">{m.currentCount}/{m.targetCount}</span>
              </div>
            </div>
          );
        })}
        {!isPending && missions.length === 0 && (
          <div className="text-center py-16 text-ink/30 text-sm">No missions yet. Create one above.</div>
        )}
      </div>
    </div>
  );
}
