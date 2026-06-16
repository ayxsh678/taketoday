import {
  FileText,
  Gauge,
  Image,
  Boxes,
  Settings,
  Clapperboard,
  Brain,
  Bot,
} from "lucide-react";
import type { ComponentType } from "react";

export type AdminNavItem = Readonly<{
  href: string;
  label: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
}>;

export const adminNav: AdminNavItem[] = [
  { href: "/admin", label: "Dashboard", description: "Overview and stats", icon: Gauge },
  { href: "/admin/content", label: "Articles", description: "Manage stories", icon: FileText },
  { href: "/admin/categories", label: "Categories", description: "Editorial taxonomy", icon: Boxes },
  { href: "/admin/media", label: "Media", description: "Images and files", icon: Image },
  { href: "/admin/studio", label: "Studio", description: "Social content creator", icon: Clapperboard },
  { href: "/admin/intelligence", label: "Intelligence", description: "Stories, questions, predictions", icon: Brain },
  { href: "/admin/ai", label: "AI Usage", description: "Cost tracking, routing analytics", icon: Bot },
  { href: "/admin/settings", label: "Settings", description: "Workspace config", icon: Settings },
];

export const quickActions = [
  "Create article",
  "Upload media",
] as const;

export type QuickAction = (typeof quickActions)[number];

export const quickActionRoutes: Record<QuickAction, string> = {
  "Create article": "/admin/content",
  "Upload media": "/admin/media",
};
