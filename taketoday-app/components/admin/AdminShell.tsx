"use client";

import Link from "next/link";
import { useEffect, useCallback, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  Bell,
  Command,
  Home,
  LogOut,
  Menu,
  Search,
  ShieldCheck,
  X,
  Zap,
} from "lucide-react";
import { adminNav, quickActions, quickActionRoutes } from "@/lib/admin/modules";
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

// ─── helpers ─────────────────────────────────────────────────────────────────

function formatBadgeCount(n: number): string {
  return n > 99 ? "99+" : String(n);
}

// ─── component ───────────────────────────────────────────────────────────────

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
  const [unreadCount, setUnreadCount] = useState(0);
  const pathname = usePathname();
  const router = useRouter();

  const isActive = (href: string) =>
    href === "/admin" ? pathname === href : pathname.startsWith(href);

  // ─── sign out ──────────────────────────────────────────────────────────────

  const handleSignOut = useCallback(async () => {
    await signOut({ callbackUrl: "/admin/login" });
  }, []);

  // ─── notifications ─────────────────────────────────────────────────────────

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/notifications");
      if (!res.ok) return;
      const json = await res.json();
      setUnreadCount((json.data as { unread: number }).unread ?? 0);
    } catch {
      // non-critical — fail silently
    }
  }, []);

  const markAllRead = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/notifications", { method: "PATCH" });
      if (res.ok) setUnreadCount(0);
    } catch {
      // non-critical
    }
  }, []);

  // Subscribe to SSE stream for real-time notifications; fall back to polling
  useEffect(() => {
    void fetchUnreadCount(); // initial load

    // SSE — increment badge when new notification arrives
    const es = new EventSource("/api/admin/stream");
    es.addEventListener("notification", () => {
      setUnreadCount((prev) => prev + 1);
    });
    es.onerror = () => {
      // SSE failed — close and fall back to polling silently
      es.close();
    };

    // Fallback polling (also catches missed events if SSE was down)
    const interval = setInterval(() => void fetchUnreadCount(), 60_000);

    return () => {
      es.close();
      clearInterval(interval);
    };
  }, [fetchUnreadCount]);

  // ─── command palette keyboard shortcuts ────────────────────────────────────

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCommandOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setCommandOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Clear search when palette closes
  useEffect(() => {
    if (!commandOpen) setSearchQuery("");
  }, [commandOpen]);

  // ─── command palette filtering ─────────────────────────────────────────────

  const q = searchQuery.toLowerCase();
  const filteredNav = q
    ? adminNav.filter(
        (n) =>
          n.label.toLowerCase().includes(q) ||
          n.description.toLowerCase().includes(q),
      )
    : adminNav;

  const filteredActions = q
    ? quickActions.filter((a) => a.toLowerCase().includes(q))
    : quickActions;

  const noResults = q && filteredNav.length === 0 && filteredActions.length === 0;

  // ─── quick action handler ──────────────────────────────────────────────────

  const runQuickAction = (action: (typeof quickActions)[number]) => {
    setCommandOpen(false);
    router.push(quickActionRoutes[action]);
  };

  // ─── render ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#08090b] text-zinc-100">
      {/* mobile overlay */}
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close navigation overlay"
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── sidebar ── */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-white/10 bg-[#0b0c10]/95 shadow-2xl shadow-black/30 backdrop-blur-xl transition-transform duration-200 lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* logo */}
        <div className="flex h-16 items-center justify-between gap-4 px-4">
          <Link
            href="/admin"
            className="flex items-center gap-3"
            onClick={() => setSidebarOpen(false)}
          >
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

        {/* nav */}
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
                  : "text-zinc-400 hover:bg-white/[0.06] hover:text-white",
              )}
            >
              <nav.icon className="h-4 w-4 shrink-0" />
              <span className="min-w-0 flex-1 truncate">{nav.label}</span>
            </Link>
          ))}
        </nav>

        {/* user footer */}
        <div className="border-t border-white/10 p-4">
          <div className="rounded-lg border border-white/10 bg-white/[0.04] p-3">
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Signed in</p>
            <p className="mt-1 truncate text-sm font-medium text-white">{name}</p>
            <div className="mt-3 flex items-center justify-between gap-2">
              <Badge tone="green" className="min-w-0 truncate">
                <ShieldCheck className="mr-1 h-3 w-3" />
                {role}
              </Badge>
              <div className="flex items-center gap-1">
                <Link
                  href="/"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md text-zinc-400 hover:bg-white/[0.07] hover:text-white"
                  aria-label="Open public site"
                >
                  <Home className="h-4 w-4" />
                </Link>
                <button
                  type="button"
                  onClick={() => void handleSignOut()}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md text-zinc-400 hover:bg-white/[0.07] hover:text-red-400"
                  aria-label="Sign out"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* ── main content ── */}
      <div className="min-h-screen lg:pl-72">
        {/* header */}
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

            {/* command palette trigger */}
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

              {/* notification bell */}
              <div className="relative">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-9 w-9 px-0" aria-label="Notifications">
                      <Bell className="h-4 w-4" />
                      {unreadCount > 0 && (
                        <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-0.5 text-[10px] font-medium text-white">
                          {formatBadgeCount(unreadCount)}
                        </span>
                      )}
                    </Button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent align="end" className="w-56">
                    {unreadCount > 0 && (
                      <DropdownMenuItem onClick={() => void markAllRead()}>
                        Mark all as read
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem asChild>
                      <Link href="/admin/notifications">View all notifications</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="pointer-events-none border-t pt-2">
                      <span className="text-xs text-zinc-500">
                        {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
                      </span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* signed-in name */}
            <div className="hidden h-9 items-center rounded-md border border-white/10 bg-white/[0.05] px-3 text-sm sm:flex">
              <span className="text-zinc-400">Signed in as&nbsp;</span>
              <span className="font-medium text-white">{name}</span>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>

      {/* ── command palette ── */}
      {commandOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => setCommandOpen(false)}
        >
          <div
            className="mx-auto mt-20 max-w-2xl overflow-hidden rounded-lg border border-white/10 bg-zinc-950 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* search input */}
            <div className="flex items-center gap-3 border-b border-white/10 px-4">
              <Search className="h-4 w-4 shrink-0 text-zinc-500" />
              <input
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search modules or run a quick action…"
                className="h-12 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-zinc-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="text-zinc-500 hover:text-zinc-300"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="max-h-[60vh] overflow-y-auto p-3 space-y-4">
              {noResults ? (
                <p className="px-3 py-6 text-center text-sm text-zinc-500">
                  No results for &ldquo;{searchQuery}&rdquo;
                </p>
              ) : (
                <>
                  {/* modules */}
                  {filteredNav.length > 0 && (
                    <section>
                      <p className="mb-1 px-3 text-[11px] font-medium uppercase tracking-wider text-zinc-600">
                        Modules
                      </p>
                      <div className="space-y-0.5">
                        {filteredNav.map((nav) => (
                          <Link
                            key={nav.href}
                            href={nav.href}
                            onClick={() => setCommandOpen(false)}
                            className={cn(
                              "flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm transition",
                              isActive(nav.href)
                                ? "bg-white/[0.08] text-white"
                                : "text-zinc-300 hover:bg-white/[0.06] hover:text-white",
                            )}
                          >
                            <nav.icon className="h-4 w-4 shrink-0 text-zinc-500" />
                            <span className="flex-1">{nav.label}</span>
                            <span className="text-xs text-zinc-600">{nav.description}</span>
                          </Link>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* quick actions */}
                  {filteredActions.length > 0 && (
                    <section>
                      <p className="mb-1 px-3 text-[11px] font-medium uppercase tracking-wider text-zinc-600">
                        Quick actions
                      </p>
                      <div className="space-y-0.5">
                        {filteredActions.map((action) => (
                          <button
                            key={action}
                            type="button"
                            className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm text-zinc-300 transition hover:bg-white/[0.06] hover:text-white"
                            onClick={() => runQuickAction(action)}
                          >
                            <Zap className="h-4 w-4 shrink-0 text-zinc-500" />
                            {action}
                          </button>
                        ))}
                      </div>
                    </section>
                  )}
                </>
              )}

              {/* sign out — always visible at bottom */}
              <div className="border-t border-white/10 pt-2">
                <button
                  type="button"
                  onClick={() => void handleSignOut()}
                  className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm text-zinc-400 transition hover:bg-white/[0.06] hover:text-red-400"
                >
                  <LogOut className="h-4 w-4 shrink-0" />
                  Sign out
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
