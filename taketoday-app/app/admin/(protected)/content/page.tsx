"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Plus, Search, X } from "lucide-react";
import { AdminMotion } from "@/components/admin/AdminMotion";
import { ArticleTable } from "@/components/admin/ArticleTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { WorkflowStatus } from "@/lib/admin/types";

// ─── constants ────────────────────────────────────────────────────────────────

const STATUS_TABS = [
  { value: "all", label: "All" },
  { value: "draft", label: "Draft" },
  { value: "under_review", label: "Under Review" },
  { value: "approved", label: "Approved" },
  { value: "scheduled", label: "Scheduled" },
  { value: "published", label: "Published" },
  { value: "archived", label: "Archived" },
] as const;

type StatusTab = (typeof STATUS_TABS)[number]["value"];

const STATUS_OPTIONS: { value: WorkflowStatus; label: string }[] = [
  { value: "draft", label: "Draft" },
  { value: "under_review", label: "Under Review" },
  { value: "approved", label: "Approved" },
  { value: "scheduled", label: "Scheduled" },
  { value: "published", label: "Published" },
  { value: "archived", label: "Archived" },
];

// ─── slug helpers ─────────────────────────────────────────────────────────────

function toSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 80);
}

// ─── types ────────────────────────────────────────────────────────────────────

interface CategoryOption {
  id: string;
  name: string;
  slug: string;
}

type CreateForm = {
  headline: string;
  subheadline: string;
  slug: string;
  body: string;
  status: WorkflowStatus;
  categoryId: string;
  priorityScore: number;
  breaking: boolean;
  tags: string;          // comma-separated; parsed before submit
  seoTitle: string;
  seoDescription: string;
  language: string;
  location: string;
};

const DEFAULT_FORM: CreateForm = {
  headline: "",
  subheadline: "",
  slug: "",
  body: "",
  status: "draft",
  categoryId: "",
  priorityScore: 50,
  breaking: false,
  tags: "",
  seoTitle: "",
  seoDescription: "",
  language: "en",
  location: "",
};

// ─── styled select ────────────────────────────────────────────────────────────

function Select({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 w-full appearance-none rounded-md border border-white/10 bg-zinc-900 px-3 pr-8 text-sm text-white outline-none transition focus:border-white/25"
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-2.5 h-4 w-4 text-zinc-400" />
    </div>
  );
}

// ─── component ────────────────────────────────────────────────────────────────

