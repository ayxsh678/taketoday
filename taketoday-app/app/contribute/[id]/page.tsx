import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { WORKFLOW_STAGE_META } from "@/lib/contributor/types";
import type { WorkflowStage, TransparencyAction } from "@prisma/client";
import Link from "next/link";

type Params = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const c = await prisma.contribution.findUnique({ where: { id }, select: { title: true, summary: true } });
  if (!c) return { title: "Not found" };
  return { title: `${c.title} — TakeToday`, description: c.summary ?? undefined };
}

const verdictColors: Record<string, string> = {
  TRUE: "text-green-700 bg-green-50",
  MOSTLY_TRUE: "text-green-600 bg-green-50",
  PARTIALLY_TRUE: "text-yellow-700 bg-yellow-50",
  CONTEXT_NEEDED: "text-yellow-600 bg-yellow-50",
  MOSTLY_FALSE: "text-orange-700 bg-orange-50",
  FALSE: "text-red-700 bg-red-50",
  UNVERIFIABLE: "text-gray-600 bg-gray-100",
  SATIRE: "text-purple-700 bg-purple-50",
};

const transparencyLabels: Partial<Record<TransparencyAction, string>> = {
  SUBMITTED: "Submitted",
  AI_ANALYSIS_RUN: "AI analysis run",
  SOURCE_ADDED: "Source added",
  EVIDENCE_UPLOADED: "Evidence uploaded",
  FACT_CHECKED: "Fact checked",
  COMMUNITY_VOTED: "Community vote",
  EDITED: "Edited",
  VERSION_CREATED: "New version",
  FORKED: "Forked",
  WORKFLOW_CHANGED: "Status changed",
  DISPUTED: "Disputed",
  CORRECTED: "Correction",
  EDITORIAL_DECISION: "Editorial decision",
  PUBLISHED: "Published",
  ARCHIVED: "Archived",
};

