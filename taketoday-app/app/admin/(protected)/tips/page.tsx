"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { TipStatus, TipCategory } from "@prisma/client";
import { ChevronRight } from "lucide-react";

type Tip = {
  id: string;
  title: string;
  category: TipCategory;
  status: TipStatus;
  anonymous: boolean;
  assignedEditor: string | null;
  createdAt: string;
  _count: { comments: number };
  investigation: { id: string; status: string } | null;
};

const TIP_STATUS_CONFIG: Record<TipStatus, { label: string; color: string }> = {
  NEW: { label: "New", color: "var(--adm-accent-blue)" },
  UNDER_REVIEW: { label: "Under Review", color: "var(--adm-accent-amber)" },
  INVESTIGATING: { label: "Investigating", color: "var(--adm-accent-purple)" },
  PUBLISHED: { label: "Published", color: "var(--adm-accent-green)" },
  REJECTED: { label: "Rejected", color: "var(--adm-accent-red)" },
};

const STATUS_FILTERS = [
  { value: "", label: "All" },
  { value: "NEW", label: "New" },
  { value: "UNDER_REVIEW", label: "Under Review" },
  { value: "INVESTIGATING", label: "Investigating" },
  { value: "PUBLISHED", label: "Published" },
  { value: "REJECTED", label: "Rejected" },
];

export default function AdminTipsPage() {
  const [tips, setTips] = useState<Tip[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page) });
    if (statusFilter) params.set("status", statusFilter);

    fetch(`/api/admin/tips?${params}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.ok) {
          setTips(json.data.tips);
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
            Story Tips
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--adm-text-2)" }}>
            {total} tip{total !== 1 ? "s" : ""} received
          </p>
        </div>
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
              {["Title", "Category", "Status", "Anon", "Assigned", "Comments", "Received", ""].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--adm-text-3)" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 8 }).map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 w-20 rounded animate-pulse" style={{ background: "var(--adm-surface-2)" }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : tips.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-sm" style={{ color: "var(--adm-text-3)" }}>
                  No tips found.
                </td>
              </tr>
            ) : (
              tips.map((t) => {
                const statusCfg = TIP_STATUS_CONFIG[t.status];
                return (
                  <tr key={t.id} className="transition-colors hover:bg-white/3 border-b" style={{ borderColor: "var(--adm-border-dim)" }}>
                    <td className="px-4 py-3 max-w-[220px]">
                      <p className="font-medium truncate" style={{ color: "var(--adm-text-1)" }}>{t.title}</p>
                      {t.investigation && (
                        <p className="text-[10px] mt-0.5" style={{ color: "var(--adm-accent-purple)" }}>
                          ● Investigation open
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: "var(--adm-text-2)" }}>
                      {t.category.replace("_", " ")}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
                        style={{ color: statusCfg.color, background: `${statusCfg.color}18`, border: `1px solid ${statusCfg.color}33` }}
                      >
                        {statusCfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs font-mono" style={{ color: "var(--adm-text-3)" }}>
                      {t.anonymous ? "Yes" : "No"}
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: "var(--adm-text-2)" }}>
                      {t.assignedEditor ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-xs font-mono" style={{ color: "var(--adm-text-2)" }}>
                      {t._count.comments}
                    </td>
                    <td className="px-4 py-3 text-xs font-mono" style={{ color: "var(--adm-text-2)" }}>
                      {new Date(t.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/tips/${t.id}`}
                        className="inline-flex items-center gap-1 text-xs transition-colors"
                        style={{ color: "var(--adm-accent-blue)" }}
                      >
                        Review <ChevronRight className="h-3 w-3" />
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm" style={{ color: "var(--adm-text-2)" }}>
          <span>Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            <button type="button" disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="rounded px-3 py-1.5 text-xs disabled:opacity-40" style={{ border: "1px solid var(--adm-border)" }}>Previous</button>
            <button type="button" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)} className="rounded px-3 py-1.5 text-xs disabled:opacity-40" style={{ border: "1px solid var(--adm-border)" }}>Next</button>
          </div>
        </div>
      )}
    </div>
  );
}
