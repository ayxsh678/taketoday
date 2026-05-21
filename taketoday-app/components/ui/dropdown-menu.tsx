import * as React from "react";

import { cn } from "@/lib/utils";

interface DropdownMenuProps {
  children: React.ReactNode;
  className?: string;
}

export function DropdownMenu({
  children,
  className = "",
}: DropdownMenuProps) {
  return (
    <div
      className={cn(
        "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-white p-1 text-zinc-950 shadow-lg",
        className
      )}
    >
      <div className="py-1">{children}</div>
    </div>
  );
}

interface DropdownMenuItemProps {
  className?: string;
  onClick?: () => void;
  children: React.ReactNode;
}

export function DropdownMenuItem({
  className = "",
  onClick,
  children,
}: DropdownMenuItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center rounded-md px-2 py-1.5 text-sm text-zinc-700 hover:bg-zinc-100",
        className
      )}
    >
      {children}
    </button>
  );
}