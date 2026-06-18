import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { SITE } from "@/lib/site";
import { MissionCard } from "@/components/missions/MissionCard";
import { MissionStatus } from "@prisma/client";

export const metadata: Metadata = {
  title: `Missions — ${SITE.name}`,
  description: "Earn points by helping shape TakeToday's coverage. Fact-check, translate, investigate.",
};

export const revalidate = 60;

const CATEGORIES = [
  "All",
  "AI",
  "Finance",
  "Technology",
  "Startups",
  "Investigative",
  "Policy",
];

export default async function MissionsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; difficulty?: string }>;
}) {
  const { category, difficulty } = await searchParams;

  const where = {
    status: { in: [MissionStatus.OPEN, MissionStatus.IN_PROGRESS] },
    ...(category && category !== "All" ? { category } : {}),
    ...(difficulty ? { difficulty: difficulty as never } : {}),
  };

  let missions: Awaited<ReturnType<typeof prisma.mission.findMany<{ include: { _count: { select: { submissions: true } } } }>>> = [];
  let totalOpen = 0;
  let totalCompleted = 0;

  try {
    [missions, totalOpen, totalCompleted] = await Promise.all([
      prisma.mission.findMany({
        where,
        orderBy: [{ status: "asc" }, { createdAt: "desc" }],
        take: 24,
        include: { _count: { select: { submissions: true } } },
      }),
      prisma.mission.count({ where: { status: MissionStatus.OPEN } }),
      prisma.mission.count({ where: { status: MissionStatus.COMPLETED } }),
    ]);
  } catch {
    // DB not yet migrated — render empty state
  }

  return (
    <div className="mx-auto max-w-site px-6 lg:px-10 pt-16 lg:pt-24 pb-24">
      <nav aria-label="Breadcrumb" className="font-mono text-[10px] tracking-[0.22em] uppercase text-ink-500">
        <Link href="/" className="reveal hover:text-ink">Home</Link>
        <span aria-hidden className="mx-2 text-ink-300">/</span>
        <span className="text-ink">Missions</span>
      </nav>

      <header className="mt-8 max-w-2xl">
        <h1 className="font-serif text-[56px] lg:text-[72px] leading-none tracking-tighter-2 text-ink">
          Reader<br />
          <span className="italic text-ink-400">Missions.</span>
        </h1>
        <p className="mt-6 text-[17px] leading-relaxed text-ink-500 max-w-[52ch]">
          Earn points by helping shape our coverage. Fact-check claims, translate
          documents, surface local data.
        </p>
      </header>

      {/* Stats strip */}
      <div className="mt-12 flex gap-12 border-t border-b border-ink-200/70 py-5">
        <div>
          <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-ink-400 mb-1">Open</p>
          <p className="font-serif text-[28px] text-ink">{totalOpen}</p>
        </div>
        <div>
          <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-ink-400 mb-1">Completed</p>
          <p className="font-serif text-[28px] text-ink">{totalCompleted}</p>
        </div>
        <div>
          <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-ink-400 mb-1">Leaderboard</p>
          <Link href="/leaderboard" className="font-serif text-[28px] text-ink underline underline-offset-4 hover:text-ink-700">
            View →
          </Link>
        </div>
      </div>

      {/* Category filters */}
      <div className="mt-8 flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => {
          const isActive = (!category && cat === "All") || category === cat;
          const href =
            cat === "All"
              ? "/missions"
              : `/missions?category=${encodeURIComponent(cat)}`;
          return (
            <Link
              key={cat}
              href={href}
              className={`px-3 py-1.5 font-mono text-[10px] tracking-[0.18em] uppercase border transition-colors ${
                isActive
                  ? "border-ink bg-ink text-paper"
                  : "border-ink-200/70 text-ink-500 hover:border-ink hover:text-ink"
              }`}
            >
              {cat}
            </Link>
          );
        })}
      </div>

      {/* Missions grid */}
      <section className="mt-10">
        {missions.length === 0 ? (
          <div className="border border-ink-200/70 p-12 text-center">
            <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-ink-400 mb-3">
              No missions found
            </p>
            <p className="text-[14px] text-ink-500">
              {category
                ? "No active missions in this category. Check back soon."
                : "No missions are active right now. Check back soon."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-px border border-ink-200/70">
            {missions.map((m) => (
              <MissionCard
                key={m.id}
                id={m.id}
                title={m.title}
                description={m.description}
                category={m.category}
                difficulty={m.difficulty}
                pointsReward={m.pointsReward}
                status={m.status}
                deadline={m.deadline?.toISOString()}
                submissionCount={m._count.submissions}
              />
            ))}
          </div>
        )}
      </section>

      {/* How it works */}
      <section className="mt-20 border-t border-ink-200/70 pt-12 max-w-3xl">
        <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-ink-400 mb-8">
          How missions work
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          {[
            { step: "01", title: "Pick a mission", body: "Browse open assignments across AI, finance, and investigative categories." },
            { step: "02", title: "Submit your work", body: "Editors review submissions and integrate the best into live articles." },
            { step: "03", title: "Earn recognition", body: "Points, contributor levels, and bylines for work that makes it to print." },
          ].map(({ step, title, body }) => (
            <div key={step} className="border-t-2 border-ink pt-6">
              <p className="font-mono text-[10px] tracking-[0.22em] text-ink-400 mb-3">{step}</p>
              <h2 className="font-serif text-[22px] text-ink mb-2">{title}</h2>
              <p className="text-[14px] text-ink-500 leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
