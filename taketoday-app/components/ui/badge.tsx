import * as React from "react";
import { cn } from "@/lib/utils";

const toneClasses = {
  neutral: "border-white/10 bg-white/[0.06] text-zinc-300",
  green: "border-emerald-400/20 bg-emerald-400/10 text-emerald-200",
  amber: "border-amber-400/20 bg-amber-400/10 text-amber-200",
  red: "border-red-400/20 bg-red-400/10 text-red-200",
  blue: "border-sky-400/20 bg-sky-400/10 text-sky-200",
  violet: "border-violet-400/20 bg-violet-400/10 text-violet-200",
};

export function Badge({
  className,
  tone = "neutral",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: keyof typeof toneClasses }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-1 text-xs font-medium",
        toneClasses[tone],
        className,
      )}
      {...props}
    />
  );
}
