import { ArrowUpRight, type LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function MetricCard({
  label,
  value,
  delta,
  icon: Icon,
}: {
  label: string;
  value: string;
  delta: string;
  icon: LucideIcon;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="grid h-9 w-9 place-items-center rounded-md border border-white/10 bg-white/[0.06]">
            <Icon className="h-4 w-4 text-zinc-300" />
          </div>
          <Badge tone="green">
            <ArrowUpRight className="mr-1 h-3 w-3" />
            {delta}
          </Badge>
        </div>
        <p className="mt-5 text-2xl font-semibold tracking-tight text-white">{value}</p>
        <p className="mt-1 text-sm text-zinc-400">{label}</p>
      </CardContent>
    </Card>
  );
}
