"use client";

import { useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const DEFAULT_COLUMNS = [
  { id: "leads", name: "Leads", color: "#6366f1" },
  { id: "in-progress", name: "In Progress", color: "#f59e0b" },
  { id: "verified", name: "Verified", color: "#10b981" },
  { id: "needs-review", name: "Needs Review", color: "#ef4444" },
  { id: "dead-ends", name: "Dead Ends", color: "#6b7280" },
];

type Params = { params: Promise<{ id: string }> };

export default function NewBoardPage({ params }: Params) {
  const { id } = use(params);
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    description: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`/api/investigations/${id}/board`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          description: form.description || undefined,
          columns: DEFAULT_COLUMNS,
        }),
      });

      const data = (await res.json()) as { data?: { board: { id: string } }; error?: string };
      if (!res.ok) { setError(data.error ?? "Failed"); return; }

      const boardId = data.data?.board.id;
      if (boardId) router.push(`/investigate/${id}/board/${boardId}`);
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-paper">
      <div className="max-w-xl mx-auto px-4 py-12">
        <div className="mb-8">
          <Link href={`/investigate/${id}`} className="text-sm text-ink/50 hover:text-ink mb-4 block">← Investigation</Link>
          <h1 className="font-instrument text-2xl text-ink">New research board</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink/80 mb-1">Board name *</label>
            <input
              type="text"
              required
              minLength={1}
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Financial links, Witnesses, Document timeline"
              className="w-full border border-ink/20 rounded-xl px-4 py-3 bg-paper text-ink placeholder:text-ink/40 focus:outline-none focus:border-ink/40"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink/80 mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="What will this board track?"
              rows={2}
              className="w-full border border-ink/20 rounded-xl px-4 py-2.5 bg-paper text-ink placeholder:text-ink/40 focus:outline-none focus:border-ink/40 text-sm resize-none"
            />
          </div>

          <div className="border border-ink/10 rounded-xl p-4">
            <div className="text-xs text-ink/50 mb-2">Default columns</div>
            <div className="flex flex-wrap gap-2">
              {DEFAULT_COLUMNS.map((col) => (
                <div key={col.id} className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg bg-ink/5 border border-ink/10">
                  <span className="w-2 h-2 rounded-full" style={{ background: col.color }} />
                  {col.name}
                </div>
              ))}
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading || !form.name}
            className="w-full bg-ink text-paper py-3 rounded-xl font-medium hover:bg-ink/90 disabled:opacity-50"
          >
            {loading ? "Creating…" : "Create board →"}
          </button>
        </form>
      </div>
    </div>
  );
}
