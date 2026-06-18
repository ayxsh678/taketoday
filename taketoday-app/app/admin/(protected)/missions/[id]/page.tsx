"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { MissionStatus, MissionDifficulty, SubmissionStatus } from "@prisma/client";
import { MissionStatusBadge } from "@/components/missions/MissionStatusBadge";
import { MissionDifficultyBadge } from "@/components/missions/MissionDifficultyBadge";
import { CheckCircle, XCircle, ExternalLink } from "lucide-react";
import { BONUS_OPTIONS } from "@/lib/missions";

type Submission = {
  id: string;
  submitterEmail: string;
  submitterName: string | null;
  submissionText: string;
  status: SubmissionStatus;
  reviewNotes: string | null;
  bonusPoints: number;
  submittedAt: string;
  reviewedAt: string | null;
  reviewedBy: { name: string } | null;
};

type Mission = {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: MissionDifficulty;
  pointsReward: number;
  status: MissionStatus;
  deadline: string | null;
  createdBy: { name: string; email: string } | null;
  _count: { submissions: number };
};

const STATUS_TRANSITIONS: Record<MissionStatus, MissionStatus[]> = {
  OPEN: ["IN_PROGRESS", "ARCHIVED"],
  IN_PROGRESS: ["COMPLETED", "OPEN", "ARCHIVED"],
  COMPLETED: ["ARCHIVED"],
  ARCHIVED: ["OPEN"],
};

