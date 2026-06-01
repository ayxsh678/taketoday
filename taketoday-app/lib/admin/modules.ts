import {
  Bell,
  Bot,
  Boxes,
  ChartNoAxesCombined,
  Clapperboard,
  DatabaseZap,
  FileText,
  Gauge,
  Image,
  Layers,
  Megaphone,
  Settings,
  ShieldCheck,
  Users,
  Newspaper,
  Flag,
  Target,
} from "lucide-react";
import type { ComponentType } from "react";

export type AdminNavItem = Readonly<{
  href: string;
  label: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
}>;

export const adminNav: AdminNavItem[] = [
  { href: "/admin", label: "Dashboard", description: "Command center", icon: Gauge },
  { href: "/admin/content", label: "News CMS", description: "Articles and workflow", icon: FileText },
  { href: "/admin/categories", label: "Categories", description: "Taxonomy and desks", icon: Boxes },
  { href: "/admin/ai", label: "AI Assistant", description: "Rewrite, debate, summarize", icon: Bot },
  { href: "/admin/carousel", label: "Carousel Studio", description: "Generate slide carousels", icon: Layers },
  { href: "/admin/ingestion", label: "Ingestion", description: "RSS, URL, trend pipelines", icon: DatabaseZap },
  { href: "/admin/media", label: "Media Library", description: "Images, videos, folders", icon: Image },
  { href: "/admin/social", label: "Distribution", description: "Multi-platform posting", icon: Megaphone },
  { href: "/admin/video", label: "Short Video", description: "Reels and shorts queue", icon: Clapperboard },
  { href: "/admin/editorial", label: "Editorial Queue", description: "Contributor submissions workflow", icon: Newspaper },
  { href: "/admin/missions", label: "Missions", description: "Civic journalism missions and quests", icon: Target },
  { href: "/admin/trust-safety", label: "Trust & Safety", description: "Abuse flags and moderation queue", icon: Flag },
  { href: "/admin/approvals", label: "Approvals", description: "Review and audit trail", icon: ShieldCheck },
  { href: "/admin/analytics", label: "Analytics", description: "Traffic and engagement", icon: ChartNoAxesCombined },
  { href: "/admin/users", label: "Users", description: "Roles and permissions", icon: Users },
  { href: "/admin/notifications", label: "Notifications", description: "Alerts and failures", icon: Bell },
  { href: "/admin/settings", label: "Settings", description: "Branding and integrations", icon: Settings },
  { href: "/admin/automation", label: "Automation Hub", description: "Scraping, AI processing, and deliverables", icon: Bot },
];

export const quickActions = [
  "Create article",
  "Import URL",
  "Generate captions",
  "Schedule social post",
  "Upload media",
  "Invite teammate",
] as const;

export type QuickAction = (typeof quickActions)[number];

// Maps each quick action label to its destination admin route
export const quickActionRoutes: Record<QuickAction, string> = {
  "Create article": "/admin/content",
  "Import URL": "/admin/ingestion",
  "Generate captions": "/admin/ai",
  "Schedule social post": "/admin/social",
  "Upload media": "/admin/media",
  "Invite teammate": "/admin/users",
};

export const moduleBlueprints = {
  content: {
    title: "News Content Management",
    eyebrow: "CMS",
    description: "Create, review, schedule, publish, duplicate, archive, and optimize every TakeToday story.",
    actions: ["Create article", "Save draft", "Preview", "Bulk publish"],
  },
  ai: {
    title: "AI Content Assistant",
    eyebrow: "AI Desk",
    description: "Rewrite, summarize, generate headlines, detect sentiment, fact-check, and debate a story from bullish and bearish angles.",
    actions: ["Rewrite article", "Generate hashtags", "Run fact-check", "Create debate"],
  },
  ingestion: {
    title: "News Ingestion System",
    eyebrow: "Pipelines",
    description: "Pull story candidates from RSS, URLs, scraping jobs, YouTube transcripts, and X trends with duplicate checks.",
    actions: ["Add RSS feed", "Import URL", "Validate source", "Auto-tag"],
  },
  media: {
    title: "Media Library",
    eyebrow: "Assets",
    description: "Upload, organize, tag, compress, and preview editorial media for web and social distribution.",
    actions: ["Upload", "Create folder", "Compress", "Tag assets"],
  },
  social: {
    title: "Social Distribution Hub",
    eyebrow: "Distribution",
    description: "Compose once, preview per platform, schedule, publish, and retry failed posts across channels.",
    actions: ["Compose post", "Generate caption", "Schedule", "Retry failures"],
  },
  video: {
    title: "Short Video Content System",
    eyebrow: "Reels",
    description: "Turn scripts into shorts with voiceover triggers, avatar support, subtitles, and publish queues.",
    actions: ["Upload script", "Generate subtitles", "Pick assets", "Queue render"],
  },
  approvals: {
    title: "Approval Workflow",
    eyebrow: "Review",
    description: "Submit, comment, approve, reject, request revisions, and keep a tamper-aware audit log.",
    actions: ["Approve", "Reject", "Request revision", "View audit log"],
  },
  analytics: {
    title: "Analytics Panel",
    eyebrow: "Performance",
    description: "Track traffic, CTR, bounce rate, social engagement, follower growth, source quality, and AI content performance.",
    actions: ["Export CSV", "Compare period", "View top stories", "Segment sources"],
  },
  categories: {
    title: "Category Management",
    eyebrow: "Taxonomy",
    description: "Maintain desks, category slugs, ordering, and active states for public navigation and editorial routing.",
    actions: ["Create category", "Reorder desks", "Audit taxonomy", "Review usage"],
  },
  users: {
    title: "User Management",
    eyebrow: "Team",
    description: "Invite teammates, assign roles, revoke access, audit sessions, and manage permission boundaries.",
    actions: ["Invite user", "Assign role", "Revoke access", "View activity"],
  },
  notifications: {
    title: "Notifications",
    eyebrow: "Alerts",
    description: "Monitor approval, publishing, scraping, social posting, and trending-topic alerts in real time.",
    actions: ["Mark read", "Route alert", "Retry job", "Mute source"],
  },
  settings: {
    title: "Settings",
    eyebrow: "Workspace",
    description: "Manage brand defaults, API keys, social integrations, SEO templates, publishing rules, and notifications.",
    actions: ["Update brand", "Rotate API key", "Connect channel", "Edit defaults"],
  },
  automation: {
    title: "Automation Hub",
    eyebrow: "Automation",
    description: "Scheduled scraping, AI processing, and deliverable generation with single-click pipeline execution.",
    actions: ["Run full pipeline", "Scrape sources", "Generate headlines", "Create deliverable", "View job queue"],
  },
} as const;

export type ModuleKey = keyof typeof moduleBlueprints;

export const auditEvents = [
  { actor: "Ayush Verma", event: "changed OpenAI API key scope", at: "Today, 10:45" },
  { actor: "Meera Iyer", event: "approved India UPI story", at: "Today, 10:30" },
  { actor: "System", event: "blocked duplicate RSS import", at: "Today, 09:18" },
  { actor: "Riya Menon", event: "scheduled LinkedIn thread", at: "Yesterday, 22:10" },
] as const;
