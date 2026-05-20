import { Badge } from "@/components/ui/badge";
import type { ActivityEvent } from "@/lib/admin/types";

const toneBySeverity = {
  info: "blue",
  success: "green",
  warning: "amber",
  danger: "red",
} as const;

export function ActivityTimeline({ events }: { events: readonly ActivityEvent[] }) {
  return (
    <div className="space-y-4">
      {events.map((event) => (
        <div key={event.id} className="grid grid-cols-[auto_1fr] gap-3">
          <div className="mt-1 h-2.5 w-2.5 rounded-full bg-white" />
          <div>
            <p className="text-sm text-zinc-300">
              <span className="font-medium text-white">{event.actor}</span> {event.action}{" "}
              <span className="text-white">{event.target}</span>
            </p>
            <div className="mt-2 flex items-center gap-2">
              <Badge tone={toneBySeverity[event.severity]}>{event.severity}</Badge>
              <span className="text-xs text-zinc-500">{event.at}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
