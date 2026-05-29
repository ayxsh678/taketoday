import * as React from "react";
import { cn } from "@/lib/utils";

export function Card({ className, style, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-xl shadow-sm", className)}
      style={{
        background: "var(--adm-surface-1)",
        border: "1px solid var(--adm-border)",
        ...style,
      }}
      {...props}
    />
  );
}

export function CardHeader({ className, style, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("p-4", className)}
      style={{ borderBottom: "1px solid var(--adm-border-dim)", ...style }}
      {...props}
    />
  );
}

export function CardTitle({ className, style, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn("text-sm font-semibold", className)}
      style={{ color: "var(--adm-text-1)", ...style }}
      {...props}
    />
  );
}

export function CardDescription({ className, style, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn("mt-1 text-sm leading-6", className)}
      style={{ color: "var(--adm-text-2)", ...style }}
      {...props}
    />
  );
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-4", className)} {...props} />;
}
