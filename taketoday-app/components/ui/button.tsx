import * as React from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

const variants: Record<ButtonVariant, string> = {
  primary: "bg-white text-zinc-950 shadow-sm hover:bg-zinc-100",
  secondary: "border border-white/10 bg-white/[0.06] text-zinc-100 hover:bg-white/[0.1]",
  ghost: "text-zinc-300 hover:bg-white/[0.07] hover:text-white",
  danger: "bg-red-500 text-white hover:bg-red-400",
};

export function Button({ className, variant = "primary", ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex h-9 items-center justify-center gap-2 rounded-md px-3 text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
