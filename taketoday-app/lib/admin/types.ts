export const ADMIN_ROLES = [
  "Super Admin",
  "Editor",
  "Content Manager",
  "Social Media Manager",
  "Analyst",
] as const;

export type AdminRole = (typeof ADMIN_ROLES)[number];

export type AdminPermission =
  | "dashboard:read"
  | "content:read"
  | "content:write"
  | "content:publish"
  | "ai:run"
  | "ingestion:write"
  | "media:write"
  | "social:write"
  | "analytics:read"
  | "users:manage"
  | "settings:manage";

export type WorkflowStatus =
  | "draft"
  | "scheduled"
  | "published"
  | "archived";

export type AdminArticle = Readonly<{
  id: string;
  headline: string;
  slug: string;
  body?: string;
  excerpt: string;
  status: WorkflowStatus;
  category: string;
  categoryId: string | null;
  author: string;
  breaking: boolean;
  views: number;
  tags: string[];
  seoTitle: string;
  seoDescription: string;
  scheduledAt?: string;
  publishedAt?: string;
  updatedAt: string;
}>;

export type ActivityEvent = Readonly<{
  id: string;
  actor: string;
  action: string;
  target: string;
  at: string;
  severity: "info" | "success" | "warning" | "danger";
}>;

export type MetricPoint = Readonly<{
  label: string;
  value: number;
}>;

export type AdminUser = Readonly<{
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  status: "active" | "invited" | "suspended";
  lastActive: string;
}>;

export type NotificationItem = Readonly<{
  id: string;
  title: string;
  message: string;
  kind: "approval" | "publishing" | "ingestion" | "social" | "trend";
  read: boolean;
  createdAt: string;
}>;
