"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

const MISSION_ICONS: Record<string, string> = {
  FACT_CHECK_CAMPAIGN:  "🎯",
  REGIONAL_COVERAGE:    "📍",
  CRISIS_COVERAGE:      "🚨",
  ELECTION_MONITORING:  "🗳️",
  INVESTIGATION_SPRINT: "🔍",
  TRANSLATION_DRIVE:    "🌐",
  MODERATION_PUSH:      "🛡️",
  EVIDENCE_COLLECTION:  "🗂️",
};

const MISSION_COLORS: Record<string, string> = {
  FACT_CHECK_CAMPAIGN:  "border-blue-200 bg-blue-50/30",
  REGIONAL_COVERAGE:    "border-green-200 bg-green-50/30",
  CRISIS_COVERAGE:      "border-red-200 bg-red-50/30",
  ELECTION_MONITORING:  "border-purple-200 bg-purple-50/30",
  INVESTIGATION_SPRINT: "border-orange-200 bg-orange-50/30",
  TRANSLATION_DRIVE:    "border-teal-200 bg-teal-50/30",
  MODERATION_PUSH:      "border-gray-200 bg-gray-50/30",
  EVIDENCE_COLLECTION:  "border-yellow-200 bg-yellow-50/30",
};

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

interface MissionCardProps {
  mission: Mission;
  isJoined?: boolean;
  onJoin?: (id: string) => void;
  className?: string;
}

function timeLeft(endsAt: string): string {
  const ms = new Date(endsAt).getTime() - Date.now();
  if (ms <= 0) return "Ended";
  const days = Math.floor(ms / (24 * 60 * 60 * 1000));
  const hours = Math.floor((ms % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  if (days > 0) return `${days}d left`;
  return `${hours}h left`;
}

export function MissionCard({ mission, isJoined, onJoin, className }: MissionCardProps) {
  const pct = Math.min(100, mission.targetCount > 0 ? (mission.currentCount / mission.targetCount) * 100 : 0);
  const colorClass = MISSION_COLORS[mission.type] ?? "border-ink/10 bg-paper";
  const icon = MISSION_ICONS[mission.type] ?? "📋";
  const remaining = timeLeft(mission.endsAt);
  const isUrgent = new Date(mission.endsAt).getTime() - Date.now() < 48 * 60 * 60 * 1000;

  return (
    <div className={cn("rounded-xl border p-5 flex flex-col gap-3", colorClass, className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-2xl shrink-0">{icon}</span>
          <div className="min-w-0">
            <h3 className="font-semibold text-ink text-[15px] leading-snug">{mission.title}</h3>
            <div className="flex gap-2 mt-0.5 flex-wrap">
              {mission.region && (
                <span className="text-[10px] font-mono text-ink/50">📍 {mission.region}</span>
              )}
              {mission.topic && (
                <span className="text-[10px] font-mono text-ink/50">#{mission.topic}</span>
              )}
            </div>
          </div>
        </div>
        <div className={cn("text-[11px] font-mono shrink-0", isUrgent ? "text-red-600 font-semibold" : "text-ink/40")}>
          {remaining}
        </div>
      </div>

      <p className="text-[13px] text-ink/60 leading-relaxed">{mission.description}</p>

      {/* Progress */}
      <div>
        <div className="flex justify-between text-[11px] text-ink/50 mb-1.5">
          <span>{mission.currentCount.toLocaleString()} / {mission.targetCount.toLocaleString()} contributions</span>
          <span>{Math.round(pct)}%</span>
        </div>
        <div className="h-2 rounded-full bg-ink/10 overflow-hidden">
          <div
            className="h-full rounded-full bg-ink/60 transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-3 text-[11px] text-ink/40">
          <span>👥 {mission._count.participants} contributors</span>
          {mission.rewardPoints > 0 && (
            <span>🏅 +{mission.rewardPoints} rep pts</span>
          )}
        </div>
        {onJoin && (
          <button
            onClick={() => onJoin(mission.id)}
            disabled={isJoined}
            className={cn(
              "text-[12px] font-medium px-3 py-1.5 rounded-lg transition-colors",
              isJoined
                ? "bg-ink/10 text-ink/40 cursor-default"
                : "bg-ink text-paper hover:bg-ink/85",
            )}
          >
            {isJoined ? "Joined ✓" : "Join Mission"}
          </button>
        )}
        {!onJoin && (
          <Link
            href={`/missions/${mission.id}`}
            className="text-[12px] font-medium text-ink underline underline-offset-2 hover:text-ink/60"
          >
            View →
          </Link>
        )}
      </div>
    </div>
  );
}