export default function ContentPage() {
  // ── filter state ──
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [activeStatus, setActiveStatus] = useState<StatusTab>("all");

  // ── table refresh ──
  const [tableKey, setTableKey] = useState(0);

  // ── create modal ──
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<CreateForm>(DEFAULT_FORM);
  const [slugAutoGen, setSlugAutoGen] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // ── categories for dropdown ──
  const [categories, setCategories] = useState<CategoryOption[]>([]);

  // ─── debounce search 300 ms ───────────────────────────────────────────────

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(search), 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search]);

  // ─── table query params ───────────────────────────────────────────────────

  const queryParams = useMemo(
    () => ({
      q: debouncedSearch || undefined,
      status: activeStatus === "all" ? undefined : activeStatus,
    }),
    [debouncedSearch, activeStatus],
  );

  // ─── fetch categories once ────────────────────────────────────────────────

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/categories");
      if (!res.ok) return;
      const json = await res.json();
      const cats = (json.data as { categories: CategoryOption[] }).categories ?? [];
      setCategories(cats);
    } catch {
      // non-critical
    }
  }, []);

  useEffect(() => {
    void fetchCategories();
  }, [fetchCategories]);

  // ─── create handlers ──────────────────────────────────────────────────────

  const patchForm = (patch: Partial<CreateForm>) => setForm((prev) => ({ ...prev, ...patch }));

  const handleHeadlineChange = (value: string) => {
    setForm((prev) => ({
      ...prev,
      headline: value,
      slug: slugAutoGen ? toSlug(value) : prev.slug,
    }));
  };

  const handleSlugChange = (value: string) => {
    setSlugAutoGen(false);
    patchForm({ slug: value });
  };

  const openCreate = () => {
    setForm(DEFAULT_FORM);
    setSlugAutoGen(true);
    setCreateError(null);
    setShowCreate(true);
  };

  const closeCreate = () => {
    setShowCreate(false);
    setCreateError(null);
  };

  const handleCreate = async () => {
    setIsCreating(true);
    setCreateError(null);

    const parsedTags = form.tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    try {
      const res = await fetch("/api/admin/articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          headline: form.headline,
          subheadline: form.subheadline,
          slug: form.slug,
          body: form.body,
          status: form.status,
          categoryId: form.categoryId || undefined,
          priorityScore: form.priorityScore,
          breaking: form.breaking,
          seoTitle: form.seoTitle || undefined,
          seoDescription: form.seoDescription || undefined,
          tags: parsedTags,
          language: form.language,
          location: form.location || undefined,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        setCreateError((json as { error?: string }).error ?? `HTTP ${res.status}`);
        return;
      }

      closeCreate();
      // Force table remount → fresh fetch
      setTableKey((k) => k + 1);
    } catch {
      setCreateError("Network error. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  // ─── render ───────────────────────────────────────────────────────────────

  return (
    <AdminMotion>
      <div className="space-y-6">

        {/* ── page header ── */}
        <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <Badge tone="blue">CMS</Badge>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">News CMS</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
              Create, review, schedule, publish, and archive every TakeToday story.
            </p>
          </div>
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Create article
          </Button>
        </section>

        {/* ── search + status tabs ── */}
        <Card>
          <CardContent className="pt-5 pb-0">
            {/* search */}
            <div className="relative mb-4">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by headline, author, or tag…"
                className="h-9 w-full rounded-md border border-white/10 bg-zinc-900 pl-9 pr-9 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-white/25 sm:max-w-md"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-2.5 text-zinc-500 hover:text-zinc-300"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* status tabs */}
            <div className="flex gap-1 overflow-x-auto border-b border-white/10 pb-0">
              {STATUS_TABS.map((tab) => (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => setActiveStatus(tab.value)}
                  className={cn(
                    "shrink-0 border-b-2 px-3 pb-3 pt-1 text-sm font-medium transition-colors",
                    activeStatus === tab.value
                      ? "border-white text-white"
                      : "border-transparent text-zinc-500 hover:text-zinc-300",
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* ── article table ── */}
        <Card>
          <CardHeader>
            <CardTitle>Editorial Queue</CardTitle>
            <CardDescription>
              {activeStatus === "all" ? "All articles" : `Filtered: ${activeStatus.replace("_", " ")}`}
              {debouncedSearch ? ` · search "${debouncedSearch}"` : ""}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* key forces remount (and re-fetch) after create */}
            <ArticleTable key={tableKey} queryParams={queryParams} />
          </CardContent>
        </Card>
      </div>

      {/* ── create article modal ── */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm">
          <div className="my-8 w-full max-w-2xl rounded-lg border border-white/10 bg-zinc-950 shadow-2xl">

            {/* header */}
            <div className="flex items-center justify-between border-b border-white/10 p-5">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">New article</p>
                <h2 className="mt-0.5 text-lg font-semibold text-white">Create article</h2>
              </div>
              <Button variant="ghost" className="h-8 w-8 px-0" onClick={closeCreate}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* body */}
            <div className="space-y-5 p-5">
              {createError && (
                <p className="rounded-md border border-red-400/20 bg-red-400/10 px-3 py-2 text-sm text-red-300">
                  {createError}
                </p>
              )}

              {/* headline */}
              <label className="block text-sm font-medium text-zinc-300">
                Headline <span className="text-red-400">*</span>
                <Input
                  className="mt-2"
                  placeholder="At least 8 characters"
                  value={form.headline}
                  onChange={(e) => handleHeadlineChange(e.target.value)}
                />
              </label>

              {/* subheadline */}
              <label className="block text-sm font-medium text-zinc-300">
                Subheadline <span className="text-red-400">*</span>
                <Textarea
                  className="mt-2 min-h-16"
                  placeholder="At least 12 characters"
                  value={form.subheadline}
                  onChange={(e) => patchForm({ subheadline: e.target.value })}
                />
              </label>

              {/* slug */}
              <label className="block text-sm font-medium text-zinc-300">
                Slug <span className="text-red-400">*</span>
                <div className="relative mt-2">
                  <Input
                    className="font-mono"
                    placeholder="auto-generated-from-headline"
                    value={form.slug}
                    onChange={(e) => handleSlugChange(e.target.value)}
                  />
                  {!slugAutoGen && (
                    <button
                      type="button"
                      className="absolute right-2.5 top-2 text-xs text-zinc-500 hover:text-zinc-300"
                      onClick={() => {
                        setSlugAutoGen(true);
                        patchForm({ slug: toSlug(form.headline) });
                      }}
                    >
                      reset
                    </button>
                  )}
                </div>
                <p className="mt-1 text-xs text-zinc-600">Only lowercase letters, numbers, hyphens.</p>
              </label>

              {/* status + category */}
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-medium text-zinc-300">
                  Status
                  <div className="mt-2">
                    <Select
                      value={form.status}
                      onChange={(v) => patchForm({ status: v as WorkflowStatus })}
                      options={STATUS_OPTIONS}
                    />
                  </div>
                </label>

                <label className="block text-sm font-medium text-zinc-300">
                  Category
                  <div className="mt-2">
                    <Select
                      value={form.categoryId}
                      onChange={(v) => patchForm({ categoryId: v })}
                      placeholder="Uncategorized"
                      options={categories.map((c) => ({ value: c.id, label: c.name }))}
                    />
                  </div>
                </label>
              </div>

              {/* priority + breaking */}
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-medium text-zinc-300">
                  Priority score <span className="text-zinc-500">(0–100)</span>
                  <Input
                    className="mt-2"
                    type="number"
                    min={0}
                    max={100}
                    value={form.priorityScore}
                    onChange={(e) =>
                      patchForm({
                        priorityScore: Math.max(0, Math.min(100, parseInt(e.target.value, 10) || 0)),
                      })
                    }
                  />
                </label>

                <label className="flex cursor-pointer items-center gap-3 text-sm font-medium text-zinc-300 pt-6">
                  <input
                    type="checkbox"
                    checked={form.breaking}
                    onChange={(e) => patchForm({ breaking: e.target.checked })}
                    className="h-4 w-4 rounded border-white/20 bg-zinc-900 accent-white"
                  />
                  Breaking news
                </label>
              </div>

              {/* body */}
              <label className="block text-sm font-medium text-zinc-300">
                Body
                <Textarea
                  className="mt-2 min-h-40"
                  placeholder="Article body (markdown supported)"
                  value={form.body}
                  onChange={(e) => patchForm({ body: e.target.value })}
                />
              </label>

              {/* tags */}
              <label className="block text-sm font-medium text-zinc-300">
                Tags
                <Input
                  className="mt-2"
                  placeholder="OpenAI, Enterprise AI, Governance"
                  value={form.tags}
                  onChange={(e) => patchForm({ tags: e.target.value })}
                />
                <p className="mt-1 text-xs text-zinc-600">Comma-separated.</p>
              </label>

              {/* SEO + meta — collapsible */}
              <details className="group">
                <summary className="cursor-pointer select-none text-sm font-medium text-zinc-400 hover:text-zinc-200">
                  SEO &amp; metadata ▸
                </summary>
                <div className="mt-4 space-y-4">
                  <label className="block text-sm font-medium text-zinc-300">
                    SEO title <span className="text-zinc-500">(max 70 chars)</span>
                    <Input
                      className="mt-2"
                      maxLength={70}
                      value={form.seoTitle}
                      onChange={(e) => patchForm({ seoTitle: e.target.value })}
                    />
                  </label>
                  <label className="block text-sm font-medium text-zinc-300">
                    SEO description <span className="text-zinc-500">(max 160 chars)</span>
                    <Textarea
                      className="mt-2 min-h-16"
                      maxLength={160}
                      value={form.seoDescription}
                      onChange={(e) => patchForm({ seoDescription: e.target.value })}
                    />
                  </label>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block text-sm font-medium text-zinc-300">
                      Language
                      <Input
                        className="mt-2"
                        placeholder="en"
                        value={form.language}
                        onChange={(e) => patchForm({ language: e.target.value })}
                      />
                    </label>
                    <label className="block text-sm font-medium text-zinc-300">
                      Location
                      <Input
                        className="mt-2"
                        placeholder="Global"
                        value={form.location}
                        onChange={(e) => patchForm({ location: e.target.value })}
                      />
                    </label>
                  </div>
                </div>
              </details>
            </div>

            {/* footer */}
            <div className="flex justify-end gap-2 border-t border-white/10 p-5">
              <Button variant="secondary" onClick={closeCreate} disabled={isCreating}>
                Cancel
              </Button>
              <Button onClick={() => void handleCreate()} disabled={isCreating}>
                {isCreating ? (
                  "Creating…"
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    Create article
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </AdminMotion>
  );
}
