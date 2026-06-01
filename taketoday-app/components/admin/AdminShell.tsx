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
  Monitor,
  Moon,
  Radio,
  Search,
  ShieldCheck,
  Sun,
  X,
  Zap,
} from "lucide-react";
import { adminNav, quickActions, quickActionRoutes } from "@/lib/admin/modules";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
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

function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

// ─── grouped navigation ───────────────────────────────────────────────────────

const NAV_GROUPS = [
  {
    label: "NEWSROOM",
    accentColor: "#60a5fa",
    hrefs: ["/admin", "/admin/content", "/admin/categories", "/admin/editorial"],
  },
  {
    label: "STUDIO",
    accentColor: "#a78bfa",
    hrefs: ["/admin/ai", "/admin/carousel", "/admin/ingestion", "/admin/media", "/admin/video"],
  },
  {
    label: "DISTRIBUTION",
    accentColor: "#34d399",
    hrefs: ["/admin/social", "/admin/automation"],
  },
  {
    label: "COMMUNITY",
    accentColor: "#fbbf24",
    hrefs: ["/admin/missions", "/admin/trust-safety", "/admin/approvals"],
  },
  {
    label: "PLATFORM",
    accentColor: "#4b5572",
    hrefs: ["/admin/analytics", "/admin/users", "/admin/notifications", "/admin/settings"],
  },
] as const;

const NAV_BY_HREF = Object.fromEntries(adminNav.map((n) => [n.href, n]));

