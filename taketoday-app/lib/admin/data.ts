import type {
  ActivityEvent,
  AdminArticle,
  AdminRole,
  AdminUser,
  MetricPoint,
  NotificationItem,
  Platform,
} from "@/lib/admin/types";

export const adminArticles: AdminArticle[] = [
  {
    id: "art_001",
    headline: "OpenAI launches enterprise workspace controls",
    subheadline: "The release raises the baseline for AI governance in large teams.",
    slug: "openai-enterprise-workspace-controls",
    status: "published",
    category: "AI",
    author: "TakeToday Desk",
    priorityScore: 94,
    language: "English",
    location: "Global",
    breaking: false,
    tags: ["OpenAI", "Enterprise AI", "Governance"],
    seoTitle: "OpenAI enterprise workspace controls explained",
    seoDescription: "What OpenAI's enterprise controls mean for CIOs and AI governance teams.",
    sourceLink: "https://example.com/openai-enterprise",
    canonicalUrl: "https://taketoday.com/article/openai-enterprise-workspace-controls",
    publishedAt: "2026-05-20T08:00:00Z",
    updatedAt: "2026-05-20T09:15:00Z",
  },
  {
    id: "art_002",
    headline: "India's UPI merchant caps create a new fintech battleground",
    subheadline: "Payment apps are rebalancing incentives before the next policy window.",
    slug: "india-upi-merchant-caps-fintech",
    status: "under_review",
    category: "Finance",
    author: "Meera Iyer",
    priorityScore: 88,
    language: "English",
    location: "India",
    breaking: true,
    tags: ["UPI", "Fintech", "India"],
    seoTitle: "UPI merchant caps and India's fintech reset",
    seoDescription: "Why UPI merchant caps could reshape fintech distribution in India.",
    scheduledAt: "2026-05-20T14:30:00Z",
    updatedAt: "2026-05-20T10:20:00Z",
  },
  {
    id: "art_003",
    headline: "Nvidia's datacenter run rate keeps pressure on cloud buyers",
    subheadline: "GPU supply has improved, but contract pricing is still doing the talking.",
    slug: "nvidia-datacenter-cloud-buyers",
    status: "scheduled",
    category: "Tech",
    author: "Aarav Shah",
    priorityScore: 82,
    language: "English",
    location: "US",
    breaking: false,
    tags: ["Nvidia", "Cloud", "Chips"],
    seoTitle: "Nvidia datacenter growth and cloud buyer pressure",
    seoDescription: "The cloud economics behind Nvidia's latest datacenter momentum.",
    scheduledAt: "2026-05-21T04:00:00Z",
    updatedAt: "2026-05-20T07:40:00Z",
  },
  {
    id: "art_004",
    headline: "Creator economy teams move from tools to AI production stacks",
    subheadline: "The winners are shifting from single-purpose apps to full content pipelines.",
    slug: "creator-economy-ai-production-stacks",
    status: "draft",
    category: "Startups",
    author: "TakeToday Desk",
    priorityScore: 73,
    language: "English",
    location: "Global",
    breaking: false,
    tags: ["Creator Economy", "AI Tools", "Startups"],
    seoTitle: "Creator economy AI production stacks",
    seoDescription: "How AI is changing creator tooling from apps to complete workflows.",
    updatedAt: "2026-05-19T18:10:00Z",
  },
];

export const activityEvents: ActivityEvent[] = [
  {
    id: "evt_001",
    actor: "Meera Iyer",
    action: "submitted for approval",
    target: "India's UPI merchant caps",
    at: "10 min ago",
    severity: "warning",
  },
  {
    id: "evt_002",
    actor: "AI Assistant",
    action: "generated captions for",
    target: "OpenAI enterprise controls",
    at: "24 min ago",
    severity: "success",
  },
  {
    id: "evt_003",
    actor: "Aarav Shah",
    action: "scheduled",
    target: "Nvidia datacenter run rate",
    at: "48 min ago",
    severity: "info",
  },
  {
    id: "evt_004",
    actor: "Social Hub",
    action: "retry needed for",
    target: "LinkedIn distribution",
    at: "1 hr ago",
    severity: "danger",
  },
];

export const trafficSeries: MetricPoint[] = [
  { label: "Mon", value: 18200 },
  { label: "Tue", value: 21400 },
  { label: "Wed", value: 24600 },
  { label: "Thu", value: 23100 },
  { label: "Fri", value: 28900 },
  { label: "Sat", value: 25100 },
  { label: "Sun", value: 31800 },
];

export const engagementSeries: MetricPoint[] = [
  { label: "CTR", value: 8.4 },
  { label: "Scroll", value: 68 },
  { label: "Shares", value: 12.7 },
  { label: "Saves", value: 9.1 },
];

export const adminUsers: AdminUser[] = [
  { id: "usr_001", name: "Ayush Verma", email: "ayush@taketoday.com", role: "Super Admin", status: "active", lastActive: "Now" },
  { id: "usr_002", name: "Meera Iyer", email: "meera@taketoday.com", role: "Editor", status: "active", lastActive: "12 min ago" },
  { id: "usr_003", name: "Aarav Shah", email: "aarav@taketoday.com", role: "Content Manager", status: "active", lastActive: "1 hr ago" },
  { id: "usr_004", name: "Riya Menon", email: "riya@taketoday.com", role: "Social Media Manager", status: "invited", lastActive: "Pending" },
  { id: "usr_005", name: "Kabir Rao", email: "kabir@taketoday.com", role: "Analyst", status: "active", lastActive: "Yesterday" },
];

export const notifications: NotificationItem[] = [
  {
    id: "not_001",
    title: "Approval requested",
    message: "UPI merchant caps is waiting for editorial review.",
    kind: "approval",
    read: false,
    createdAt: "2026-05-20T10:18:00Z",
  },
  {
    id: "not_002",
    title: "Posting retry failed",
    message: "LinkedIn rejected one scheduled post because the token expired.",
    kind: "social",
    read: false,
    createdAt: "2026-05-20T09:50:00Z",
  },
  {
    id: "not_003",
    title: "Trend detected",
    message: "AI agents for SaaS support is accelerating across X and RSS sources.",
    kind: "trend",
    read: true,
    createdAt: "2026-05-20T08:40:00Z",
  },
];

export const roleMatrix: ReadonlyArray<{ role: AdminRole; access: string }> = [
  { role: "Super Admin", access: "Everything, billing, API keys, users, audit logs" },
  { role: "Editor", access: "Editorial workflow, approvals, publishing, analytics" },
  { role: "Content Manager", access: "Drafting, ingestion, media, AI tools" },
  { role: "Social Media Manager", access: "Distribution hub, media, captions, post logs" },
  { role: "Analyst", access: "Read-only content and analytics dashboards" },
];

export const socialPlatforms: Platform[] = ["X", "Instagram", "WhatsApp", "Telegram", "Facebook", "LinkedIn"];
