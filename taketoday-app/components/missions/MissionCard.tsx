import Link from "next/link";
import { MissionDifficulty, MissionStatus } from "@prisma/client";
import { MissionStatusBadge } from "./MissionStatusBadge";
import { MissionDifficultyBadge } from "./MissionDifficultyBadge";

export type MissionCardProps = {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: MissionDifficulty;
  pointsReward: number;
  status: MissionStatus;
  deadline?: string | null;
  submissionCount?: number;
};

export function MissionCard({
  id,
  title,
  description,
  category,
  difficulty,
  pointsReward,
  status,
  deadline,
  submissionCount = 0,
}: MissionCardProps) {
  const isActive = status === MissionStatus.OPEN || status === MissionStatus.IN_PROGRESS;

  return (
    <Link
      href={`/missions/${id}`}
      className="group block border border-ink-200/70 p-6 hover:border-ink transition-colors"
    >
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-2 flex-wrap">
          <MissionStatusBadge status={status} />
          <MissionDifficultyBadge difficulty={difficulty} />
        </div>
        <span className="font-mono text-[11px] text-ink-400 shrink-0">
          +{pointsReward} pts
        </span>
      </div>

      <p className="font-mono text-[9px] tracking-[0.22em] uppercase text-ink-400 mb-2">
        {category}
      </p>

      <h3 className="font-serif text-[20px] leading-snug text-ink group-hover:text-ink-700 transition-colors mb-2 line-clamp-2">
        {title}
      </h3>

      <p className="text-[13px] leading-relaxed text-ink-500 line-clamp-3 mb-4">
        {description}
      </p>

      <div className="flex items-center justify-between text-[11px] font-mono text-ink-400">
        <span>{submissionCount} submission{submissionCount !== 1 ? "s" : ""}</span>
        {deadline && (
          <span>
            Due{" "}
            {new Date(deadline).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </span>
        )}
        {isActive && (
          <span className="text-ink group-hover:text-ink-700 transition-colors">
            Submit →
          </span>
        )}
      </div>
    </Link>
  );
}
