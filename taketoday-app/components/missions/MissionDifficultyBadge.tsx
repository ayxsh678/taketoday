import { MissionDifficulty } from "@prisma/client";
import { cn } from "@/lib/utils";
import { POINTS_BY_DIFFICULTY } from "@/lib/missions";

const DIFF_CONFIG: Record<MissionDifficulty, { label: string; className: string }> = {
  EASY: { label: "Easy", className: "text-emerald-600" },
  MEDIUM: { label: "Medium", className: "text-amber-600" },
  HARD: { label: "Hard", className: "text-rose-600" },
};

export function MissionDifficultyBadge({
  difficulty,
  showPoints = false,
  className,
}: {
  difficulty: MissionDifficulty;
  showPoints?: boolean;
  className?: string;
}) {
  const cfg = DIFF_CONFIG[difficulty];
  return (
    <span
      className={cn(
        "font-mono text-[10px] tracking-[0.18em] uppercase font-semibold",
        cfg.className,
        className,
      )}
    >
      {cfg.label}
      {showPoints && ` · ${POINTS_BY_DIFFICULTY[difficulty]} pts`}
    </span>
  );
}
