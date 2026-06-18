import { cn } from "@/lib/utils";
import { getContributorLevel } from "@/lib/missions";

const LEVEL_COLORS: Record<string, string> = {
  Researcher: "text-zinc-600 border-zinc-200",
  Contributor: "text-blue-600 border-blue-200",
  Investigator: "text-purple-700 border-purple-200",
  "Lead Investigator": "text-amber-700 border-amber-300",
};

export function ContributorBadge({
  points,
  className,
}: {
  points: number;
  className?: string;
}) {
  const level = getContributorLevel(points);
  const colorClass = LEVEL_COLORS[level.label] ?? "text-zinc-600 border-zinc-200";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 font-mono text-[10px] tracking-[0.15em] uppercase",
        colorClass,
        className,
      )}
    >
      {level.label}
    </span>
  );
}
