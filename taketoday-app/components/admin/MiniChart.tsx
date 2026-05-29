import type { MetricPoint } from "@/lib/admin/types";
import { cn } from "@/lib/utils";

export function MiniChart({ data, className = "" }: { data: readonly MetricPoint[]; className?: string }) {
  const max = Math.max(...data.map((point) => point.value), 1);

  return (
    <div className={cn("flex h-56 items-end gap-2", className)}>
      {data.map((point, i) => {
        const heightPct = Math.max(8, (point.value / max) * 100);
        const isLast = i === data.length - 1;
        return (
          <div key={point.label} className="flex flex-1 flex-col items-center gap-2">
            <div
              className="flex h-44 w-full items-end rounded-lg p-1"
              style={{ background: "var(--adm-surface-2)" }}
            >
              <div
                className="w-full rounded-md transition-all duration-500"
                style={{
                  height: `${heightPct}%`,
                  background: isLast
                    ? "var(--adm-accent-blue)"
                    : `color-mix(in srgb, var(--adm-accent-blue) 55%, var(--adm-surface-3))`,
                  opacity: 0.85 + 0.15 * (i / (data.length - 1)),
                }}
              />
            </div>
            <span className="text-[11px]" style={{ color: "var(--adm-text-3)" }}>
              {point.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