export default async function ContributionPage({ params }: Params) {
  const { id } = await params;

  const contribution = await prisma.contribution.findUnique({
    where: { id },
    include: {
      author: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatar: true,
          isVerifiedJournalist: true,
          reputation: { select: { tier: true, overallScore: true } },
        },
      },
      collaborators: {
        include: {
          user: { select: { id: true, username: true, displayName: true, avatar: true } },
        },
      },
      evidence: { orderBy: { createdAt: "desc" } },
      citations: { orderBy: { accessedAt: "desc" } },
      factChecks: {
        orderBy: { createdAt: "desc" },
        include: {
          checker: { select: { username: true, displayName: true, isVerifiedJournalist: true } },
        },
      },
      communityVotes: { select: { type: true, weight: true } },
      communityNotes: {
        where: { status: "VISIBLE" },
        orderBy: { helpful: "desc" },
        include: { author: { select: { username: true, displayName: true } } },
      },
      transparencyLogs: { orderBy: { createdAt: "asc" } },
      aiAnalysis: true,
      editorialDecisions: {
        where: { publiclyVisible: true },
        orderBy: { createdAt: "desc" },
      },
      corrections: { orderBy: { createdAt: "desc" } },
      versions: {
        orderBy: { versionNumber: "desc" },
        take: 5,
        select: { id: true, versionNumber: true, commitMessage: true, createdAt: true },
      },
    },
  });

  if (!contribution) notFound();

  const stageMeta = WORKFLOW_STAGE_META[contribution.workflowStage as WorkflowStage];

  const voteSummary = contribution.communityVotes.reduce(
    (acc, v) => { acc[v.type] = (acc[v.type] ?? 0) + v.weight; return acc; },
    {} as Record<string, number>,
  );

  return (
    <div className="min-h-screen bg-paper">
      <div className="max-w-4xl mx-auto px-4 py-12">

        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full bg-ink/8 text-ink/70`}>
              {contribution.type.replace(/_/g, " ")}
            </span>
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full bg-ink/8 text-ink/70`}>
              {stageMeta.label}
            </span>
            {contribution.isBreaking && (
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-red-500 text-white">
                BREAKING
              </span>
            )}
            {contribution.aiUsageDisclosed && (
              <span className="text-xs px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                🤖 AI assisted
              </span>
            )}
          </div>

          <h1 className="font-instrument text-3xl md:text-4xl text-ink mb-4 leading-tight">
            {contribution.title}
          </h1>

          {contribution.summary && (
            <p className="text-ink/70 text-lg leading-relaxed mb-6">{contribution.summary}</p>
          )}

          {/* Author + meta */}
          <div className="flex items-center gap-3 pb-6 border-b border-ink/10">
            <div className="w-9 h-9 rounded-full bg-ink/10 flex items-center justify-center text-sm font-medium text-ink">
              {contribution.author.displayName[0]}
            </div>
            <div>
              <Link href={`/profile/${contribution.author.username}`} className="font-medium text-ink hover:underline text-sm">
                {contribution.author.displayName}
              </Link>
              {contribution.author.isVerifiedJournalist && (
                <span className="ml-1 text-blue-500 text-xs">✓ Verified</span>
              )}
              <div className="text-xs text-ink/50">
                {new Date(contribution.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                {contribution.location && ` · ${contribution.location}`}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2">
            <div className="prose prose-ink max-w-none mb-8 text-ink/90 leading-relaxed whitespace-pre-wrap">
              {contribution.body}
            </div>

            {/* Corrections */}
            {contribution.corrections.length > 0 && (
              <div className="mb-8 border border-orange-200 bg-orange-50 rounded-xl p-4">
                <h3 className="font-medium text-orange-900 mb-2 text-sm">Corrections</h3>
                {contribution.corrections.map((c) => (
                  <div key={c.id} className="text-sm text-orange-800">
                    <span className="font-medium uppercase text-xs">[{c.severity}]</span> {c.description}
                  </div>
                ))}
              </div>
            )}

            {/* Community notes */}
            {contribution.communityNotes.length > 0 && (
              <div className="mb-8">
                <h3 className="font-medium text-ink mb-3 text-sm">Community notes</h3>
                <div className="space-y-3">
                  {contribution.communityNotes.map((note) => (
                    <div key={note.id} className="border border-ink/10 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-medium px-2 py-0.5 bg-ink/8 rounded text-ink/60">
                          {note.type.replace(/_/g, " ")}
                        </span>
                        <span className="text-xs text-ink/40">by @{note.author.username}</span>
                      </div>
                      <p className="text-sm text-ink/80">{note.body}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Fact checks */}
            {contribution.factChecks.length > 0 && (
              <div className="mb-8">
                <h3 className="font-medium text-ink mb-3 text-sm">Fact checks ({contribution.factChecks.length})</h3>
                <div className="space-y-3">
                  {contribution.factChecks.map((fc) => (
                    <div key={fc.id} className="border border-ink/10 rounded-xl p-4">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <p className="text-sm text-ink/80 font-medium">{fc.claim}</p>
                        <span className={`text-xs font-bold px-2 py-1 rounded shrink-0 ${verdictColors[fc.verdict] ?? "text-gray-600 bg-gray-100"}`}>
                          {fc.verdict.replace(/_/g, " ")}
                        </span>
                      </div>
                      <p className="text-xs text-ink/60 mb-2">{fc.explanation}</p>
                      <div className="text-xs text-ink/40">
                        by @{fc.checker.username}
                        {fc.checker.isVerifiedJournalist && " ✓"}
                        {fc.aiAssisted && " · AI assisted"}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Community votes */}
            <div className="border border-ink/10 rounded-xl p-4">
              <h3 className="font-medium text-ink text-sm mb-3">Community assessment</h3>
              <div className="space-y-2">
                {Object.entries(voteSummary).map(([type, weight]) => (
                  <div key={type} className="flex justify-between text-xs">
                    <span className="text-ink/60">{type.replace(/_/g, " ")}</span>
                    <span className="font-medium text-ink">{Math.round(weight as number)}</span>
                  </div>
                ))}
                {Object.keys(voteSummary).length === 0 && (
                  <p className="text-xs text-ink/40">No votes yet</p>
                )}
              </div>
            </div>

            {/* AI analysis */}
            {contribution.aiAnalysis && (
              <div className="border border-ink/10 rounded-xl p-4">
                <h3 className="font-medium text-ink text-sm mb-3">AI analysis</h3>
                <div className="space-y-2 text-xs">
                  {contribution.aiAnalysis.biasScore !== null && (
                    <div className="flex justify-between">
                      <span className="text-ink/60">Bias score</span>
                      <span className={`font-medium ${(contribution.aiAnalysis.biasScore ?? 0) > 50 ? "text-orange-600" : "text-green-600"}`}>
                        {contribution.aiAnalysis.biasScore}/100
                      </span>
                    </div>
                  )}
                  {contribution.aiAnalysis.misinformationRisk !== null && (
                    <div className="flex justify-between">
                      <span className="text-ink/60">Misinfo risk</span>
                      <span className={`font-medium ${(contribution.aiAnalysis.misinformationRisk ?? 0) > 50 ? "text-red-600" : "text-green-600"}`}>
                        {contribution.aiAnalysis.misinformationRisk}/100
                      </span>
                    </div>
                  )}
                  {contribution.aiAnalysis.sentimentLabel && (
                    <div className="flex justify-between">
                      <span className="text-ink/60">Sentiment</span>
                      <span className="font-medium text-ink capitalize">{contribution.aiAnalysis.sentimentLabel}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Sources */}
            {contribution.citations.length > 0 && (
              <div className="border border-ink/10 rounded-xl p-4">
                <h3 className="font-medium text-ink text-sm mb-3">Sources ({contribution.citations.length})</h3>
                <div className="space-y-2">
                  {contribution.citations.slice(0, 5).map((c) => (
                    <a
                      key={c.id}
                      href={c.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-xs text-ink/60 hover:text-ink truncate"
                    >
                      <span className="text-ink/40 mr-1">[{c.type.replace(/_/g, " ")}]</span>
                      {c.title ?? c.url}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Evidence */}
            {contribution.evidence.length > 0 && (
              <div className="border border-ink/10 rounded-xl p-4">
                <h3 className="font-medium text-ink text-sm mb-3">Evidence ({contribution.evidence.length})</h3>
                <div className="space-y-2">
                  {contribution.evidence.slice(0, 5).map((e) => (
                    <div key={e.id} className="text-xs">
                      <span className="text-ink/40 mr-1">[{e.type}]</span>
                      <span className="text-ink/70">{e.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Version history */}
            {contribution.versions.length > 0 && (
              <div className="border border-ink/10 rounded-xl p-4">
                <h3 className="font-medium text-ink text-sm mb-3">Version history</h3>
                <div className="space-y-2">
                  {contribution.versions.map((v) => (
                    <div key={v.id} className="text-xs flex justify-between">
                      <span className="text-ink/60">v{v.versionNumber} — {v.commitMessage ?? "Updated"}</span>
                      <span className="text-ink/40">{new Date(v.createdAt).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Transparency trail */}
            <div className="border border-ink/10 rounded-xl p-4">
              <h3 className="font-medium text-ink text-sm mb-3">Transparency trail</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {contribution.transparencyLogs.map((log) => (
                  <div key={log.id} className="text-xs flex gap-2">
                    <span className="text-ink/40 shrink-0">{new Date(log.createdAt).toLocaleDateString()}</span>
                    <span className="text-ink/60">{transparencyLabels[log.action] ?? log.action}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
