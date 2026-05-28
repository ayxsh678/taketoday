import { requireAdmin } from "@/lib/admin/authz";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { WORKFLOW_STAGE_META } from "@/lib/contributor/types";
import type { WorkflowStage } from "@prisma/client";
import Link from "next/link";

const stageOrder: WorkflowStage[] = [
  "SUBMITTED",
  "UNDER_RESEARCH",
  "FACT_CHECK_PENDING",
  "VERIFIED",
  "EDITOR_REVIEW",
  "APPROVED",
  "DISPUTED",
];

export default async function EditorialQueuePage() {
  const access = await requireAdmin("content:read");
  if (!access.ok) redirect("/admin/login");

  const contributions = await prisma.contribution.findMany({
    where: {
      status: { notIn: ["DRAFT", "PUBLISHED", "ARCHIVED", "REJECTED"] },
    },
    orderBy: [{ isBreaking: "desc" }, { createdAt: "asc" }],
    include: {
      author: {
        select: {
          username: true,
          displayName: true,
          isVerifiedJournalist: true,
          reputation: { select: { tier: true } },
        },
      },
      aiAnalysis: {
        select: { biasScore: true, misinformationRisk: true, contentWarnings: true },
      },
      _count: {
        select: { factChecks: true, evidence: true, communityVotes: true },
      },
    },
  });

  // Group by stage
  const byStage = stageOrder.reduce(
    (acc, stage) => {
      acc[stage] = contributions.filter((c) => c.workflowStage === stage);
      return acc;
    },
    {} as Record<WorkflowStage, typeof contributions>,
  );

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">Editorial Queue</h1>
        <p className="text-ink/60 text-sm mt-1">
          Community contributions awaiting editorial processing — {contributions.length} active
        </p>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {stageOrder.map((stage) => {
          const count = byStage[stage]?.length ?? 0;
          const meta = WORKFLOW_STAGE_META[stage];
          return (
            <div key={stage} className="bg-white border border-ink/10 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold text-ink">{count}</div>
              <div className="text-xs text-ink/60 mt-0.5">{meta.label}</div>
            </div>
          );
        })}
      </div>

      {/* Kanban-ish list by stage */}
      <div className="space-y-8">
        {stageOrder.map((stage) => {
          const items = byStage[stage] ?? [];
          if (items.length === 0) return null;
          const meta = WORKFLOW_STAGE_META[stage];

          return (
            <div key={stage}>
              <h2 className="text-sm font-semibold text-ink/70 uppercase tracking-wider mb-3">
                {meta.label} ({items.length})
              </h2>
              <div className="space-y-3">
                {items.map((c) => (
                  <Link
                    key={c.id}
                    href={`/contribute/${c.id}`}
                    className="flex items-start gap-4 bg-white border border-ink/10 rounded-xl p-4 hover:border-ink/25 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="text-xs font-mono text-ink/50">{c.type.replace(/_/g, " ")}</span>
                        {c.isBreaking && (
                          <span className="text-xs font-bold text-red-600">BREAKING</span>
                        )}
                        {c.aiUsageDisclosed && (
                          <span className="text-xs text-blue-600">🤖 AI</span>
                        )}
                      </div>
                      <h3 className="font-medium text-ink leading-snug mb-1 truncate">{c.title}</h3>
                      <div className="flex flex-wrap gap-3 text-xs text-ink/50">
                        <span>@{c.author.username}</span>
                        {c.author.isVerifiedJournalist && <span className="text-blue-500">✓</span>}
                        <span>{c.author.reputation?.tier ?? "NEWCOMER"}</span>
                        <span>{new Date(c.createdAt).toLocaleDateString()}</span>
                        <span>{c._count.factChecks} fact checks</span>
                        <span>{c._count.evidence} evidence</span>
                        <span>{c._count.communityVotes} votes</span>
                      </div>
                    </div>

                    {c.aiAnalysis && (
                      <div className="shrink-0 text-right text-xs space-y-1">
                        {c.aiAnalysis.biasScore !== null && (
                          <div className={`px-2 py-0.5 rounded ${(c.aiAnalysis.biasScore ?? 0) > 60 ? "bg-orange-50 text-orange-700" : "bg-green-50 text-green-700"}`}>
                            Bias {c.aiAnalysis.biasScore}/100
                          </div>
                        )}
                        {c.aiAnalysis.misinformationRisk !== null && (
                          <div className={`px-2 py-0.5 rounded ${(c.aiAnalysis.misinformationRisk ?? 0) > 60 ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}>
                            Risk {c.aiAnalysis.misinformationRisk}/100
                          </div>
                        )}
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          );
        })}

        {contributions.length === 0 && (
          <div className="text-center py-16 text-ink/40">
            No submissions in the queue. Share the contribution portal to get started.
          </div>
        )}
      </div>
    </div>
  );
}
