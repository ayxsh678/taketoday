"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NewInvestigationPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    title: "",
    description: "",
    targetEntity: "",
    isPublic: false,
    tags: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/investigations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          description: form.description || undefined,
          targetEntity: form.targetEntity || undefined,
          isPublic: form.isPublic,
          tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
        }),
      });

      const data = (await res.json()) as { data?: { investigation: { id: string } }; error?: string };

      if (!res.ok) {
        if (res.status === 401) { router.push("/contribute/login?next=/investigate/new"); return; }
        setError(data.error ?? "Failed to create investigation");
        return;
      }

      const id = data.data?.investigation.id;
      if (id) router.push(`/investigate/${id}`);
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-paper">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="mb-8">
          <Link href="/investigate" className="text-sm text-ink/50 hover:text-ink/70 mb-4 block">← Investigations</Link>
          <h1 className="font-instrument text-3xl text-ink mb-2">Start an investigation</h1>
          <p className="text-ink/60 text-sm">Create a private research room. Invite collaborators, upload evidence, build the story.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-ink/80 mb-1">Investigation title *</label>
            <input
              type="text"
              required
              minLength={5}
              maxLength={200}
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="e.g. Shell companies linked to city contracts"
              className="w-full border border-ink/20 rounded-xl px-4 py-3 bg-paper text-ink placeholder:text-ink/40 focus:outline-none focus:border-ink/40 font-instrument text-xl"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink/80 mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="What are you investigating? What do you already know? What do you need to find?"
              rows={4}
              maxLength={2000}
              className="w-full border border-ink/20 rounded-xl px-4 py-3 bg-paper text-ink placeholder:text-ink/40 focus:outline-none focus:border-ink/40 text-sm resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink/80 mb-1">Subject / Target entity</label>
            <input
              type="text"
              value={form.targetEntity}
              onChange={(e) => setForm((f) => ({ ...f, targetEntity: e.target.value }))}
              placeholder="Person, organization, or institution under investigation"
              className="w-full border border-ink/20 rounded-xl px-4 py-3 bg-paper text-ink placeholder:text-ink/40 focus:outline-none focus:border-ink/40 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink/80 mb-1">Tags</label>
            <input
              type="text"
              value={form.tags}
              onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
              placeholder="corruption, finance, government"
              className="w-full border border-ink/20 rounded-xl px-4 py-3 bg-paper text-ink placeholder:text-ink/40 focus:outline-none focus:border-ink/40 text-sm"
            />
          </div>

          <label className="flex items-start gap-3 cursor-pointer p-4 border border-ink/10 rounded-xl hover:bg-ink/2">
            <input
              type="checkbox"
              checked={form.isPublic}
              onChange={(e) => setForm((f) => ({ ...f, isPublic: e.target.checked }))}
              className="mt-0.5"
            />
            <div>
              <div className="text-sm font-medium text-ink">Make public</div>
              <div className="text-xs text-ink/50 mt-0.5">Anyone can view (but not edit without invitation). Good for open investigations.</div>
            </div>
          </label>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading || !form.title}
            className="w-full bg-ink text-paper py-3 rounded-xl font-medium hover:bg-ink/90 disabled:opacity-50"
          >
            {loading ? "Creating room…" : "Create investigation room →"}
          </button>
        </form>
      </div>
    </div>
  );
}
