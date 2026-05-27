"use client";

import { useEffect, useState } from "react";
import { Edit3, Plus, Trash2, X, Check } from "lucide-react";
import { AdminMotion } from "@/components/admin/AdminMotion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// ─── types ────────────────────────────────────────────────────────────────────

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isActive: boolean;
  displayOrder: number;
  _count: { articles: number };
}

// ─── component ────────────────────────────────────────────────────────────────

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // create form
  const [newName, setNewName] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // edit modal
  const [editing, setEditing] = useState<{
    id: string;
    name: string;
    description: string;
    displayOrder: number;
  } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // inline delete confirmation
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    void fetchCategories();
  }, []);

  // ─── fetch ────────────────────────────────────────────────────────────────

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/categories");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      // Single query — counts come from _count.articles, no N+1
      setCategories((json.data as { categories: Category[] }).categories ?? []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch categories");
    } finally {
      setLoading(false);
    }
  };

  // ─── create ───────────────────────────────────────────────────────────────

  const handleCreate = async () => {
    if (!newName.trim()) {
      setCreateError("Name is required");
      return;
    }
    setIsCreating(true);
    setCreateError(null);
    try {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim(), slug: newSlug.trim() || undefined }),
      });
      const json = await res.json();
      if (!res.ok) {
        setCreateError((json as { error?: string }).error ?? `HTTP ${res.status}`);
        return;
      }
      const created = (json.data as { category: Category }).category;
      setCategories((prev) => [...prev, created]);
      setNewName("");
      setNewSlug("");
    } catch {
      setCreateError("Failed to create category. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  // Auto-generate slug from name while typing
  const handleNameChange = (value: string) => {
    setNewName(value);
    if (!newSlug) {
      // only auto-fill slug if user hasn't manually set one
    }
  };

  // ─── edit ─────────────────────────────────────────────────────────────────

  const openEdit = (cat: Category) => {
    setEditing({
      id: cat.id,
      name: cat.name,
      description: cat.description ?? "",
      displayOrder: cat.displayOrder,
    });
    setEditError(null);
  };

  const handleSave = async () => {
    if (!editing) return;
    if (!editing.name.trim()) {
      setEditError("Name is required");
      return;
    }
    setIsSaving(true);
    setEditError(null);
    try {
      const res = await fetch(`/api/admin/categories/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editing.name.trim(),
          description: editing.description || null,
          displayOrder: editing.displayOrder,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setEditError((json as { error?: string }).error ?? `HTTP ${res.status}`);
        return;
      }
      const updated = (json.data as { category: Category }).category;
      setCategories((prev) => prev.map((c) => (c.id === editing.id ? updated : c)));
      setEditing(null);
    } catch {
      setEditError("Failed to save. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  // ─── delete ───────────────────────────────────────────────────────────────

  const confirmDelete = async (id: string) => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/categories/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const json = await res.json();
        alert((json as { error?: string }).error ?? "Delete failed");
        return;
      }
      setCategories((prev) => prev.filter((c) => c.id !== id));
      setDeletingId(null);
    } catch {
      alert("Delete failed. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  // ─── render ───────────────────────────────────────────────────────────────

  return (
    <AdminMotion>
      <div className="space-y-6">
        {/* page header */}
        <section>
          <h1 className="text-3xl font-semibold tracking-tight text-white">Categories</h1>
          <p className="mt-2 text-sm leading-6 text-zinc-400">
            Manage editorial taxonomy. Category changes propagate to public navigation immediately.
          </p>
        </section>

        {/* create form */}
        <Card>
          <CardHeader>
            <CardTitle>Add Category</CardTitle>
            <CardDescription>
              Slug auto-generates from name if left blank.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-[1fr_1fr_auto]">
              <div>
                <label className="block text-sm font-medium text-zinc-300">
                  Name
                  <Input
                    className="mt-2"
                    placeholder="e.g. Technology"
                    value={newName}
                    onChange={(e) => handleNameChange(e.target.value)}
                  />
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300">
                  Slug <span className="text-zinc-500">(optional)</span>
                  <Input
                    className="mt-2 font-mono"
                    placeholder="e.g. technology"
                    value={newSlug}
                    onChange={(e) => setNewSlug(e.target.value)}
                  />
                </label>
              </div>
              <div className="flex items-end">
                <Button onClick={() => void handleCreate()} disabled={isCreating}>
                  <Plus className="h-4 w-4" />
                  {isCreating ? "Adding…" : "Add"}
                </Button>
              </div>
            </div>
            {createError && (
              <p className="mt-3 text-sm text-red-400">{createError}</p>
            )}
          </CardContent>
        </Card>

        {/* categories table */}
        <Card>
          <CardHeader>
            <CardTitle>Editorial Taxonomy</CardTitle>
            <CardDescription>
              {loading ? "Loading…" : `${categories.length} categories`}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-hidden rounded-b-lg">
              <table className="w-full text-left text-sm">
                <thead className="bg-white/4 text-xs uppercase text-zinc-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">Category</th>
                    <th className="px-4 py-3 font-medium">Slug</th>
                    <th className="px-4 py-3 font-medium">Stories</th>
                    <th className="px-4 py-3 font-medium">Order</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-zinc-400">
                        Loading categories…
                      </td>
                    </tr>
                  ) : error ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-4 text-center text-red-400">
                        {error}
                      </td>
                    </tr>
                  ) : categories.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-zinc-400">
                        No categories yet. Add one above.
                      </td>
                    </tr>
                  ) : (
                    categories.map((cat) => (
                      <tr key={cat.id} className="hover:bg-white/3">
                        <td className="px-4 py-4 font-medium text-white">{cat.name}</td>
                        <td className="px-4 py-4 font-mono text-xs text-zinc-400">{cat.slug}</td>
                        <td className="px-4 py-4 text-zinc-300">{cat._count.articles}</td>
                        <td className="px-4 py-4 text-zinc-300">{cat.displayOrder}</td>
                        <td className="px-4 py-4">
                          <Badge tone={cat.isActive ? "green" : "amber"}>
                            {cat.isActive ? "active" : "inactive"}
                          </Badge>
                        </td>
                        <td className="px-4 py-4 text-right">
                          {deletingId === cat.id ? (
                            <div className="flex items-center justify-end gap-2">
                              <span className="text-xs text-zinc-400">Confirm delete?</span>
                              <Button
                                variant="danger"
                                className="h-7 px-2 text-xs"
                                onClick={() => void confirmDelete(cat.id)}
                                disabled={isDeleting}
                              >
                                {isDeleting ? "…" : "Delete"}
                              </Button>
                              <Button
                                variant="ghost"
                                className="h-7 px-2 text-xs"
                                onClick={() => setDeletingId(null)}
                                disabled={isDeleting}
                              >
                                Cancel
                              </Button>
                            </div>
                          ) : (
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                className="h-8 w-8 px-0"
                                aria-label={`Edit ${cat.name}`}
                                onClick={() => openEdit(cat)}
                              >
                                <Edit3 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                className="h-8 w-8 px-0 text-red-400 hover:text-red-300"
                                aria-label={`Delete ${cat.name}`}
                                onClick={() => setDeletingId(cat.id)}
                                disabled={cat._count.articles > 0}
                                title={
                                  cat._count.articles > 0
                                    ? `Cannot delete — ${cat._count.articles} article(s) assigned`
                                    : undefined
                                }
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── edit modal ── */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-lg border border-white/10 bg-zinc-950 shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-white/10 p-5">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Edit category
                </p>
                <h2 className="mt-1 text-lg font-semibold text-white">{editing.name}</h2>
              </div>
              <Button
                variant="ghost"
                className="h-8 w-8 px-0"
                aria-label="Close"
                onClick={() => setEditing(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-4 p-5">
              {editError && (
                <p className="rounded-md border border-red-400/20 bg-red-400/10 px-3 py-2 text-sm text-red-300">
                  {editError}
                </p>
              )}
              <label className="block text-sm font-medium text-zinc-300">
                Name
                <Input
                  className="mt-2"
                  value={editing.name}
                  onChange={(e) => setEditing((prev) => prev && { ...prev, name: e.target.value })}
                />
              </label>
              <label className="block text-sm font-medium text-zinc-300">
                Description <span className="text-zinc-500">(optional)</span>
                <Input
                  className="mt-2"
                  value={editing.description}
                  onChange={(e) =>
                    setEditing((prev) => prev && { ...prev, description: e.target.value })
                  }
                />
              </label>
              <label className="block text-sm font-medium text-zinc-300">
                Display order
                <Input
                  className="mt-2"
                  type="number"
                  min={0}
                  value={editing.displayOrder}
                  onChange={(e) =>
                    setEditing((prev) =>
                      prev && { ...prev, displayOrder: parseInt(e.target.value, 10) || 0 },
                    )
                  }
                />
              </label>
            </div>

            <div className="flex justify-end gap-2 border-t border-white/10 p-5">
              <Button variant="secondary" onClick={() => setEditing(null)} disabled={isSaving}>
                Cancel
              </Button>
              <Button onClick={() => void handleSave()} disabled={isSaving}>
                {isSaving ? (
                  "Saving…"
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    Save
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
