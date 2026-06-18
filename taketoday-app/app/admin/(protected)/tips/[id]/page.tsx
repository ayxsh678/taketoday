"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { TipStatus, TipCategory } from "@prisma/client";
import { FlaskConical, MessageSquare } from "lucide-react";

type Comment = {
  id: string;
  comment: string;
  createdAt: string;
  editor: { name: string; email: string };
};

type Investigation = {
  id: string;
  title: string;
  status: string;
  createdAt: string;
};

type Tip = {
  id: string;
  title: string;
  summary: string;
  category: TipCategory;
  sourceType: string | null;
  anonymous: boolean;
  contactEmail: string | null;
  evidenceLinks: string[];
  status: TipStatus;
  assignedEditor: string | null;
  createdAt: string;
  comments: Comment[];
  investigation: Investigation | null;
};

const STATUS_OPTIONS: TipStatus[] = ["NEW", "UNDER_REVIEW", "INVESTIGATING", "PUBLISHED", "REJECTED"];

const STATUS_LABELS: Record<TipStatus, string> = {
  NEW: "New",
  UNDER_REVIEW: "Under Review",
  INVESTIGATING: "Investigating",
  PUBLISHED: "Published",
  REJECTED: "Rejected",
};

export default function AdminTipDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [tip, setTip] = useState<Tip | null>(null);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [commentSaving, setCommentSaving] = useState(false);
  const [statusSaving, setStatusSaving] = useState(false);
  const [investigateSaving, setInvestigateSaving] = useState(false);
  const [assignedEditor, setAssignedEditor] = useState("");

  async function fetchTip() {
    const res = await fetch(`/api/admin/tips/${id}`);
    const json = await res.json();
    if (json.ok) {
      setTip(json.data.tip);
      setAssignedEditor(json.data.tip.assignedEditor ?? "");
    }
  }

  useEffect(() => {
    setLoading(true);
    fetchTip().finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function updateStatus(status: TipStatus) {
    setStatusSaving(true);
    await fetch(`/api/admin/tips/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    await fetchTip();
    setStatusSaving(false);
  }

  async function updateAssignedEditor() {
    await fetch(`/api/admin/tips/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assignedEditor: assignedEditor || null }),
    });
    await fetchTip();
  }

  async function addComment() {
    if (!newComment.trim()) return;
    setCommentSaving(true);
    await fetch(`/api/admin/tips/${id}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ comment: newComment.trim() }),
    });
    setNewComment("");
    await fetchTip();
    setCommentSaving(false);
  }

  async function convertToInvestigation() {
    setInvestigateSaving(true);
    await fetch(`/api/admin/tips/${id}/investigate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    await fetchTip();
    setInvestigateSaving(false);
  }

  if (loading || !tip) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-8 rounded animate-pulse" style={{ background: "var(--adm-surface-2)" }} />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link href="/admin/tips" className="text-xs mb-2 block" style={{ color: "var(--adm-text-3)" }}>
          ← Tips
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight" style={{ color: "var(--adm-text-1)" }}>
              {tip.title}
            </h1>
            <p className="mt-1 text-xs" style={{ color: "var(--adm-text-3)" }}>
              {tip.category.replace("_", " ")} ·{" "}
              {tip.anonymous ? "Anonymous submission" : tip.contactEmail ?? "No contact"} ·{" "}
              {new Date(tip.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
            </p>
          </div>

          {!tip.investigation && (
            <button
              type="button"
              disabled={investigateSaving}
              onClick={() => void convertToInvestigation()}
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-white transition-colors disabled:opacity-50 shrink-0"
              style={{ background: "var(--adm-accent-purple)" }}
            >
              <FlaskConical className="h-4 w-4" />
              {investigateSaving ? "Opening…" : "Open investigation"}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main content */}
        <div className="lg:col-span-8 space-y-6">
          {/* Summary */}
          <div className="rounded-lg p-5 space-y-3" style={{ background: "var(--adm-surface-1)", border: "1px solid var(--adm-border)" }}>
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--adm-text-3)" }}>
              Tip summary
            </p>
            <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "var(--adm-text-1)" }}>
              {tip.summary}
            </p>
            {tip.sourceType && (
              <p className="text-xs" style={{ color: "var(--adm-text-3)" }}>
                Source type: <span style={{ color: "var(--adm-text-2)" }}>{tip.sourceType}</span>
              </p>
            )}
            {tip.evidenceLinks.length > 0 && (
              <div>
                <p className="text-xs mb-1" style={{ color: "var(--adm-text-3)" }}>Evidence links:</p>
                <ul className="space-y-1">
                  {tip.evidenceLinks.map((link) => (
                    <li key={link}>
                      <a
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs break-all underline"
                        style={{ color: "var(--adm-accent-blue)" }}
                      >
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Investigation info */}
          {tip.investigation && (
            <div className="rounded-lg p-4 space-y-2" style={{ background: "rgba(168,85,247,0.06)", border: "1px solid rgba(168,85,247,0.2)" }}>
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--adm-accent-purple)" }}>
                Investigation open
              </p>
              <p className="text-sm font-medium" style={{ color: "var(--adm-text-1)" }}>{tip.investigation.title}</p>
              <p className="text-xs font-mono" style={{ color: "var(--adm-text-3)" }}>
                Status: {tip.investigation.status} · Opened {new Date(tip.investigation.createdAt).toLocaleDateString()}
              </p>
            </div>
          )}

          {/* Comments */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" style={{ color: "var(--adm-text-3)" }} />
              <h2 className="text-sm font-semibold" style={{ color: "var(--adm-text-1)" }}>
                Internal notes ({tip.comments.length})
              </h2>
            </div>

            {tip.comments.length === 0 ? (
              <p className="text-xs" style={{ color: "var(--adm-text-3)" }}>No notes yet.</p>
            ) : (
              <div className="space-y-3">
                {tip.comments.map((c) => (
                  <div key={c.id} className="rounded-lg p-3 space-y-1" style={{ background: "var(--adm-surface-1)", border: "1px solid var(--adm-border)" }}>
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium" style={{ color: "var(--adm-text-2)" }}>{c.editor.name}</p>
                      <p className="text-[10px] font-mono" style={{ color: "var(--adm-text-3)" }}>
                        {new Date(c.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                    <p className="text-sm leading-relaxed" style={{ color: "var(--adm-text-1)" }}>{c.comment}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Add comment */}
            <div className="space-y-2">
              <textarea
                rows={3}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add internal note…"
                className="w-full resize-none rounded-md px-3 py-2 text-sm outline-none"
                style={{
                  background: "var(--adm-surface-2)",
                  border: "1px solid var(--adm-border)",
                  color: "var(--adm-text-1)",
                }}
              />
              <button
                type="button"
                disabled={commentSaving || !newComment.trim()}
                onClick={() => void addComment()}
                className="rounded-md px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
                style={{ background: "var(--adm-accent-blue)" }}
              >
                {commentSaving ? "Saving…" : "Add note"}
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <aside className="lg:col-span-4 space-y-4">
          {/* Status */}
          <div className="rounded-lg p-4 space-y-3" style={{ background: "var(--adm-surface-1)", border: "1px solid var(--adm-border)" }}>
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--adm-text-3)" }}>
              Status
            </p>
            <div className="space-y-1.5">
              {STATUS_OPTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  disabled={statusSaving || tip.status === s}
                  onClick={() => void updateStatus(s)}
                  className="w-full rounded px-3 py-2 text-xs font-medium text-left transition-colors disabled:opacity-60"
                  style={{
                    background: tip.status === s ? "var(--adm-accent-blue)" : "transparent",
                    color: tip.status === s ? "#fff" : "var(--adm-text-2)",
                    border: `1px solid ${tip.status === s ? "var(--adm-accent-blue)" : "var(--adm-border)"}`,
                  }}
                >
                  {STATUS_LABELS[s]}
                </button>
              ))}
            </div>
          </div>

          {/* Assign editor */}
          <div className="rounded-lg p-4 space-y-3" style={{ background: "var(--adm-surface-1)", border: "1px solid var(--adm-border)" }}>
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--adm-text-3)" }}>
              Assigned editor
            </p>
            <input
              value={assignedEditor}
              onChange={(e) => setAssignedEditor(e.target.value)}
              placeholder="Editor name or email"
              className="w-full rounded px-3 py-1.5 text-xs outline-none"
              style={{
                background: "var(--adm-surface-2)",
                border: "1px solid var(--adm-border)",
                color: "var(--adm-text-1)",
              }}
            />
            <button
              type="button"
              onClick={() => void updateAssignedEditor()}
              className="rounded px-3 py-1.5 text-xs font-medium text-white"
              style={{ background: "var(--adm-accent-blue)" }}
            >
              Save
            </button>
          </div>

          {/* Metadata */}
          <div className="rounded-lg p-4 space-y-2" style={{ background: "var(--adm-surface-1)", border: "1px solid var(--adm-border)" }}>
            <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--adm-text-3)" }}>
              Metadata
            </p>
            <dl className="space-y-2 text-xs">
              {[
                ["Category", tip.category.replace("_", " ")],
                ["Anonymous", tip.anonymous ? "Yes" : "No"],
                ["Contact", tip.contactEmail ?? "—"],
                ["Received", new Date(tip.createdAt).toLocaleDateString()],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between gap-2">
                  <dt style={{ color: "var(--adm-text-3)" }}>{label}</dt>
                  <dd style={{ color: "var(--adm-text-1)" }}>{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </aside>
      </div>
    </div>
  );
}
