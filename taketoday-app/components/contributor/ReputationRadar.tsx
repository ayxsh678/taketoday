"use client";

import { cn } from "@/lib/utils";

interface RepDimensions {
  reportingScore: number;
  factCheckScore: number;
  researchScore: number;
  moderationScore: number;
  accuracyScore: number;
  sourceScore: number;
  collaborationScore: number;
  communityScore: number;
  overallScore: number;
}

const DIM_CAPS: Record<string, number> = {
  reportingScore: 1000,
  factCheckScore: 800,
  researchScore: 700,
  moderationScore: 500,
  accuracyScore: 600,
  sourceScore: 400,
  collaborationScore: 300,
  communityScore: 400,
};

const DIM_LABELS: Record<string, string> = {
  reportingScore:    "Reporting",
  factCheckScore:    "Fact Check",
  researchScore:     "Research",
  moderationScore:   "Moderation",
  accuracyScore:     "Accuracy",
  sourceScore:       "Sources",
  collaborationScore:"Collaboration",
  communityScore:    "Community",
};

const DIM_ICONS: Record<string, string> = {
  reportingScore:    "📡",
  factCheckScore:    "🎯",
  researchScore:     "🔬",
  moderationScore:   "🤝",
  accuracyScore:     "✅",
  sourceScore:       "🔗",
  collaborationScore:"👥",
  communityScore:    "🌐",
};

interface ReputationRadarProps {
  dimensions: RepDimensions;
  className?: string;
}

export function ReputationRadar({ dimensions, className }: ReputationRadarProps) {
  const dims = Object.keys(DIM_LABELS) as (keyof RepDimensions)[];

  return (
    <div className={cn("space-y-3", className)}>
      {dims.map((dim) => {
        const raw = dimensions[dim] as number;
        const cap = DIM_CAPS[dim as string] ?? 100;
        const pct = Math.min(100, (raw / cap) * 100);
        const color =
          pct >= 70 ? "bg-green-500" :
          pct >= 40 ? "bg-blue-500" :
          pct >= 15 ? "bg-orange-400" :
          "bg-gray-300";

        return (
          <div key={dim} className="flex items-center gap-3">
            <span className="w-5 text-base shrink-0">{DIM_ICONS[dim as string]}</span>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-ink/60">{DIM_LABELS[dim as string]}</span>
                <span className="font-mono text-ink/40">{Math.round(raw)}</span>
              </div>
              <div className="h-1.5 rounded-full bg-ink/8 overflow-hidden">
                <div
                  className={cn("h-full rounded-full transition-all duration-500", color)}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          </div>
        );
      })}

      <div className="flex items-center justify-between pt-2 border-t border-ink/8">
        <span className="text-xs font-medium text-ink/60">Overall Trust Score</span>
        <span className="text-xl font-bold text-ink">{dimensions.overallScore.toFixed(1)}</span>
      </div>
    </div>
  );
}
