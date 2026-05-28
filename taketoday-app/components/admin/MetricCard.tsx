import { ArrowDownRight, ArrowUpRight, type LucideIcon } from "lucide-react";

type Accent = "blue" | "purple" | "green" | "amber" | "red" | "ai";

const ACCENT_ICON_COLOR: Record<Accent, string> = {
  blue:   "var(--adm-accent-blue)",
  purple: "var(--adm-accent-purple)",
  green:  "var(--adm-accent-green)",
  amber:  "var(--adm-accent-amber)",
  red:    "var(--adm-accent-red)",
  ai:     "var(--adm-accent-ai)",
};

const DELTA_COLOR = {
  positive: "var(--adm-accent-green)",
  negative: "var(--adm-accent-red)",
  neutral:  "var(--adm-text-3)",
};

function parseDelta(delta: string) {
  if (delta === "—" || delta === "0%") return { dir: "neutral" as const };
  if (delta.startsWith("-")) return { dir: "negative" as const };
  return { dir: "positive" as const };
}

export function MetricCard({
  label,
  value,
  delta,
  icon: Icon,
  accent = "blue",
}: {
  label: string;
  value: string;
  delta: string;
  icon: LucideIcon;
  accent?: Accent;
}) {
  const { dir } = parseDelta(delta);
  const deltaColor = DELTA_COLOR[dir];
  const iconColor = ACCENT_ICON_COLOR[accent];

  return (
    <div className={`adm-card metric-accent-${accent} rounded-xl p-4`}>
      <div className="flex items-start justify-between">
        <span
          className="flex h-9 w-9 items-center justify-center rounded-lg"
          style={{
            background: `color-mix(in srgb, ${iconColor} 12%, transparent)`,
            border: `1px solid color-mix(in srgb, ${iconColor} 22%, transparent)`,
          }}
        >
          <Icon className="h-4 w-4" style={{ color: iconColor }} />
        </span>

        <span
          className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold"
          style={{
            background: `color-mix(in srgb, ${deltaColor} 10%, transparent)`,
            color: deltaColor,
          }}
        >
          {dir === "positive" && <ArrowUpRight className="h-3 w-3" />}
          {dir === "negative" && <ArrowDownRight className="h-3 w-3" />}
          {delta}
        </span>
      </div>

      <p
        className="mt-5 text-2xl font-semibold tracking-tight"
        style={{ color: "var(--adm-text-1)" }}
      >
        {value}
      </p>
      <p className="mt-1 text-sm" style={{ color: "var(--adm-text-2)" }}>
        {label}
      </p>
    </div>
  );
}
