import type { MetricPoint } from "@/lib/admin/types";

export function MiniChart({ data }: { data: readonly MetricPoint[] }) {
  const max = Math.max(...data.map((point) => point.value), 1);

  return (
    <div className="flex h-56 items-end gap-3">
      {data.map((point) => (
        <div key={point.label} className="flex flex-1 flex-col items-center gap-2">
          <div className="flex h-44 w-full items-end rounded-md bg-white/[0.04] p-1">
            <div
              className="w-full rounded bg-white"
              style={{ height: `${Math.max(8, (point.value / max) * 100)}%` }}
            />
          </div>
          <span className="text-xs text-zinc-500">{point.label}</span>
        </div>
      ))}
    </div>
  );
}
