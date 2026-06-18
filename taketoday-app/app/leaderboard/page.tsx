import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { SITE } from "@/lib/site";
import { ContributorBadge } from "@/components/missions/ContributorBadge";

export const metadata: Metadata = {
  title: `Leaderboard — ${SITE.name}`,
  description: "Top contributors to TakeToday's open journalism platform.",
};

export const revalidate = 300;

export default async function LeaderboardPage() {
  let contributors: Awaited<ReturnType<typeof prisma.contributorPoints.findMany>> = [];
  let totalContributors = 0;
  let totalMissions = 0;

  try {
    [contributors, totalContributors, totalMissions] = await Promise.all([
      prisma.contributorPoints.findMany({
        where: { totalPoints: { gt: 0 } },
        orderBy: { totalPoints: "desc" },
        take: 25,
      }),
      prisma.contributorPoints.count({ where: { totalPoints: { gt: 0 } } }),
      prisma.missionSubmission.count({ where: { status: "APPROVED" } }),
    ]);
  } catch {
    // DB not yet migrated — render empty state
  }

  return (
    <div className="mx-auto max-w-site px-6 lg:px-10 pt-16 lg:pt-24 pb-24">
      <nav aria-label="Breadcrumb" className="font-mono text-[10px] tracking-[0.22em] uppercase text-ink-500">
        <Link href="/" className="reveal hover:text-ink">Home</Link>
        <span aria-hidden className="mx-2 text-ink-300">/</span>
        <span className="text-ink">Leaderboard</span>
      </nav>

      <header className="mt-8 max-w-2xl">
        <h1 className="font-serif text-[56px] lg:text-[72px] leading-none tracking-tighter-2 text-ink">
          Top<br />
          <span className="italic text-ink-400">Contributors.</span>
        </h1>
        <p className="mt-6 text-[17px] leading-relaxed text-ink-500 max-w-[52ch]">
          Readers who help make TakeToday sharper — ranked by points earned
          through mission completions and editorial contributions.
        </p>
      </header>

      {/* Stats */}
      <div className="mt-12 flex gap-12 border-t border-b border-ink-200/70 py-5">
        <div>
          <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-ink-400 mb-1">Contributors</p>
          <p className="font-serif text-[28px] text-ink">{totalContributors}</p>
        </div>
        <div>
          <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-ink-400 mb-1">Missions approved</p>
          <p className="font-serif text-[28px] text-ink">{totalMissions}</p>
        </div>
        <div>
          <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-ink-400 mb-1">Join us</p>
          <Link href="/missions" className="font-serif text-[28px] text-ink underline underline-offset-4 hover:text-ink-700">
            Missions →
          </Link>
        </div>
      </div>

      <div className="mt-10 grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Rankings */}
        <div className="lg:col-span-8">
          {contributors.length === 0 ? (
            <div className="border border-ink-200/70 p-12 text-center">
              <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-ink-400 mb-3">
                No contributors yet
              </p>
              <p className="text-[14px] text-ink-500 mb-6">
                Be the first to complete a mission and earn your place here.
              </p>
              <Link
                href="/missions"
                className="inline-flex items-center bg-ink text-paper px-5 py-2.5 text-[13px] font-medium tracking-wide hover:bg-ink-700 transition-colors"
              >
                Browse missions →
              </Link>
            </div>
          ) : (
            <div>
              {/* Header */}
              <div className="grid grid-cols-12 gap-4 px-4 pb-2 border-b border-ink-200/70">
                <span className="col-span-1 font-mono text-[9px] tracking-[0.22em] uppercase text-ink-400">#</span>
                <span className="col-span-5 font-mono text-[9px] tracking-[0.22em] uppercase text-ink-400">Contributor</span>
                <span className="col-span-3 font-mono text-[9px] tracking-[0.22em] uppercase text-ink-400">Level</span>
                <span className="col-span-2 font-mono text-[9px] tracking-[0.22em] uppercase text-ink-400 text-right">Points</span>
                <span className="col-span-1 font-mono text-[9px] tracking-[0.22em] uppercase text-ink-400 text-right">Missions</span>
              </div>

              <div className="divide-y divide-ink-200/50">
                {contributors.map((c, i) => {
                  const rank = i + 1;
                  const displayName = c.name ?? c.email.split("@")[0];

                  return (
                    <div
                      key={c.id}
                      className="grid grid-cols-12 gap-4 px-4 py-4 items-center hover:bg-ink-50/30 transition-colors"
                    >
                      <span
                        className={`col-span-1 font-serif text-[18px] ${
                          rank <= 3 ? "text-ink font-bold" : "text-ink-400"
                        }`}
                      >
                        {rank <= 3 ? (
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full text-[12px] font-bold"
                            style={{
                              background: rank === 1 ? "#b8860b" : rank === 2 ? "#888" : "#b87333",
                              color: "#fff",
                            }}
                          >
                            {rank}
                          </span>
                        ) : (
                          rank
                        )}
                      </span>

                      <div className="col-span-5 min-w-0">
                        <p className="text-[14px] text-ink font-medium truncate">
                          {displayName}
                        </p>
                        {c.name && (
                          <p className="text-[11px] text-ink-400 truncate font-mono">
                            {c.email.split("@")[0]}@…
                          </p>
                        )}
                      </div>

                      <div className="col-span-3">
                        <ContributorBadge points={c.totalPoints} />
                      </div>

                      <span className="col-span-2 font-mono text-[13px] text-ink text-right">
                        {c.totalPoints.toLocaleString()}
                      </span>

                      <span className="col-span-1 font-mono text-[12px] text-ink-400 text-right">
                        {c.missionsCompleted}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar — levels */}
        <aside className="lg:col-span-4">
          <div className="border border-ink-200/70 p-6 space-y-5">
            <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-ink-400">
              Contributor levels
            </p>
            <ul className="space-y-4">
              {[
                { label: "Researcher", range: "0–499 pts", color: "text-zinc-600" },
                { label: "Contributor", range: "500–1,999 pts", color: "text-blue-600" },
                { label: "Investigator", range: "2,000–4,999 pts", color: "text-purple-700" },
                { label: "Lead Investigator", range: "5,000+ pts", color: "text-amber-700" },
              ].map(({ label, range, color }) => (
                <li key={label} className="flex items-start justify-between gap-4">
                  <div>
                    <p className={`text-[13px] font-medium ${color}`}>{label}</p>
                    <p className="text-[11px] text-ink-400 font-mono mt-0.5">{range}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-6 border border-ink-200/70 p-6">
            <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-ink-400 mb-3">
              Earn points
            </p>
            <ul className="space-y-2 text-[13px] text-ink-600">
              <li className="flex justify-between">
                <span>Easy mission</span>
                <span className="font-mono text-ink">+50</span>
              </li>
              <li className="flex justify-between">
                <span>Medium mission</span>
                <span className="font-mono text-ink">+150</span>
              </li>
              <li className="flex justify-between">
                <span>Hard mission</span>
                <span className="font-mono text-ink">+300</span>
              </li>
              <li className="flex justify-between border-t border-ink-200/70 pt-2 mt-2">
                <span>Editor bonus</span>
                <span className="font-mono text-ink">+50–250</span>
              </li>
            </ul>
            <Link
              href="/missions"
              className="mt-5 inline-flex items-center bg-ink text-paper px-4 py-2 text-[12px] font-medium tracking-wide hover:bg-ink-700 transition-colors"
            >
              Browse missions →
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
