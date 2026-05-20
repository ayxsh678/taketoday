"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Command, Search, ShieldCheck } from "lucide-react";
import { adminNav } from "@/lib/admin/modules";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAdminStore } from "@/components/admin/admin-store";
import type { AdminRole } from "@/lib/admin/types";

export function AdminShell({
  children,
  role,
  name,
}: {
  children: React.ReactNode;
  role: AdminRole;
  name: string;
}) {
  const pathname = usePathname();
  const { commandOpen, setCommandOpen } = useAdminStore();

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 border-r border-white/10 bg-zinc-950/95 px-4 py-5 lg:block">
        <Link href="/admin" className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-md bg-white text-sm font-bold text-zinc-950">TT</div>
          <div>
            <p className="text-sm font-semibold text-white">TakeToday Admin</p>
            <p className="text-xs text-zinc-500">Editorial operating system</p>
          </div>
        </Link>

        <nav className="mt-8 space-y-1">
          {adminNav.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors",
                  active ? "bg-white text-zinc-950" : "text-zinc-400 hover:bg-white/[0.07] hover:text-white",
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-20 border-b border-white/10 bg-zinc-950/80 backdrop-blur-xl">
          <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
            <button
              type="button"
              onClick={() => setCommandOpen(true)}
              className="hidden h-9 min-w-80 items-center gap-3 rounded-md border border-white/10 bg-white/[0.05] px-3 text-sm text-zinc-500 transition hover:border-white/20 hover:text-zinc-300 md:flex"
            >
              <Search className="h-4 w-4" />
              Search, jump to module, or run action
              <span className="ml-auto inline-flex items-center gap-1 rounded border border-white/10 px-1.5 py-0.5 text-[11px] text-zinc-500">
                <Command className="h-3 w-3" /> K
              </span>
            </button>
            <div className="flex items-center gap-3">
              <Badge tone="green" className="hidden sm:inline-flex">
                <ShieldCheck className="mr-1 h-3 w-3" />
                {role}
              </Badge>
              <Button variant="ghost" className="h-9 w-9 px-0" aria-label="Notifications">
                <Bell className="h-4 w-4" />
              </Button>
              <div className="h-9 rounded-md border border-white/10 bg-white/[0.06] px-3 py-1.5 text-sm">
                <span className="text-zinc-400">Signed in as </span>
                <span className="font-medium text-white">{name}</span>
              </div>
            </div>
          </div>
        </header>

        <main className="px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>

      {commandOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 p-4 backdrop-blur-sm" onClick={() => setCommandOpen(false)}>
          <div
            className="mx-auto mt-20 max-w-2xl rounded-lg border border-white/10 bg-zinc-950 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="border-b border-white/10 p-3">
              <input
                autoFocus
                className="h-10 w-full bg-transparent px-2 text-sm text-white outline-none placeholder:text-zinc-500"
                placeholder="Run command..."
              />
            </div>
            <div className="grid gap-1 p-2">
              {adminNav.slice(0, 7).map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setCommandOpen(false)}
                  className="rounded-md px-3 py-2 text-sm text-zinc-300 hover:bg-white/[0.07] hover:text-white"
                >
                  {item.label}
                  <span className="ml-2 text-xs text-zinc-500">{item.description}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
