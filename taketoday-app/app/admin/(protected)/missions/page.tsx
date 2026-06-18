"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MissionStatus, MissionDifficulty } from "@prisma/client";
import { MissionStatusBadge } from "@/components/missions/MissionStatusBadge";
import { MissionDifficultyBadge } from "@/components/missions/MissionDifficultyBadge";
import { Plus, ChevronRight } from "lucide-react";

type Mission = {
  id: string;
  title: string;
  category: string;
  difficulty: MissionDifficulty;
  pointsReward: number;
  status: MissionStatus;
  deadline: string | null;
  createdAt: string;
  createdBy: { name: string; email: string } | null;
  _count: { submissions: number };
};

const STATUS_FILTERS = [
  { value: "", label: "All" },
  { value: "OPEN", label: "Open" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "COMPLETED", label: "Completed" },
  { value: "ARCHIVED", label: "Archived" },
];

export default function AdminMissionsPage() {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page) });
    if (statusFilter) params.set("status", statusFilter);

    fetch(`/api/admin/missions?${params}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.ok) {
          setMissions(json.data.missions);
          setTotal(json.data.total);
        }
      })
      .finally(() => setLoading(false));
  }, [page, statusFilter]);

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight" style={{ color: "var(--adm-text-1)" }}>
            Missions
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--adm-text-2)" }}>
            {total} mission{total !== 1 ? "s" : ""} total
          </p>
        </div>
        <Link
          href="/admin/missions/create"
          className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-white transition-colors"
          style={{ background: "var(--adm-accent-blue)" }}
        >
          <Plus className="h-4 w-4" />
          New mission
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => { setStatusFilter(value); setPage(1); }}
            className="rounded-full px-3 py-1 text-xs font-medium transition-colors"
            style={{
              background: statusFilter === value ? "var(--adm-accent-blue)" : "var(--adm-surface-2)",
              color: statusFilter === value ? "#fff" : "var(--adm-text-2)",
              border: "1px solid var(--adm-border)",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg" style={{ border: "1px solid var(--adm-border)" }}>
        <table className="min-w-full text-sm">
          <thead style={{ borderBottom: "1px solid var(--adm-border)", background: "var(--adm-surface-2)" }}>
            <tr>
              {["Title", "Category", "Difficulty", "Status", "Submissions", "Deadline", ""].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--adm-text-3)" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y" style={{ divideColor: "var(--adm-border-dim)" } as React.CSSProperties}>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 7 }).map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 w-24 rounded animate-pulse" style={{ background: "var(--adm-surface-2)" }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : missions.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-sm" style={{ color: "var(--adm-text-3)" }}>
                  No missions found.{" "}
                  <Link href="/admin/missions/create" className="underline" style={{ color: "var(--adm-accent-blue)" }}>
                    Create one
                  </Link>
                </td>
              </tr>
            ) : (
              missions.map((m) => (
                <tr key={m.id} className="transition-colors hover:bg-white/3">
                  <td className="px-4 py-3 max-w-[220px]">
                    <p className="font-medium truncate" style={{ color: "var(--adm-text-1)" }}>{m.title}</p>
                    <p className="text-[11px] mt-0.5" style={{ color: "var(--adm-text-3)" }}>
                      by {m.createdBy?.name ?? "—"}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: "var(--adm-text-2)" }}>{m.category}</td>
                  <td className="px-4 py-3">
                    <MissionDifficultyBadge difficulty={m.difficulty} showPoints />
                  </td>
                  <td className="px-4 py-3">
                    <MissionStatusBadge status={m.status} />
                  </td>
                  <td className="px-4 py-3 text-xs font-mono" style={{ color: "var(--adm-text-2)" }}>
                    {m._count.submissions}
                  </td>
                  <td className="px-4 py-3 text-xs font-mono" style={{ color: "var(--adm-text-2)" }}>
                    {m.deadline
                      ? new Date(m.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/missions/${m.id}`}
                      className="inline-flex items-center gap-1 text-xs transition-colors"
                      style={{ color: "var(--adm-accent-blue)" }}
                    >
                      Manage <ChevronRight className="h-3 w-3" />
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm" style={{ color: "var(--adm-text-2)" }}>
          <span>Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="rounded px-3 py-1.5 text-xs disabled:opacity-40"
              style={{ border: "1px solid var(--adm-border)" }}
            >
              Previous
            </button>
            <button
              type="button"
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded px-3 py-1.5 text-xs disabled:opacity-40"
              style={{ border: "1px solid var(--adm-border)" }}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