export default function AdminMissionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [mission, setMission] = useState<Mission | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [totalSubs, setTotalSubs] = useState(0);
  const [subPage, setSubPage] = useState(1);
  const [subFilter, setSubFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [reviewForm, setReviewForm] = useState({ status: "APPROVED", notes: "", bonus: 0 });
  const [saving, setSaving] = useState(false);
  const [statusSaving, setStatusSaving] = useState(false);

  async function fetchMission() {
    const res = await fetch(`/api/admin/missions/${id}`);
    const json = await res.json();
    if (json.ok) setMission(json.data.mission);
  }

  async function fetchSubmissions() {
    const params = new URLSearchParams({ page: String(subPage) });
    if (subFilter) params.set("status", subFilter);
    const res = await fetch(`/api/admin/missions/${id}/submissions?${params}`);
    const json = await res.json();
    if (json.ok) {
      setSubmissions(json.data.submissions);
      setTotalSubs(json.data.total);
    }
  }

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchMission(), fetchSubmissions()]).finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, subPage, subFilter]);

  async function updateStatus(status: MissionStatus) {
    setStatusSaving(true);
    await fetch(`/api/admin/missions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    await fetchMission();
    setStatusSaving(false);
  }

  async function reviewSubmission(submissionId: string) {
    setSaving(true);
    await fetch(`/api/admin/submissions/${submissionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: reviewForm.status,
        reviewNotes: reviewForm.notes || undefined,
        bonusPoints: reviewForm.bonus,
      }),
    });
    setReviewingId(null);
    await Promise.all([fetchMission(), fetchSubmissions()]);
    setSaving(false);
  }

  if (loading || !mission) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-8 rounded animate-pulse" style={{ background: "var(--adm-surface-2)" }} />
        ))}
      </div>
    );
  }

  const transitions = STATUS_TRANSITIONS[mission.status];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link
              href="/admin/missions"
              className="text-xs"
              style={{ color: "var(--adm-text-3)" }}
            >
              ← Missions
            </Link>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight" style={{ color: "var(--adm-text-1)" }}>
            {mission.title}
          </h1>
          <div className="flex items-center gap-2 mt-2">
            <MissionStatusBadge status={mission.status} />
            <MissionDifficultyBadge difficulty={mission.difficulty} showPoints />
            <span className="text-xs" style={{ color: "var(--adm-text-3)" }}>{mission.category}</span>
          </div>
        </div>
        <Link
          href={`/missions/${id}`}
          target="_blank"
          className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs transition-colors"
          style={{ border: "1px solid var(--adm-border)", color: "var(--adm-text-2)" }}
        >
          Public page <ExternalLink className="h-3 w-3" />
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Submissions */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold" style={{ color: "var(--adm-text-1)" }}>
              Submissions ({totalSubs})
            </h2>
            <div className="flex gap-2">
              {["", "PENDING", "APPROVED", "REJECTED"].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => { setSubFilter(s); setSubPage(1); }}
                  className="rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors"
                  style={{
                    background: subFilter === s ? "var(--adm-accent-blue)" : "var(--adm-surface-2)",
                    color: subFilter === s ? "#fff" : "var(--adm-text-3)",
                    border: "1px solid var(--adm-border-dim)",
                  }}
                >
                  {s || "All"}
                </button>
              ))}
            </div>
          </div>

          {submissions.length === 0 ? (
            <div className="rounded-lg p-8 text-center text-sm" style={{ border: "1px solid var(--adm-border)", color: "var(--adm-text-3)" }}>
              No submissions yet.
            </div>
          ) : (
            <div className="space-y-3">
              {submissions.map((s) => (
                <div key={s.id} className="rounded-lg p-4 space-y-3" style={{ background: "var(--adm-surface-1)", border: "1px solid var(--adm-border)" }}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium" style={{ color: "var(--adm-text-1)" }}>
                        {s.submitterName ?? s.submitterEmail}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: "var(--adm-text-3)" }}>
                        {s.submitterEmail} · {new Date(s.submittedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span
                      className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
                      style={{
                        background:
                          s.status === "APPROVED"
                            ? "rgba(52,211,153,0.10)"
                            : s.status === "REJECTED"
                            ? "rgba(248,113,113,0.10)"
                            : "rgba(251,191,36,0.10)",
                        color:
                          s.status === "APPROVED"
                            ? "var(--adm-accent-green)"
                            : s.status === "REJECTED"
                            ? "var(--adm-accent-red)"
                            : "var(--adm-accent-amber)",
                        border: `1px solid ${
                          s.status === "APPROVED"
                            ? "rgba(52,211,153,0.22)"
                            : s.status === "REJECTED"
                            ? "rgba(248,113,113,0.22)"
                            : "rgba(251,191,36,0.22)"
                        }`,
                      }}
                    >
                      {s.status}
                    </span>
                  </div>

                  <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "var(--adm-text-2)" }}>
                    {s.submissionText}
                  </p>

                  {s.reviewNotes && (
                    <p className="text-xs italic px-3 py-2 rounded" style={{ background: "var(--adm-surface-2)", color: "var(--adm-text-3)" }}>
                      Note: {s.reviewNotes}
                    </p>
                  )}

                  {s.status === "PENDING" && (
                    reviewingId === s.id ? (
                      <div className="space-y-3 pt-2 border-t" style={{ borderColor: "var(--adm-border-dim)" }}>
                        <div className="flex gap-2">
                          {["APPROVED", "REJECTED"].map((st) => (
                            <button
                              key={st}
                              type="button"
                              onClick={() => setReviewForm((f) => ({ ...f, status: st }))}
                              className="flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium transition-colors"
                              style={{
                                background: reviewForm.status === st
                                  ? (st === "APPROVED" ? "rgba(52,211,153,0.15)" : "rgba(248,113,113,0.15)")
                                  : "var(--adm-surface-2)",
                                color: reviewForm.status === st
                                  ? (st === "APPROVED" ? "var(--adm-accent-green)" : "var(--adm-accent-red)")
                                  : "var(--adm-text-2)",
                                border: `1px solid ${reviewForm.status === st
                                  ? (st === "APPROVED" ? "rgba(52,211,153,0.3)" : "rgba(248,113,113,0.3)")
                                  : "var(--adm-border)"}`,
                              }}
                            >
                              {st === "APPROVED" ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                              {st.charAt(0) + st.slice(1).toLowerCase()}
                            </button>
                          ))}
                        </div>

                        {reviewForm.status === "APPROVED" && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs" style={{ color: "var(--adm-text-3)" }}>Bonus:</span>
                            {([0, ...BONUS_OPTIONS] as number[]).map((b) => (
                              <button
                                key={b}
                                type="button"
                                onClick={() => setReviewForm((f) => ({ ...f, bonus: b }))}
                                className="rounded px-2 py-1 text-[11px] font-mono transition-colors"
                                style={{
                                  background: reviewForm.bonus === b ? "var(--adm-accent-amber)" : "var(--adm-surface-2)",
                                  color: reviewForm.bonus === b ? "#000" : "var(--adm-text-2)",
                                  border: "1px solid var(--adm-border)",
                                }}
                              >
                                {b === 0 ? "None" : `+${b}`}
                              </button>
                            ))}
                          </div>
                        )}

                        <input
                          value={reviewForm.notes}
                          onChange={(e) => setReviewForm((f) => ({ ...f, notes: e.target.value }))}
                          placeholder="Review notes (optional)"
                          className="w-full rounded px-3 py-1.5 text-xs outline-none"
                          style={{
                            background: "var(--adm-surface-2)",
                            border: "1px solid var(--adm-border)",
                            color: "var(--adm-text-1)",
                          }}
                        />

                        <div className="flex gap-2">
                          <button
                            type="button"
                            disabled={saving}
                            onClick={() => void reviewSubmission(s.id)}
                            className="rounded px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
                            style={{ background: "var(--adm-accent-blue)" }}
                          >
                            {saving ? "Saving…" : "Confirm"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setReviewingId(null)}
                            className="rounded px-3 py-1.5 text-xs"
                            style={{ color: "var(--adm-text-3)", border: "1px solid var(--adm-border)" }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setReviewingId(s.id);
                          setReviewForm({ status: "APPROVED", notes: "", bonus: 0 });
                        }}
                        className="text-xs font-medium transition-colors"
                        style={{ color: "var(--adm-accent-blue)" }}
                      >
                        Review →
                      </button>
                    )
                  )}
                </div>
              ))}
            </div>
          )}

          {Math.ceil(totalSubs / 20) > 1 && (
            <div className="flex items-center justify-between text-xs" style={{ color: "var(--adm-text-2)" }}>
              <span>Page {subPage} of {Math.ceil(totalSubs / 20)}</span>
              <div className="flex gap-2">
                <button type="button" disabled={subPage === 1} onClick={() => setSubPage((p) => p - 1)} className="rounded px-3 py-1 disabled:opacity-40" style={{ border: "1px solid var(--adm-border)" }}>Previous</button>
                <button type="button" disabled={subPage === Math.ceil(totalSubs / 20)} onClick={() => setSubPage((p) => p + 1)} className="rounded px-3 py-1 disabled:opacity-40" style={{ border: "1px solid var(--adm-border)" }}>Next</button>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside className="lg:col-span-4 space-y-4">
          <div className="rounded-lg p-4 space-y-3" style={{ background: "var(--adm-surface-1)", border: "1px solid var(--adm-border)" }}>
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--adm-text-3)" }}>
              Status
            </p>
            {transitions.map((s) => (
              <button
                key={s}
                type="button"
                disabled={statusSaving}
                onClick={() => void updateStatus(s)}
                className="w-full rounded px-3 py-2 text-xs font-medium text-left transition-colors"
                style={{ border: "1px solid var(--adm-border)", color: "var(--adm-text-2)" }}
              >
                Move to <strong>{s.replace("_", " ")}</strong>
              </button>
            ))}
          </div>

          <div className="rounded-lg p-4 space-y-2" style={{ background: "var(--adm-surface-1)", border: "1px solid var(--adm-border)" }}>
            <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--adm-text-3)" }}>
              Details
            </p>
            <dl className="space-y-2 text-xs">
              {[
                ["Points reward", `+${mission.pointsReward} pts`],
                ["Total submissions", String(mission._count.submissions)],
                ["Category", mission.category],
                ["Created by", mission.createdBy?.name ?? "—"],
                ["Deadline", mission.deadline ? new Date(mission.deadline).toLocaleDateString() : "None"],
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
