import { MissionStatus } from "@prisma/client";
import { cn } from "@/lib/utils";

const STATUS_CONFIG: Record<MissionStatus, { label: string; className: string }> = {
  OPEN: { label: "Open", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  IN_PROGRESS: { label: "In Progress", className: "bg-amber-50 text-amber-700 border-amber-200" },
  COMPLETED: { label: "Completed", className: "bg-blue-50 text-blue-700 border-blue-200" },
  ARCHIVED: { label: "Archived", className: "bg-zinc-100 text-zinc-500 border-zinc-200" },
};

export function MissionStatusBadge({
  status,
  className,
}: {
  status: MissionStatus;
  className?: string;
}) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 font-mono text-[10px] tracking-[0.18em] uppercase",
        cfg.className,
        className,
      )}
    >
      {cfg.label}
    </span>
  );
}
