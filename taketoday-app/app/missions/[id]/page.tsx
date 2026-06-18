import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { SITE } from "@/lib/site";
import { MissionStatusBadge } from "@/components/missions/MissionStatusBadge";
import { MissionDifficultyBadge } from "@/components/missions/MissionDifficultyBadge";
import { MissionSubmissionForm } from "@/components/missions/MissionSubmissionForm";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const mission = await prisma.mission.findUnique({ where: { id } });
  if (!mission) return { title: `Mission Not Found — ${SITE.name}` };
  return {
    title: `${mission.title} — Missions — ${SITE.name}`,
    description: mission.description.slice(0, 160),
  };
}

export default async function MissionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const mission = await prisma.mission.findUnique({
    where: { id },
    include: {
      createdBy: { select: { name: true } },
      _count: { select: { submissions: true } },
    },
  });

  if (!mission) notFound();

  return (
    <div className="mx-auto max-w-site px-6 lg:px-10 pt-16 lg:pt-24 pb-24">
      <nav aria-label="Breadcrumb" className="font-mono text-[10px] tracking-[0.22em] uppercase text-ink-500">
        <Link href="/" className="reveal hover:text-ink">Home</Link>
        <span aria-hidden className="mx-2 text-ink-300">/</span>
        <Link href="/missions" className="hover:text-ink">Missions</Link>
        <span aria-hidden className="mx-2 text-ink-300">/</span>
        <span className="text-ink truncate max-w-[20ch]">{mission.title}</span>
      </nav>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Main */}
        <div className="lg:col-span-7">
          <div className="flex items-center gap-3 flex-wrap mb-4">
            <MissionStatusBadge status={mission.status} />
            <MissionDifficultyBadge difficulty={mission.difficulty} showPoints />
            <span className="font-mono text-[10px] tracking-[0.18em] uppercase text-ink-400">
              {mission.category}
            </span>
          </div>

          <h1 className="font-serif text-[40px] lg:text-[52px] leading-none tracking-tighter-2 text-ink mb-6">
            {mission.title}
          </h1>

          <div className="prose prose-ink max-w-none text-[16px] leading-relaxed text-ink-700 whitespace-pre-wrap mb-10">
            {mission.description}
          </div>

          {/* Submission form */}
          <div className="border-t border-ink-200/70 pt-8">
            <h2 className="font-serif text-[26px] text-ink mb-6">
              Submit your findings
            </h2>
            <MissionSubmissionForm
              missionId={mission.id}
              difficulty={mission.difficulty}
              status={mission.status}
            />
          </div>
        </div>

        {/* Sidebar */}
        <aside className="lg:col-span-4 lg:col-start-9 space-y-6">
          <div className="border border-ink-200/70 p-6 space-y-4">
            <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-ink-400">
              Mission details
            </p>

            <dl className="space-y-3 text-[13px]">
              <div>
                <dt className="text-ink-400 mb-0.5">Reward</dt>
                <dd className="text-ink font-medium">
                  +{mission.pointsReward} points on approval
                </dd>
              </div>
              <div>
                <dt className="text-ink-400 mb-0.5">Difficulty</dt>
                <dd>
                  <MissionDifficultyBadge difficulty={mission.difficulty} />
                </dd>
              </div>
              <div>
                <dt className="text-ink-400 mb-0.5">Submissions</dt>
                <dd className="text-ink">{mission._count.submissions}</dd>
              </div>
              {mission.deadline && (
                <div>
                  <dt className="text-ink-400 mb-0.5">Deadline</dt>
                  <dd className="text-ink">
                    {new Date(mission.deadline).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </dd>
                </div>
              )}
              {mission.createdBy && (
                <div>
                  <dt className="text-ink-400 mb-0.5">Posted by</dt>
                  <dd className="text-ink">{mission.createdBy.name}</dd>
                </div>
              )}
              <div>
                <dt className="text-ink-400 mb-0.5">Published</dt>
                <dd className="text-ink">
                  {new Date(mission.createdAt).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </dd>
              </div>
            </dl>
          </div>

          <div className="border border-ink-200/70 p-6 space-y-3">
            <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-ink-400">
              Contributor levels
            </p>
            <ul className="space-y-2 text-[13px]">
              {[
                { label: "Researcher", range: "0–499 pts" },
                { label: "Contributor", range: "500–1,999 pts" },
                { label: "Investigator", range: "2,000–4,999 pts" },
                { label: "Lead Investigator", range: "5,000+ pts" },
              ].map(({ label, range }) => (
                <li key={label} className="flex justify-between">
                  <span className="text-ink">{label}</span>
                  <span className="text-ink-400 font-mono text-[11px]">{range}</span>
                </li>
              ))}
            </ul>
            <Link
              href="/leaderboard"
              className="block text-[12px] font-mono tracking-wide text-ink-400 hover:text-ink transition-colors mt-2"
            >
              View leaderboard →
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
