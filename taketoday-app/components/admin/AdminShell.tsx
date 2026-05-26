"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, Command, Home, LogOut, Menu, Search, ShieldCheck, X } from "lucide-react";
import { adminNav, quickActions } from "@/lib/admin/modules";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import type { AdminRole } from "@/lib/admin/types";
import { useState, type ReactNode } from "react";

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

  const isActive = (href: string) => (href === "/admin" ? pathname === href : pathname.startsWith(href));

  return (
    <div className="min-h-screen bg-[#08090b] text-zinc-100">
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close navigation overlay"
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-white/10 bg-[#0b0c10]/95 shadow-2xl shadow-black/30 backdrop-blur-xl transition-transform duration-200 lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 items-center justify-between gap-4 px-4">
          <Link href="/admin" className="flex items-center gap-3" onClick={() => setSidebarOpen(false)}>
            <span className="flex h-9 w-9 items-center justify-center rounded-md border border-white/10 bg-white text-zinc-950">
              <Command className="h-5 w-5" />
            </span>
            <span>
              <span className="block text-sm font-semibold text-white">TakeToday</span>
              <span className="block text-xs text-zinc-500">Admin workspace</span>
            </span>
          </Link>
          <Button
            type="button"
            variant="ghost"
            className="h-8 w-8 px-0 lg:hidden"
            aria-label="Close navigation"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <nav className="mt-4 flex-1 space-y-1 overflow-y-auto px-3 pb-4">
          {adminNav.map((nav) => (
            <Link
              key={nav.href}
              href={nav.href}
              onClick={() => setSidebarOpen(false)}
              className={cn(
                "group flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition",
                isActive(nav.href)
                  ? "bg-white text-zinc-950 shadow-sm"
                  : "text-zinc-400 hover:bg-white/[0.06] hover:text-white"
              )}
            >
              <nav.icon className="h-4 w-4 shrink-0" />
              <span className="min-w-0 flex-1 truncate">{nav.label}</span>
            </Link>
          ))}
        </nav>
        <div className="border-t border-white/10 p-4">
          <div className="rounded-lg border border-white/10 bg-white/[0.04] p-3">
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Signed in</p>
            <p className="mt-1 truncate text-sm font-medium text-white">{name}</p>
            <div className="mt-3 flex items-center justify-between gap-2">
              <Badge tone="green" className="min-w-0 truncate">
                <ShieldCheck className="mr-1 h-3 w-3" />
                {role}
              </Badge>
              <Link href="/" className="inline-flex h-8 w-8 items-center justify-center rounded-md text-zinc-400 hover:bg-white/[0.07] hover:text-white" aria-label="Open public site">
                <Home className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </aside>

      <div className="min-h-screen lg:pl-72">
        <header className="sticky top-0 z-20 border-b border-white/10 bg-[#08090b]/85 backdrop-blur-xl">
          <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
            <Button
              type="button"
              variant="ghost"
              className="h-9 w-9 px-0 lg:hidden"
              aria-label="Open navigation"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-4 w-4" />
            </Button>
            <button
              type="button"
              onClick={() => setCommandOpen(true)}
              className="hidden h-9 min-w-80 items-center gap-3 rounded-md border border-white/10 bg-white/[0.04] px-3 text-sm text-zinc-500 transition hover:border-white/20 hover:bg-white/[0.06] hover:text-zinc-300 md:flex"
            >
              <Search className="h-4 w-4" />
              Search, jump to module, or run action
              <span className="ml-auto inline-flex items-center gap-1 rounded border border-white/10 px-1.5 py-0.5 text-[11px] text-zinc-500">
                <Command className="h-3 w-3" /> K
              </span>
            </button>
            <div className="flex items-center gap-3">
              <Badge tone="green" className="hidden md:inline-flex">
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
                        <Link href="/admin/notifications">View all notifications</Link>
                      </DropdownMenuItem>

                      <DropdownMenuItem className="border-t pt-2">
                        <span className="text-xs text-zinc-500">2 new</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
            </div>
            <div className="hidden h-9 items-center rounded-md border border-white/10 bg-white/[0.05] px-3 text-sm sm:flex">
              <span className="text-zinc-400">Signed in as </span>
              <span className="font-medium text-white">{name}</span>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">{children}</main>
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
                      onClick={() => setCommandOpen(false)}
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
                      onClick={() => {
                        setCommandOpen(false);
                        router.push("/admin/automation");
                      }}
                    >
                      {action}
                    </Button>
                  ))}
                </div>
              </div>
              <button
                type="button"
                className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-zinc-400 hover:bg-white/[0.06] hover:text-white"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
