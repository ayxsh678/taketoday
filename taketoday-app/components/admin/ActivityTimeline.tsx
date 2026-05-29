import { Badge } from "@/components/ui/badge";
import type { ActivityEvent } from "@/lib/admin/types";

const toneBySeverity = {
  info: "blue",
  success: "green",
  warning: "amber",
  danger: "red",
} as const;

const dotColorBySeverity: Record<keyof typeof toneBySeverity, string> = {
  info:    "var(--adm-accent-blue)",
  success: "var(--adm-accent-green)",
  warning: "var(--adm-accent-amber)",
  danger:  "var(--adm-accent-red)",
};

export function ActivityTimeline({ events }: { events: readonly ActivityEvent[] }) {
  return (
    <div className="space-y-4">
      {events.map((event) => (
        <div key={event.id} className="grid grid-cols-[auto_1fr] gap-3">
          <div
            className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ background: dotColorBySeverity[event.severity] }}
          />
          <div>
            <p className="text-sm" style={{ color: "var(--adm-text-2)" }}>
              <span className="font-medium" style={{ color: "var(--adm-text-1)" }}>
                {event.actor}
              </span>{" "}
              {event.action}{" "}
              <span style={{ color: "var(--adm-text-1)" }}>{event.target}</span>
            </p>
            <div className="mt-2 flex items-center gap-2">
              <Badge tone={toneBySeverity[event.severity]}>{event.severity}</Badge>
              <span className="text-xs" style={{ color: "var(--adm-text-3)" }}>
                {event.at}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
