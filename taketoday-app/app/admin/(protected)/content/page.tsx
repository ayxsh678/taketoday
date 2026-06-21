"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ChevronDown, Plus, Search, X } from "lucide-react";
import { ArticleTable } from "@/components/admin/ArticleTable";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { WorkflowStatus } from "@/lib/admin/types";

const STATUS_TABS = [
  { value: "all", label: "All" },
  { value: "draft", label: "Draft" },
  { value: "scheduled", label: "Scheduled" },
  { value: "published", label: "Published" },
  { value: "archived", label: "Archived" },
] as const;

type StatusTab = (typeof STATUS_TABS)[number]["value"];

const STATUS_OPTIONS: { value: WorkflowStatus; label: string }[] = [
  { value: "draft", label: "Draft" },
  { value: "scheduled", label: "Scheduled" },
  { value: "published", label: "Published" },
  { value: "archived", label: "Archived" },
];

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

interface CategoryOption {
  id: string;
  name: string;
  slug: string;
}

type CreateForm = {
  headline: string;
  slug: string;
  excerpt: string;
  body: string;
  status: WorkflowStatus;
  categoryId: string;
  breaking: boolean;
  tags: string;
  seoTitle: string;
  seoDescription: string;
};

const DEFAULT_FORM: CreateForm = {
  headline: "",
  slug: "",
  excerpt: "",
  body: "",
  status: "draft",
  categoryId: "",
  breaking: false,
  tags: "",
  seoTitle: "",
  seoDescription: "",
};

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
        {placeholder && <option value="" disabled>{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-2.5 h-4 w-4 text-zinc-400" />
    </div>
  );
}

export default function ContentPage() {
  const searchParams = useSearchParams();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [activeStatus, setActiveStatus] = useState<StatusTab>("all");
  const [tableKey, setTableKey] = useState(0);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<CreateForm>(DEFAULT_FORM);
  const [slugAutoGen, setSlugAutoGen] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [categories, setCategories] = useState<CategoryOption[]>([]);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Pre-fill from ?headline=&excerpt= (set by Story Leads "Use story" button)
  useEffect(() => {
    const headline = searchParams.get("headline");
    if (!headline) return;
    const excerpt = searchParams.get("excerpt") ?? "";
    setForm({ ...DEFAULT_FORM, headline, slug: toSlug(headline), excerpt });
    setSlugAutoGen(false);
    setShowCreate(true);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(search), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [search]);

  const queryParams = useMemo(
    () => ({ q: debouncedSearch || undefined, status: activeStatus === "all" ? undefined : activeStatus }),
    [debouncedSearch, activeStatus],
  );

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/categories");
      if (!res.ok) return;
      const json = await res.json();
      setCategories((json.data as { categories: CategoryOption[] }).categories ?? []);
    } catch { /* non-critical */ }
  }, []);

  useEffect(() => { void fetchCategories(); }, [fetchCategories]);

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
    if (form.headline.trim().length < 8) {
      setCreateError("Headline must be at least 8 characters.");
      return;
    }
    setIsCreating(true);
    setCreateError(null);

    const parsedTags = form.tags.split(",").map((t) => t.trim()).filter(Boolean);

    try {
      const res = await fetch("/api/admin/articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          headline: form.headline,
          slug: form.slug,
          excerpt: form.excerpt || undefined,
          body: form.body,
          status: form.status,
          categoryId: form.categoryId || undefined,
          breaking: form.breaking,
          seoTitle: form.seoTitle || undefined,
          seoDescription: form.seoDescription || undefined,
          tags: parsedTags,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        setCreateError((json as { error?: string }).error ?? `HTTP ${res.status}`);
        return;
      }

      closeCreate();
      setTableKey((k) => k + 1);
    } catch {
      setCreateError("Network error. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-white">Articles</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
            Create, schedule, publish, and archive stories.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          New article
        </Button>
      </section>

      <Card>
        <CardContent className="pt-5 pb-0">
          <div className="relative mb-4">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by headline or tag…"
              className="h-9 w-full rounded-md border border-white/10 bg-zinc-900 pl-9 pr-9 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-white/25 sm:max-w-sm"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-3 top-2.5 text-zinc-500 hover:text-zinc-300"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex gap-1 overflow-x-auto border-b border-white/10">
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

      <Card>
        <CardHeader>
          <CardTitle>All articles</CardTitle>
          <CardDescription>
            {activeStatus === "all" ? "Showing all statuses" : `Status: ${activeStatus}`}
            {debouncedSearch ? ` · "${debouncedSearch}"` : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ArticleTable key={tableKey} queryParams={queryParams} />
        </CardContent>
      </Card>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm">
          <div className="my-8 w-full max-w-xl rounded-lg border border-white/10 bg-zinc-950 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 p-5">
              <h2 className="text-base font-semibold text-white">New article</h2>
              <Button variant="ghost" className="h-8 w-8 px-0" onClick={closeCreate}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-4 p-5">
              {createError && (
                <p className="rounded-md border border-red-400/20 bg-red-400/10 px-3 py-2 text-sm text-red-300">
                  {createError}
                </p>
              )}

              <label className="block text-sm font-medium text-zinc-300">
                Headline <span className="text-red-400">*</span>
                <Input
                  className="mt-2"
                  placeholder="At least 8 characters"
                  value={form.headline}
                  onChange={(e) => handleHeadlineChange(e.target.value)}
                />
              </label>

              <label className="block text-sm font-medium text-zinc-300">
                Slug <span className="text-red-400">*</span>
                <div className="relative mt-2">
                  <Input
                    className="font-mono"
                    placeholder="auto-generated"
                    value={form.slug}
                    onChange={(e) => handleSlugChange(e.target.value)}
                  />
                  {!slugAutoGen && (
                    <button
                      type="button"
                      className="absolute right-2.5 top-2 text-xs text-zinc-500 hover:text-zinc-300"
                      onClick={() => { setSlugAutoGen(true); patchForm({ slug: toSlug(form.headline) }); }}
                    >
                      reset
                    </button>
                  )}
                </div>
              </label>

              <label className="block text-sm font-medium text-zinc-300">
                Excerpt
                <Textarea
                  className="mt-2 min-h-14"
                  placeholder="One-line summary shown in feed"
                  value={form.excerpt}
                  onChange={(e) => patchForm({ excerpt: e.target.value })}
                />
              </label>

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

              <label className="flex cursor-pointer items-center gap-3 text-sm font-medium text-zinc-300">
                <input
                  type="checkbox"
                  checked={form.breaking}
                  onChange={(e) => patchForm({ breaking: e.target.checked })}
                  className="h-4 w-4 rounded border-white/20 bg-zinc-900 accent-white"
                />
                Breaking news
              </label>

              <label className="block text-sm font-medium text-zinc-300">
                Tags
                <Input
                  className="mt-2"
                  placeholder="OpenAI, Enterprise AI (comma-separated)"
                  value={form.tags}
                  onChange={(e) => patchForm({ tags: e.target.value })}
                />
              </label>
            </div>

            <div className="flex justify-end gap-2 border-t border-white/10 p-5">
              <Button variant="secondary" onClick={closeCreate} disabled={isCreating}>
                Cancel
              </Button>
              <Button onClick={() => void handleCreate()} disabled={isCreating}>
                {isCreating ? "Creating…" : "Create article"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