// ─── component ────────────────────────────────────────────────────────────────

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
  const [adminTheme, setAdminTheme] = useState<"dark" | "light" | "system">("dark");
  const pathname = usePathname();
  const router = useRouter();

  const isActive = (href: string) =>
    href === "/admin" ? pathname === href : pathname.startsWith(href);

  // ─── admin theme ───────────────────────────────────────────────────────────

  useEffect(() => {
    const saved = localStorage.getItem("tt-admin-theme") as "dark" | "light" | "system" | null;
    if (saved) setAdminTheme(saved);
  }, []);

  useEffect(() => {
    const html = document.documentElement;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");

    function applyTheme(t: "dark" | "light" | "system") {
      const isDark = t === "dark" || (t === "system" && mq.matches);
      html.classList.toggle("dark", isDark);
    }

    applyTheme(adminTheme);
    const onChange = () => { if (adminTheme === "system") applyTheme("system"); };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [adminTheme]);

  function cycleAdminTheme() {
    const next = adminTheme === "dark" ? "light" : adminTheme === "light" ? "system" : "dark";
    localStorage.setItem("tt-admin-theme", next);
    setAdminTheme(next);
  }

  const ThemeIcon = adminTheme === "dark" ? Moon : adminTheme === "light" ? Sun : Monitor;
  const themeLabel = adminTheme === "dark" ? "Dark" : adminTheme === "light" ? "Light" : "System";

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
      // non-critical
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

  useEffect(() => {
    void fetchUnreadCount();
    const es = new EventSource("/api/admin/stream");
    es.addEventListener("notification", () => setUnreadCount((prev) => prev + 1));
    es.onerror = () => es.close();
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
      if (e.key === "Escape") setCommandOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

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
  const noResults = !!q && filteredNav.length === 0 && filteredActions.length === 0;

  const runQuickAction = (action: (typeof quickActions)[number]) => {
    setCommandOpen(false);
    router.push(quickActionRoutes[action]);
  };

  const initials = getInitials(name);

  // ─── render ───────────────────────────────────────────────────────────────

  return (
    <div
      className={cn("min-h-screen", adminTheme === "light" ? "adm-light" : "")}
      style={{ background: "var(--adm-bg)", color: "var(--adm-text-1)" }}
    >
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
          "fixed inset-y-0 left-0 z-40 flex w-65 flex-col transition-transform duration-200 lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
        style={{
          background: "var(--adm-surface-1)",
          borderRight: "1px solid var(--adm-border)",
        }}
      >
        {/* logo */}
        <div
          className="flex h-15 shrink-0 items-center justify-between px-4"
          style={{ borderBottom: "1px solid var(--adm-border-dim)" }}
        >
          <Link
            href="/admin"
            className="flex items-center gap-2.5"
            onClick={() => setSidebarOpen(false)}
          >
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[10px] font-extrabold tracking-tight"
              style={{ background: "var(--adm-accent-blue)", color: "#fff" }}
            >
              TT
            </span>
            <span>
              <span
                className="block text-[13px] font-semibold leading-none"
                style={{ color: "var(--adm-text-1)" }}
              >
                TakeToday
              </span>
              <span
                className="mt-0.5 block text-[10px] font-medium"
                style={{ color: "var(--adm-text-3)" }}
              >
                Newsroom OS
              </span>
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <span className="live-dot hidden lg:block" />
            <Button
              type="button"
              variant="ghost"
              className="h-7 w-7 px-0 lg:hidden"
              aria-label="Close navigation"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* grouped nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <div className="space-y-5">
            {NAV_GROUPS.map((group) => {
              const items = group.hrefs
                .map((href) => NAV_BY_HREF[href])
                .filter(Boolean);
              if (items.length === 0) return null;
              return (
                <div key={group.label}>
                  <p
                    className="mb-1.5 px-2 text-[10px] font-semibold tracking-[0.12em]"
                    style={{ color: group.accentColor, opacity: 0.65 }}
                  >
                    {group.label}
                  </p>
                  <div className="space-y-0.5">
                    {items.map((nav) => {
                      const active = isActive(nav.href);
                      return (
                        <Link
                          key={nav.href}
                          href={nav.href}
                          onClick={() => setSidebarOpen(false)}
                          className={cn(
                            "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium transition-colors",
                            active ? "adm-nav-active" : "hover:bg-white/4",
                          )}
                          style={active ? {} : { color: "var(--adm-text-2)" }}
                        >
                          <span style={{ color: active ? group.accentColor : "var(--adm-text-3)" }}>
                            <nav.icon className="h-4 w-4 shrink-0 transition-colors" />
                          </span>
                          <span className="min-w-0 flex-1 truncate">{nav.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </nav>

        {/* user footer */}
        <div
          className="shrink-0 p-3"
          style={{ borderTop: "1px solid var(--adm-border-dim)" }}
        >
          <div
            className="flex items-center gap-3 rounded-lg px-3 py-2.5"
            style={{
              background: "var(--adm-surface-2)",
              border: "1px solid var(--adm-border-dim)",
            }}
          >
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold"
              style={{
                background:
                  "linear-gradient(135deg, var(--adm-accent-blue), var(--adm-accent-purple))",
                color: "#fff",
              }}
            >
              {initials}
            </span>
            <div className="min-w-0 flex-1">
              <p
                className="truncate text-[13px] font-medium leading-none"
                style={{ color: "var(--adm-text-1)" }}
              >
                {name}
              </p>
              <p
                className="mt-0.5 flex items-center gap-0.5 text-[10px] font-medium uppercase tracking-wide"
                style={{ color: "var(--adm-accent-green)" }}
              >
                <ShieldCheck className="h-3 w-3" />
                {role}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <Link
                href="/"
                className="flex h-7 w-7 items-center justify-center rounded-md transition-colors hover:bg-white/6"
                aria-label="View public site"
                style={{ color: "var(--adm-text-3)" }}
              >
                <Home className="h-3.5 w-3.5" />
              </Link>
              <button
                type="button"
                onClick={() => void handleSignOut()}
                className="flex h-7 w-7 items-center justify-center rounded-md transition-colors hover:bg-red-500/10"
                aria-label="Sign out"
                style={{ color: "var(--adm-text-3)" }}
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* ── main content ── */}
      <div className="min-h-screen lg:pl-65">
        {/* header */}
        <header
          className="sticky top-0 z-20 flex h-15 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8"
          style={{
            background: "var(--adm-header-bg)",
            backdropFilter: "blur(20px) saturate(1.3)",
            borderBottom: "1px solid var(--adm-border-dim)",
          }}
        >
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="ghost"
              className="h-8 w-8 px-0 lg:hidden"
              aria-label="Open navigation"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-4 w-4" />
            </Button>

            {/* command palette trigger */}
            <button
              type="button"
              onClick={() => setCommandOpen(true)}
              className="hidden h-8 items-center gap-2.5 rounded-md px-3 text-sm transition sm:flex lg:w-70"
              style={{
                background: "var(--adm-surface-2)",
                border: "1px solid var(--adm-border)",
                color: "var(--adm-text-3)",
              }}
            >
              <Search className="h-3.5 w-3.5 shrink-0" />
              <span className="min-w-0 flex-1 truncate text-left">
                Search or jump to…
              </span>
              <span
                className="ml-auto inline-flex shrink-0 items-center gap-1 rounded px-1.5 py-0.5 text-[10px]"
                style={{
                  border: "1px solid var(--adm-border)",
                  color: "var(--adm-text-3)",
                }}
              >
                <Command className="h-2.5 w-2.5" /> K
              </span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            {/* LIVE badge */}
            <span
              className="hidden items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider md:inline-flex"
              style={{
                background: "rgba(52,211,153,0.10)",
                border: "1px solid rgba(52,211,153,0.22)",
                color: "var(--adm-accent-green)",
              }}
            >
              <Radio className="h-3 w-3" />
              Live
            </span>

            {/* theme toggle */}
            <button
              type="button"
              onClick={cycleAdminTheme}
              title={`Theme: ${themeLabel} (click to cycle)`}
              className="flex h-8 w-8 items-center justify-center rounded-md transition-colors hover:bg-white/6"
              style={{ color: "var(--adm-text-2)" }}
            >
              <ThemeIcon className="h-4 w-4" />
            </button>

            {/* notification bell */}
            <div className="relative">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="h-8 w-8 px-0"
                    aria-label="Notifications"
                    style={{ color: "var(--adm-text-2)" }}
                  >
                    <Bell className="h-4 w-4" />
                    {unreadCount > 0 && (
                      <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-0.5 text-[10px] font-medium text-white">
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

            {/* user avatar */}
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold"
              style={{
                background:
                  "linear-gradient(135deg, var(--adm-accent-blue), var(--adm-accent-purple))",
                color: "#fff",
              }}
            >
              {initials}
            </span>
          </div>
        </header>

        <main className="mx-auto w-full max-w-site px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>

      {/* ── command palette ── */}
      {commandOpen && (
        <div
          className="fixed inset-0 z-50 p-4"
          style={{
            background: "var(--adm-overlay-bg)",
            backdropFilter: "blur(8px)",
          }}
          onClick={() => setCommandOpen(false)}
        >
          <div
            className="glass-panel mx-auto mt-20 max-w-2xl overflow-hidden rounded-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* search input */}
            <div
              className="flex items-center gap-3 px-4"
              style={{ borderBottom: "1px solid var(--adm-border)" }}
            >
              <Search
                className="h-4 w-4 shrink-0"
                style={{ color: "var(--adm-text-3)" }}
              />
              <input
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search modules or run a quick action…"
                className="h-12 flex-1 bg-transparent text-sm outline-none placeholder:text-(--adm-text-3)"
                style={{ color: "var(--adm-text-1)" }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  aria-label="Clear search"
                  style={{ color: "var(--adm-text-3)" }}
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="max-h-[60vh] space-y-3 overflow-y-auto p-3">
              {noResults ? (
                <p
                  className="px-3 py-8 text-center text-sm"
                  style={{ color: "var(--adm-text-3)" }}
                >
                  No results for &ldquo;{searchQuery}&rdquo;
                </p>
              ) : (
                <>
                  {filteredNav.length > 0 && (
                    <section>
                      <p
                        className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-[0.12em]"
                        style={{ color: "var(--adm-text-3)" }}
                      >
                        Modules
                      </p>
                      <div className="space-y-0.5">
                        {filteredNav.map((nav) => (
                          <Link
                            key={nav.href}
                            href={nav.href}
                            onClick={() => setCommandOpen(false)}
                            className={cn(
                              "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                              isActive(nav.href)
                                ? "bg-white/8"
                                : "hover:bg-white/5",
                            )}
                            style={{ color: "var(--adm-text-1)" }}
                          >
                            <span style={{ color: "var(--adm-text-3)" }}>
                              <nav.icon className="h-4 w-4 shrink-0" />
                            </span>
                            <span className="flex-1">{nav.label}</span>
                            <span
                              className="text-xs"
                              style={{ color: "var(--adm-text-3)" }}
                            >
                              {nav.description}
                            </span>
                          </Link>
                        ))}
                      </div>
                    </section>
                  )}

                  {filteredActions.length > 0 && (
                    <section>
                      <p
                        className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-[0.12em]"
                        style={{ color: "var(--adm-text-3)" }}
                      >
                        Quick actions
                      </p>
                      <div className="space-y-0.5">
                        {filteredActions.map((action) => (
                          <button
                            key={action}
                            type="button"
                            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-white/5"
                            style={{ color: "var(--adm-text-2)" }}
                            onClick={() => runQuickAction(action)}
                          >
                            <Zap
                              className="h-4 w-4 shrink-0"
                              style={{ color: "var(--adm-accent-amber)" }}
                            />
                            {action}
                          </button>
                        ))}
                      </div>
                    </section>
                  )}
                </>
              )}

              <div
                className="pt-1"
                style={{ borderTop: "1px solid var(--adm-border)" }}
              >
                <button
                  type="button"
                  onClick={() => void handleSignOut()}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-red-500/10"
                  style={{ color: "var(--adm-text-2)" }}
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
