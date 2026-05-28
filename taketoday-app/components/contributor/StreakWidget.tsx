"use client";

import { cn } from "@/lib/utils";

const STREAK_LABELS: Record<string, string> = {
  DAILY_CONTRIBUTION:    "Daily Reporting",
  WEEKLY_PUBLISHING:     "Weekly Publish",
  FACT_CHECKING:         "Fact Checking",
  EVIDENCE_UPLOAD:       "Evidence Upload",
  SOURCE_VERIFICATION:   "Source Verify",
  RESEARCH_COLLABORATION:"Research Collab",
  TRANSLATION:           "Translation",
  COMMUNITY_MODERATION:  "Moderation",
};

const STREAK_ICONS: Record<string, string> = {
  DAILY_CONTRIBUTION:    "🔥",
  WEEKLY_PUBLISHING:     "📰",
  FACT_CHECKING:         "🎯",
  EVIDENCE_UPLOAD:       "🗂️",
  SOURCE_VERIFICATION:   "🔗",
  RESEARCH_COLLABORATION:"🔬",
  TRANSLATION:           "🌐",
  COMMUNITY_MODERATION:  "🤝",
};

const MILESTONES = [7, 14, 30, 60, 90, 180, 365];

interface Streak {
  id: string;
  activityType: string;
  currentStreak: number;
  longestStreak: number;
  lastActivityAt: string | null;
  freezesLeft: number;
  milestoneHits: number[];
}

interface StreakWidgetProps {
  streaks: Streak[];
  compact?: boolean;
  className?: string;
}

export function StreakWidget({ streaks, compact = false, className }: StreakWidgetProps) {
  if (compact) {
    const best = streaks.sort((a, b) => b.currentStreak - a.currentStreak).slice(0, 3);
    return (
      <div className={cn("flex gap-3", className)}>
        {best.map((s) => (
          <div key={s.id} className="flex items-center gap-1.5 text-sm">
            <span>{STREAK_ICONS[s.activityType] ?? "⚡"}</span>
            <span className="font-semibold text-ink">{s.currentStreak}</span>
            <span className="text-ink/40 text-xs">day{s.currentStreak !== 1 ? "s" : ""}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={cn("grid grid-cols-1 sm:grid-cols-2 gap-3", className)}>
      {streaks.map((s) => {
        const nextMilestone = MILESTONES.find((m) => m > s.currentStreak);
        const pct = nextMilestone ? (s.currentStreak / nextMilestone) * 100 : 100;
        const isActive = s.lastActivityAt
          ? Date.now() - new Date(s.lastActivityAt).getTime() < 30 * 60 * 60 * 1000
          : false;

        return (
          <div
            key={s.id}
            className={cn(
              "border rounded-xl p-4 bg-paper",
              isActive ? "border-orange-200 bg-orange-50/30" : "border-ink/10",
            )}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xl">{STREAK_ICONS[s.activityType] ?? "⚡"}</span>
                <div>
                  <div className="text-sm font-medium text-ink">{STREAK_LABELS[s.activityType] ?? s.activityType}</div>
                  {s.freezesLeft > 0 && (
                    <div className="text-[10px] text-blue-600">❄️ {s.freezesLeft} freeze{s.freezesLeft !== 1 ? "s" : ""}</div>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-ink leading-none">{s.currentStreak}</div>
                <div className="text-[10px] text-ink/40">current</div>
              </div>
            </div>

            {/* Progress to next milestone */}
            {nextMilestone && (
              <div className="mb-2">
                <div className="flex justify-between text-[10px] text-ink/40 mb-1">
                  <span>Next: {nextMilestone} days</span>
                  <span>{s.currentStreak}/{nextMilestone}</span>
                </div>
                <div className="h-1.5 rounded-full bg-ink/10 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-orange-400 transition-all"
                    style={{ width: `${Math.min(100, pct)}%` }}
                  />
                </div>
              </div>
            )}

            <div className="flex items-center justify-between text-[10px] text-ink/40">
              <span>Best: {s.longestStreak} days</span>
              {s.milestoneHits.length > 0 && (
                <span>🏆 {s.milestoneHits.length} milestone{s.milestoneHits.length !== 1 ? "s" : ""}</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
