"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, Command, Search, ShieldCheck, Menu } from "lucide-react";
import { adminNav, quickActions } from "@/lib/admin/modules";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAdminStore } from "@/components/admin/admin-store";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import type { AdminRole } from "@/lib/admin/types";
import { useState, useRef, useEffect, useMemo, type ComponentType, type ReactNode } from "react";

export function AdminShell({
  children,
  role,
  name,
}: {
  children: ReactNode;
  role: AdminRole;
  name: string;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const pathname = usePathname();
  const router = useRouter();

  const isActive = (href: string) => pathname.startsWith(href);

  const handleSidebarToggle = () => setSidebarOpen(!sidebarOpen);

  return (
    <div className="flex h-screen bg-zinc-950">
      <aside
        className={cn(
          "w-64 bg-zinc-950/50 backdrop-blur-smd border-r border-white/10 flex-shrink-0",
          sidebarOpen ? "" : "-translate-x-full",
          "transition-transform duration-300"
        )}
      >
        <div className="flex h-16 items-center justify-between gap-4 px-4">
          <button onClick={handleSidebarToggle} className="p-1 rounded-md hover:bg-white/[0.08]">
            <Menu className="h-4 w-4" />
          </button>
          <Link href="/" className="flex items-center gap-3">
            <Command className="h-5 w-5" />
            <h1 className="text-white font-bold text-xl">TakeToday</h1>
          </Link>
        </div>
        <nav className="mt-6 space-y-2 px-4">
          {adminNav.map((nav) => (
            <Link
              key={nav.href}
              href={nav.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium",
                isActive(nav.href)
                  ? "bg-white/[0.08] text-white"
                  : "text-zinc-300 hover:text-white"
              )}
            >
               <nav.icon className={cn("h-4 w-4")} />
              <span>{nav.label}</span>
            </Link>
          ))}
        </nav>
        <div className="mt-auto px-4 border-t border-white/10">
          <div className="space-y-2 px-4 pt-4">
            {quickActions.map((action) => (
              <Button
                key={action}
                variant="secondary"
                className="w-full"
              >
                {action}
              </Button>
            ))}
          </div>
        </div>
      </aside>

      <div className={cn(
        "lg:pl-72",
        sidebarOpen ? "lg:pl-0" : "",
        "transition-all duration-300"
      )}>
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
              <div className="relative">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-9 w-9 px-0" aria-label="Notifications">
                        <Bell className="h-4 w-4" />
                        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-zinc-50 text-xs">
                          2
                        </span>
                      </Button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuItem onClick={() => {/* Mark all as read */}}>
                        Mark all as read
                      </DropdownMenuItem>

                      <DropdownMenuItem onClick={() => {/* Go to notifications page */}}>
                        View all notifications
                      </DropdownMenuItem>

                      <DropdownMenuItem className="border-t pt-2">
                        <span className="text-xs text-zinc-500">2 new</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
            </div>
            <div className="h-9 rounded-md border border-white/10 bg-white/[0.06] px-3 py-1.5 text-sm">
              <span className="text-zinc-400">Signed in as </span>
              <span className="font-medium text-white">{name}</span>
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
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search records, jump to module, or run action..."
                className="h-10 w-full bg-transparent px-2 text-sm text-white outline-none placeholder:text-zinc-500"
              />
            </div>
            <div className="space-y-4 p-6">
              <h2 className="text-white font-bold text-xl">Search</h2>
              <div className="space-y-2">
                <input
                  placeholder="Type to search..."
                  className="h-10 w-full bg-transparent px-2 text-sm text-white outline-none placeholder:text-zinc-500"
                />
              </div>
              <div className="space-y-2">
                <h3 className="text-zinc-400 font-medium text-sm">Modules</h3>
                <div className="space-y-1">
                  {adminNav.map((nav) => (
                    <Link
                      key={nav.href}
                      href={nav.href}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium",
                        isActive(nav.href)
                          ? "bg-white/[0.08] text-white"
                          : "text-zinc-300 hover:text-white"
                      )}
                    >
              <nav.icon className={cn("h-4 w-4")} />
                      <span>{nav.label}</span>
                    </Link>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-zinc-400 font-medium text-sm">Quick Actions</h3>
                <div className="space-y-1">
                  {quickActions.map((action) => (
                    <Button
                      key={action}
                      variant="secondary"
                      className="w-full"
                    >
                      {action}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}