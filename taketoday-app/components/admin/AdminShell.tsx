"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, Command, Search, ShieldCheck, Menu } from "lucide-react";
import { adminNav, quickActions, type ModuleKey } from "@/lib/admin/modules";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAdminStore } from "@/components/admin/admin-store";
import { DropdownMenu, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import type { AdminRole } from "@/lib/admin/types";
import { useState, useRef, useEffect } from "react";

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
  const router = useRouter();
  const { commandOpen, setCommandOpen, setSelectedWorkspace } = useAdminStore();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredCommands, setFilteredCommands] = useState<Array<{
    type: "nav" | "action";
    href?: string;
    label: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    action?: () => void;
  }>> = [];
  const selectedIndexRef = useRef(-1);

  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Prepare all available commands (nav + actions)
  const allCommands = React.useMemo(() => {
    const navCommands = adminNav.map((item) => ({
      type: "nav" as const,
      href: item.href,
      label: item.label,
      description: item.description,
      icon: item.icon,
    }));

    const actionCommands = quickActions.map((action) => ({
      type: "action" as const,
      label: action,
      description: `Run action: ${action}`,
      icon: Search, // Default icon for actions
      action: () => {
        // Handle specific actions
        switch (action) {
          case "Create article":
            router.push("/admin/content/new");
            break;
          case "Import URL":
            // TODO: Implement import URL modal
            alert("Import URL functionality not implemented yet");
            break;
          case "Generate captions":
            // TODO: Implement generate captions modal
            alert("Generate captions functionality not implemented yet");
            break;
          case "Schedule social post":
            // TODO: Implement schedule social post modal
            alert("Schedule social post functionality not implemented yet");
            break;
          case "Upload media":
            // TODO: Implement upload media modal
            alert("Upload media functionality not implemented yet");
            break;
          case "Invite teammate":
            // TODO: Implement invite teammate modal
            alert("Invite teammate functionality not implemented yet");
            break;
          default:
            console.log(`Action not implemented: ${action}`);
        }
        setCommandOpen(false);
      },
    }));

    return [...navCommands, ...actionCommands];
  }, [adminNav, quickActions, router]);

  // Filter commands based on search query
  useEffect(() => {
    if (!searchQuery) {
      setFilteredCommands(allCommands.slice(0, 10)); // Show first 10 when empty
      return;
    }

    const lowerQuery = searchQuery.toLowerCase();
    const filtered = allCommands.filter(
      (cmd) =>
        cmd.label.toLowerCase().includes(lowerQuery) ||
        cmd.description.toLowerCase().includes(lowerQuery)
    );
    setFilteredCommands(filtered);
    // Reset selected index when filter changes
    selectedIndexRef.current = -1;
  }, [searchQuery, allCommands]);

  // Handle keyboard navigation for command palette
  useEffect(() => {
    if (!commandOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (filteredCommands.length === 0) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        selectedIndexRef.current =
          (selectedIndexRef.current + 1) % filteredCommands.length;
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        selectedIndexRef.current =
          (selectedIndexRef.current - 1 + filteredCommands.length) %
          filteredCommands.length;
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (selectedIndexRef.current >= 0 && selectedIndexRef.current < filteredCommands.length) {
          const command = filteredCommands[selectedIndexRef.current];
          if (command.type === "nav" && command.href) {
            router.push(command.href);
          } else if (command.type === "action" && command.action) {
            command.action();
          }
          setCommandOpen(false);
        }
      } else if (e.key === "Escape") {
        setCommandOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
    }, [commandOpen, filteredCommands, router]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Mobile sidebar toggle button */}
      <button
        type="button"
        onClick={handleSidebarToggle}
        className="fixed inset-y-0 left-0 z-40 flex items-center px-4 md:hidden"
        aria-label="Open sidebar"
      >
        <Menu className="h-6 w-6 text-zinc-400 hover:text-white" />
      </button>

      <aside 
        className={cn(
          "fixed inset-y-0 left-0 z-30 flex-shrink-0 w-72 border-r border-white/10 bg-zinc-950/95 px-4 py-5",
          sidebarOpen ? "transform -translate-x-0" : "-translate-x-full",
          "transition-transform duration-300 lg:-translate-x-0 lg:static"
        )}
      >
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
                <Button variant="ghost" className="h-9 w-9 px-0" aria-label="Notifications">
                  <Bell className="h-4 w-4" />
                  {/* Unread count badge */}
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-zinc-50 text-xs">
                    2
                  </span>
                </Button>
                {/* Notification dropdown */}
                <DropdownMenu className="w-56 mt-2">
                  <DropdownMenuItem onClick={() => {/* Mark all as read */}}>
                    Mark all as read
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => {/* Go to notifications page */}}>
                    View all notifications
                  </DropdownMenuItem>
                  {/* Notification items would go here */}
                  <DropdownMenuItem className="border-t pt-2">
                    <div className="text-xs text-zinc-500">2 new</div>
                  </DropdownMenuItem>
                </DropdownMenu>
              </div>
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
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search records, jump to module, or run action..."
                className="h-10 w-full bg-transparent px-2 text-sm text-white outline-none placeholder:text-zinc-500"
              />
            </div>
            <div className="max-h-96 overflow-y-auto p-2">
              {filteredCommands.length === 0 ? (
                <div className="text-center py-4 text-zinc-500">
                  No commands found
                </div>
              ) : (
                <>
                  {filteredCommands.map((command, index) => {
                    const isSelected = index === selectedIndexRef.current;
                    const handleClick = () => {
                      selectedIndexRef.current = index;
                      if (command.type === "nav" && command.href) {
                        router.push(command.href);
                      } else if (command.type === "action" && command.action) {
                        command.action();
                      }
                      setCommandOpen(false);
                    };

                    return (
                      <div
                        key={`${command.type}-${index}`}
                        onClick={handleClick}
                        className={cn(
                          "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                          isSelected
                            ? "bg-white/[0.07] text-white"
                            : "hover:bg-white/[0.07] hover:text-white"
                        )}
                      >
                        <command.icon className="h-4 w-4 shrink-0" />
                        <div>
                          <p className="font-medium">{command.label}</p>
                          <p className="text-xs text-zinc-500">{command.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
