"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import TipTapLink from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import {
  ArrowLeft,
  Bold,
  Italic,
  Link2,
  List,
  ListOrdered,
  Quote,
  Underline as UnderlineIcon,
  Strikethrough,
  Heading2,
  Undo,
  Redo,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { SourcesPanel } from "@/components/admin/SourcesPanel";
import type { AdminArticle, WorkflowStatus } from "@/lib/admin/types";

interface Category {
  id: string;
  name: string;
  slug: string;
}

function ToolbarBtn({
  onClick,
  active,
  disabled,
  title,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      disabled={disabled}
      title={title}
      className={[
        "flex h-7 w-7 items-center justify-center rounded text-sm transition-colors",
        active
          ? "bg-white/15 text-white"
          : "text-zinc-400 hover:bg-white/8 hover:text-white",
        disabled ? "pointer-events-none opacity-30" : "",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

const STATUS_OPTIONS: { value: WorkflowStatus; label: string }[] = [
  { value: "draft", label: "Draft" },
  { value: "scheduled", label: "Scheduled" },
  { value: "published", label: "Published" },
  { value: "archived", label: "Archived" },
];

const statusTone = {
  draft: "neutral",
  fact_checking: "amber",
  editorial_review: "blue",
  ready_to_publish: "violet",
  scheduled: "violet",
  published: "green",
  archived: "red",
} as const;

export default function ArticleEditorPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [article, setArticle] = useState<AdminArticle | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [headline, setHeadline] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [status, setStatus] = useState<WorkflowStatus>("draft");
  const [categoryId, setCategoryId] = useState("");
  const [breaking, setBreaking] = useState(false);
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDesc, setSeoDesc] = useState("");

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TipTapLink.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: "Start writing…" }),
    ],
    editorProps: {
      attributes: {
        class: "prose prose-invert prose-zinc max-w-none focus:outline-none min-h-[50vh] px-0",
      },
    },
  });

  useEffect(() => {
    void (async () => {
      try {
        const [artRes, catRes] = await Promise.all([
          fetch(`/api/admin/articles/${id}`),
          fetch("/api/admin/categories"),
        ]);
        if (!artRes.ok) throw new Error(`HTTP ${artRes.status}`);
        const artJson = await artRes.json();
        const art = (artJson.data as { article: AdminArticle }).article;
        setArticle(art);
        setHeadline(art.headline);
        setExcerpt(art.excerpt ?? "");
        setStatus(art.status);
        setCategoryId(art.categoryId ?? "");
        setBreaking(art.breaking);
        setSeoTitle(art.seoTitle ?? "");
        setSeoDesc(art.seoDescription ?? "");

        if (catRes.ok) {
          const catJson = await catRes.json();
          setCategories((catJson.data as { categories: Category[] }).categories ?? []);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load article");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  useEffect(() => {
    if (editor && article?.body !== undefined && !editor.isDestroyed) {
      editor.commands.setContent(article.body ?? "");
    }
  }, [editor, article]);

  const save = useCallback(async (overrideStatus?: WorkflowStatus) => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/articles/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          headline,
          body: editor?.getHTML() ?? "",
          excerpt: excerpt || undefined,
          status: overrideStatus ?? status,
          breaking,
          seoTitle: seoTitle || undefined,
          seoDescription: seoDesc || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error((json as { error?: string }).error ?? `HTTP ${res.status}`);
      const updated = (json.data as { article: AdminArticle }).article;
      setStatus(updated.status);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }, [id, headline, excerpt, status, breaking, seoTitle, seoDesc, editor]);

  const handleDelete = useCallback(async () => {
    if (!confirm("Delete this article? This cannot be undone.")) return;
    try {
      const res = await fetch(`/api/admin/articles/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      router.push("/admin/content");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  }, [id, router]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        void save();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [save]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-zinc-500">
        Loading…
      </div>
    );
  }

  if (error && !article) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <p className="text-red-400">{error}</p>
        <Link href="/admin/content">
          <Button variant="secondary">Back to articles</Button>
        </Link>
      </div>
    );
  }

  const isPublished = status === "published";

  return (
    <div className="flex min-h-screen flex-col">
      {/* top bar */}
      <div
        className="sticky top-14 z-10 flex items-center justify-between gap-4 px-4 py-2.5 sm:px-6"
        style={{
          background: "var(--adm-header-bg)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid var(--adm-border-dim)",
        }}
      >
        <div className="flex items-center gap-3">
          <Link href="/admin/content">
            <Button variant="ghost" className="h-8 w-8 px-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <span className="text-sm font-medium" style={{ color: "var(--adm-text-2)" }}>
            {article?.slug}
          </span>
          <Badge tone={statusTone[status]}>{status}</Badge>
        </div>

        <div className="flex items-center gap-2">
          {error && <span className="text-xs text-red-400">{error}</span>}
          {saved && <span className="text-xs text-emerald-400">Saved</span>}

          <Button
            variant="ghost"
            className="h-8 gap-1.5 px-3 text-sm"
            onClick={() => window.open(`/article/${article?.slug}`, "_blank", "noopener,noreferrer")}
          >
            <Eye className="h-3.5 w-3.5" />
            Preview
          </Button>

          {isPublished ? (
            <Button
              variant="secondary"
              className="h-8 px-3 text-sm"
              onClick={() => void save("draft")}
              disabled={saving}
            >
              {saving ? "…" : "Unpublish"}
            </Button>
          ) : (
            <Button
              className="h-8 px-3 text-sm bg-emerald-600 hover:bg-emerald-700 text-white border-0"
              onClick={() => void save("published")}
              disabled={saving}
            >
              {saving ? "Publishing…" : "Publish"}
            </Button>
          )}

          <Button
            className="h-8 px-3 text-sm"
            onClick={() => void save()}
            disabled={saving}
          >
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>

      {/* layout */}
      <div className="flex flex-1 gap-0">
        {/* editor area */}
        <div className="flex-1 overflow-y-auto px-4 py-8 sm:px-8 lg:px-16">
          <input
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            placeholder="Headline"
            className="mb-6 w-full bg-transparent text-3xl font-bold leading-tight text-white outline-none placeholder:text-zinc-600 sm:text-4xl"
          />

          {/* TipTap toolbar */}
          <div
            className="mb-4 flex flex-wrap items-center gap-0.5 rounded-lg p-1.5"
            style={{
              background: "var(--adm-surface-2)",
              border: "1px solid var(--adm-border)",
            }}
          >
            <ToolbarBtn
              onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
              active={editor?.isActive("heading", { level: 2 })}
              title="Heading"
            >
              <Heading2 className="h-3.5 w-3.5" />
            </ToolbarBtn>
            <ToolbarBtn
              onClick={() => editor?.chain().focus().toggleBold().run()}
              active={editor?.isActive("bold")}
              title="Bold (⌘B)"
            >
              <Bold className="h-3.5 w-3.5" />
            </ToolbarBtn>
            <ToolbarBtn
              onClick={() => editor?.chain().focus().toggleItalic().run()}
              active={editor?.isActive("italic")}
              title="Italic (⌘I)"
            >
              <Italic className="h-3.5 w-3.5" />
            </ToolbarBtn>
            <ToolbarBtn
              onClick={() => editor?.chain().focus().toggleUnderline().run()}
              active={editor?.isActive("underline")}
              title="Underline (⌘U)"
            >
              <UnderlineIcon className="h-3.5 w-3.5" />
            </ToolbarBtn>
            <ToolbarBtn
              onClick={() => editor?.chain().focus().toggleStrike().run()}
              active={editor?.isActive("strike")}
              title="Strikethrough"
            >
              <Strikethrough className="h-3.5 w-3.5" />
            </ToolbarBtn>
            <div className="mx-1 h-4 w-px bg-white/10" />
            <ToolbarBtn
              onClick={() => editor?.chain().focus().toggleBulletList().run()}
              active={editor?.isActive("bulletList")}
              title="Bullet list"
            >
              <List className="h-3.5 w-3.5" />
            </ToolbarBtn>
            <ToolbarBtn
              onClick={() => editor?.chain().focus().toggleOrderedList().run()}
              active={editor?.isActive("orderedList")}
              title="Numbered list"
            >
              <ListOrdered className="h-3.5 w-3.5" />
            </ToolbarBtn>
            <ToolbarBtn
              onClick={() => editor?.chain().focus().toggleBlockquote().run()}
              active={editor?.isActive("blockquote")}
              title="Blockquote"
            >
              <Quote className="h-3.5 w-3.5" />
            </ToolbarBtn>
            <div className="mx-1 h-4 w-px bg-white/10" />
            <ToolbarBtn
              onClick={() => {
                const url = window.prompt("URL");
                if (url) editor?.chain().focus().setLink({ href: url }).run();
              }}
              active={editor?.isActive("link")}
              title="Add link"
            >
              <Link2 className="h-3.5 w-3.5" />
            </ToolbarBtn>
            <div className="mx-1 h-4 w-px bg-white/10" />
            <ToolbarBtn
              onClick={() => editor?.chain().focus().undo().run()}
              disabled={!editor?.can().undo()}
              title="Undo (⌘Z)"
            >
              <Undo className="h-3.5 w-3.5" />
            </ToolbarBtn>
            <ToolbarBtn
              onClick={() => editor?.chain().focus().redo().run()}
              disabled={!editor?.can().redo()}
              title="Redo (⌘⇧Z)"
            >
              <Redo className="h-3.5 w-3.5" />
            </ToolbarBtn>
          </div>

          <EditorContent editor={editor} />
        </div>

        {/* sidebar */}
        <aside
          className="hidden w-72 shrink-0 overflow-y-auto p-5 xl:block"
          style={{
            borderLeft: "1px solid var(--adm-border-dim)",
            background: "var(--adm-surface-1)",
          }}
        >
          <div className="space-y-5">
            {/* status */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--adm-text-3)" }}>
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as WorkflowStatus)}
                className="h-9 w-full appearance-none rounded-md border border-white/10 bg-zinc-900 px-3 text-sm text-white outline-none focus:border-white/25"
              >
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            {/* category */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--adm-text-3)" }}>
                Category
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="h-9 w-full appearance-none rounded-md border border-white/10 bg-zinc-900 px-3 text-sm text-white outline-none focus:border-white/25"
              >
                <option value="">Uncategorized</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* excerpt */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--adm-text-3)" }}>
                Excerpt
              </label>
              <Textarea
                className="min-h-16 text-sm"
                placeholder="One-line summary for feed"
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
              />
            </div>

            {/* breaking */}
            <label className="flex cursor-pointer items-center gap-2.5 text-sm text-zinc-300">
              <input
                type="checkbox"
                checked={breaking}
                onChange={(e) => setBreaking(e.target.checked)}
                className="h-4 w-4 rounded border-white/20 bg-zinc-900 accent-white"
              />
              Breaking news
            </label>

            <div
              className="border-t pt-5"
              style={{ borderColor: "var(--adm-border-dim)" }}
            >
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--adm-text-3)" }}>
                SEO
              </p>
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs" style={{ color: "var(--adm-text-2)" }}>
                    Title <span style={{ color: "var(--adm-text-3)" }}>({seoTitle.length}/70)</span>
                  </label>
                  <Input
                    maxLength={70}
                    value={seoTitle}
                    onChange={(e) => setSeoTitle(e.target.value)}
                    placeholder="SEO title"
                    className="text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs" style={{ color: "var(--adm-text-2)" }}>
                    Description <span style={{ color: "var(--adm-text-3)" }}>({seoDesc.length}/160)</span>
                  </label>
                  <Textarea
                    maxLength={160}
                    value={seoDesc}
                    onChange={(e) => setSeoDesc(e.target.value)}
                    placeholder="Meta description"
                    className="min-h-16 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* sources */}
            <div
              className="border-t pt-5"
              style={{ borderColor: "var(--adm-border-dim)" }}
            >
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--adm-text-3)" }}>
                Sources
              </p>
              <SourcesPanel articleId={id} />
            </div>

            {/* meta */}
            {article && (
              <div
                className="border-t pt-5 text-xs space-y-1.5"
                style={{ borderColor: "var(--adm-border-dim)", color: "var(--adm-text-3)" }}
              >
                <p>Author: <span style={{ color: "var(--adm-text-2)" }}>{article.author}</span></p>
                {article.publishedAt && (
                  <p>Published: <span style={{ color: "var(--adm-text-2)" }}>{new Date(article.publishedAt).toLocaleDateString()}</span></p>
                )}
                <p>Views: <span style={{ color: "var(--adm-text-2)" }}>{article.views.toLocaleString()}</span></p>
              </div>
            )}

            {/* danger zone */}
            <div
              className="border-t pt-5"
              style={{ borderColor: "var(--adm-border-dim)" }}
            >
              <button
                type="button"
                onClick={() => void handleDelete()}
                className="w-full rounded-md border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs font-medium text-red-400 transition hover:bg-red-500/20"
              >
                Delete article
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
