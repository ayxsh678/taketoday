"use client";

import Link from "next/link";
import { quickActions, quickActionRoutes } from "@/lib/admin/modules";
import { cn } from "@/lib/utils";

const variants = {
  primary: "bg-white text-zinc-950 shadow-sm hover:bg-zinc-100",
  secondary: "border border-white/10 bg-white/[0.06] text-zinc-100 hover:bg-white/[0.1]",
} as const;

export function DashboardQuickActions() {
  return (
    <div className="flex flex-wrap gap-2">
      {quickActions.slice(0, 4).map((action, index) => (
        <Link
          key={action}
          href={quickActionRoutes[action]}
          className={cn(
            "inline-flex h-9 items-center justify-center gap-2 rounded-md px-3 text-sm font-medium transition-colors",
            index === 0 ? variants.primary : variants.secondary,
          )}
        >
          {action}
        </Link>
      ))}
    </div>
  );
}
