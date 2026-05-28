import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { BadgeShowcase } from "@/components/contributor/BadgeShowcase";
import { StreakWidget } from "@/components/contributor/StreakWidget";
import { ReputationRadar } from "@/components/contributor/ReputationRadar";
import { cn } from "@/lib/utils";

type Params = { params: Promise<{ username: string }> };

const TIER_STYLES: Record<string, { bg: string; text: string; ring: string }> = {
  NEWCOMER:    { bg: "bg-gray-100",    text: "text-gray-600",    ring: "ring-gray-200" },
  CONTRIBUTOR: { bg: "bg-blue-50",     text: "text-blue-700",    ring: "ring-blue-200" },
  TRUSTED:     { bg: "bg-green-50",    text: "text-green-700",   ring: "ring-green-200" },
  VERIFIED:    { bg: "bg-emerald-50",  text: "text-emerald-700", ring: "ring-emerald-300" },
  EXPERT:      { bg: "bg-purple-50",   text: "text-purple-700",  ring: "ring-purple-300" },
  STAFF:       { bg: "bg-orange-50",   text: "text-orange-700",  ring: "ring-orange-300" },
};

const TYPE_ICONS: Record<string, string> = {
  BREAKING_NEWS: "⚡", INVESTIGATION: "🔍", RESEARCH: "📊", EXPLAINER: "💡",
  DATA_JOURNALISM: "📈", THREAD: "🧵", DOCUMENT_LEAK: "📄", OPINION: "✍️",
  COMMUNITY_NOTE: "📌", PHOTO_REPORT: "📷", VIDEO_REPORT: "🎥", WHISTLEBLOWER_TIP: "🔒",
};

const FACT_CHECK_COLORS: Record<string, string> = {
  TRUE: "text-green-700", MOSTLY_TRUE: "text-green-600", PARTIALLY_TRUE: "text-yellow-600",
  MOSTLY_FALSE: "text-orange-600", FALSE: "text-red-700", UNVERIFIABLE: "text-gray-500",
};

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { username } = await params;
  const user = await prisma.publicUser.findUnique({
    where: { username },
    select: { displayName: true, bio: true, reputation: { select: { tier: true } } },
  });
  if (!user) return { title: "Not found" };
  return {
    title: `${user.displayName} (@${username}) — TakeToday`,
    description: user.bio ?? `${user.displayName} is a ${user.reputation?.tier ?? "NEWCOMER"} contributor on TakeToday`,
  };
}

export default async function ProfilePage({ params }: Params) {
  const { username } = await params;

  const user = await prisma.publicUser.findUnique({
    where: { username: username.toLowerCase() },
    include: {
      reputation: true,
      reputationDimensions: true,
      userBadges: {
        include: { badge: true },
        orderBy: [{ isShowcased: "desc" }, { earnedAt: "desc" }],
      },
      streaks: { orderBy: { currentStreak: "desc" } },
      expertiseDomains: { orderBy: { score: "desc" }, take: 8 },
      endorsementsReceived: {
        include: { fromUser: { select: { username: true, displayName: true } } },
        orderBy: { createdAt: "desc" },
        take: 5,
      },
      contributions: {
        where: { status: "PUBLISHED" },
        orderBy: { publishedAt: "desc" },
        take: 20,
        include: {
          _count: { select: { communityVotes: true, factChecks: true, evidence: true } },
        },
      },
      activities: {
        where: { isPublic: true },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
      civicImpacts: {
        include: { contribution: { select: { title: true } } },
        orderBy: { impactScore: "desc" },
        take: 3,
      },
    },
  });

  if (!user) notFound();

  const tier = user.reputation?.tier ?? "NEWCOMER";
  const tierStyle = TIER_STYLES[tier] ?? TIER_STYLES.NEWCOMER;

  // Compute fact-check stats for profile
  const factCheckStats = await prisma.factCheck.groupBy({
    by: ["verdict"],
    where: { checkerId: user.id },
    _count: true,
  });

  const totalFactChecks = factCheckStats.reduce((acc, s) => acc + s._count, 0);
  const accurateChecks = factCheckStats
    .filter((s) => s.verdict === "TRUE" || s.verdict === "MOSTLY_TRUE")
    .reduce((acc, s) => acc + s._count, 0);
  const accuracy = totalFactChecks > 0 ? Math.round((accurateChecks / totalFactChecks) * 100) : null;

  // Civic impact summary
  const totalImpact = await prisma.civicImpact.findMany({
    where: { userId: user.id },
    select: { viewCount: true, governmentResponse: true, communityResponse: true, correctionIssued: true },
  });
  const govResponses = totalImpact.filter((i) => i.governmentResponse).length;
  const communityResponses = totalImpact.filter((i) => i.communityResponse).length;
  const correctionsIssued = totalImpact.filter((i) => i.correctionIssued).length;

  const showcasedBadges = user.userBadges.filter((b) => b.isShowcased).slice(0, 6);
  const allBadges = user.userBadges;

  return (
    <div className="min-h-screen bg-paper">
      <div className="max-w-5xl mx-auto px-4 py-12">

        {/* ─── Hero section ─── */}
        <div className="flex flex-col md:flex-row items-start gap-8 mb-12 pb-12 border-b border-ink/10">
          {/* Avatar */}
          <div className={cn("relative shrink-0", "w-24 h-24 rounded-2xl ring-2 overflow-hidden", tierStyle.ring)}>
            {user.avatar ? (
              <img src={user.avatar} alt={user.displayName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-ink/8 flex items-center justify-center text-4xl font-semibold text-ink/40">
                {user.displayName[0]}
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            {/* Name + badges */}
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="font-serif text-3xl text-ink">{user.displayName}</h1>
              {user.isVerifiedJournalist && (
                <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200 font-medium">
                  ✓ Verified Journalist
                </span>
              )}
              <span className={cn("text-xs px-2.5 py-0.5 rounded-full font-medium", tierStyle.bg, tierStyle.text)}>
                {tier}
              </span>
            </div>
            <div className="text-ink/40 text-sm mb-3">@{user.username}</div>
            {user.bio && <p className="text-ink/70 text-[15px] mb-4 max-w-xl leading-relaxed">{user.bio}</p>}

            {/* Links */}
            <div className="flex flex-wrap gap-4 text-[13px] text-ink/50 mb-5">
              {user.location && <span>📍 {user.location}</span>}
              {user.website && (
                <a href={user.website} target="_blank" rel="noopener noreferrer" className="hover:text-ink transition-colors">
                  🔗 {user.website.replace(/^https?:\/\//, "").split("/")[0]}
                </a>
              )}
              {user.twitterHandle && (
                <a href={`https://twitter.com/${user.twitterHandle}`} target="_blank" rel="noopener noreferrer" className="hover:text-ink">
                  𝕏 @{user.twitterHandle}
                </a>
              )}
            </div>

            {/* Top streaks compact */}
            {user.streaks.some((s) => s.currentStreak > 0) && (
              <StreakWidget
                streaks={user.streaks.filter((s) => s.currentStreak > 0).map((s) => ({
                  ...s,
                  lastActivityAt: s.lastActivityAt?.toISOString() ?? null,
                }))}
                compact
              />
            )}
          </div>

          {/* Overall score card */}
          {user.reputationDimensions && (
            <div className="shrink-0 border border-ink/10 rounded-2xl p-5 text-center min-w-[120px]">
              <div className="text-4xl font-bold text-ink mb-1">
                {user.reputationDimensions.overallScore.toFixed(1)}
              </div>
              <div className="text-[11px] text-ink/40 font-mono uppercase tracking-wide">Trust Score</div>
              <div className={cn("text-xs mt-2 font-medium px-2 py-0.5 rounded-full mx-auto w-fit", tierStyle.bg, tierStyle.text)}>
                {tier}
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ─── Left column: stats + reputation radar + expertise ─── */}
          <div className="space-y-8 lg:col-span-1">

            {/* Quick stats */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Published", value: user.reputation?.publishedCount ?? 0 },
                { label: "Contributions", value: user.reputation?.totalContributions ?? 0 },
                { label: "Fact Checks", value: totalFactChecks },
                { label: "Accuracy", value: accuracy !== null ? `${accuracy}%` : "—" },
              ].map((s) => (
                <div key={s.label} className="border border-ink/10 rounded-xl p-3 text-center">
                  <div className="font-serif text-xl text-ink">{s.value}</div>
                  <div className="text-[10px] text-ink/40 mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Reputation radar */}
            {user.reputationDimensions && (
              <div>
                <h3 className="text-[11px] font-mono uppercase tracking-wider text-ink/40 mb-4">Trust Dimensions</h3>
                <ReputationRadar dimensions={user.reputationDimensions} />
              </div>
            )}

            {/* Expertise domains */}
            {user.expertiseDomains.length > 0 && (
              <div>
                <h3 className="text-[11px] font-mono uppercase tracking-wider text-ink/40 mb-3">Expertise</h3>
                <div className="flex flex-wrap gap-2">
                  {user.expertiseDomains.map((d) => (
                    <span
                      key={d.id}
                      className="text-xs px-2.5 py-1 bg-ink/5 border border-ink/10 rounded-full text-ink/70 font-medium"
                    >
                      {d.topic}
                      <span className="text-ink/30 ml-1 font-mono">{Math.round(d.score)}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Verified expertise */}
            {user.verifiedExpertise.length > 0 && (
              <div>
                <h3 className="text-[11px] font-mono uppercase tracking-wider text-ink/40 mb-3">Verified Expertise</h3>
                <div className="flex flex-wrap gap-2">
                  {user.verifiedExpertise.map((topic) => (
                    <span key={topic} className="text-xs px-2.5 py-1 bg-emerald-50 border border-emerald-200 rounded-full text-emerald-700 font-medium">
                      ✓ {topic}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Civic impact */}
            {(govResponses > 0 || communityResponses > 0 || correctionsIssued > 0) && (
              <div>
                <h3 className="text-[11px] font-mono uppercase tracking-wider text-ink/40 mb-3">Civic Impact</h3>
                <div className="space-y-2">
                  {govResponses > 0 && (
                    <div className="flex items-center gap-2 text-[13px] text-ink/70">
                      <span className="text-base">🏛️</span>
                      <span>{govResponses} government response{govResponses !== 1 ? "s" : ""} generated</span>
                    </div>
                  )}
                  {communityResponses > 0 && (
                    <div className="flex items-center gap-2 text-[13px] text-ink/70">
                      <span className="text-base">🌍</span>
                      <span>{communityResponses} community action{communityResponses !== 1 ? "s" : ""} triggered</span>
                    </div>
                  )}
                  {correctionsIssued > 0 && (
                    <div className="flex items-center gap-2 text-[13px] text-ink/70">
                      <span className="text-base">✏️</span>
                      <span>{correctionsIssued} correction{correctionsIssued !== 1 ? "s" : ""} issued</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Endorsements */}
            {user.endorsementsReceived.length > 0 && (
              <div>
                <h3 className="text-[11px] font-mono uppercase tracking-wider text-ink/40 mb-3">Endorsed by</h3>
                <div className="space-y-2">
                  {user.endorsementsReceived.map((e) => (
                    <div key={e.id} className="flex items-center gap-2 text-[13px]">
                      <Link href={`/profile/${e.fromUser.username}`} className="text-ink/70 hover:text-ink">
                        {e.fromUser.displayName}
                      </Link>
                      <span className="text-ink/30">for</span>
                      <span className="text-ink/60 font-medium">{e.domain}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ─── Right column: badges, streaks, work, activity ─── */}
          <div className="space-y-10 lg:col-span-2">

            {/* Badges */}
            {allBadges.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-[11px] font-mono uppercase tracking-wider text-ink/40">
                    Badges · {allBadges.length}
                  </h2>
                  {showcasedBadges.length < allBadges.length && (
                    <span className="text-[11px] text-ink/30">{allBadges.length} total</span>
                  )}
                </div>
                <BadgeShowcase badges={allBadges.map((b) => ({ ...b, earnedAt: b.earnedAt.toISOString() }))} />
              </div>
            )}

            {/* Streaks */}
            {user.streaks.length > 0 && (
              <div>
                <h2 className="text-[11px] font-mono uppercase tracking-wider text-ink/40 mb-4">Activity Streaks</h2>
                <StreakWidget streaks={user.streaks.map((s) => ({
                  ...s,
                  lastActivityAt: s.lastActivityAt?.toISOString() ?? null,
                }))} />
              </div>
            )}

            {/* Published work */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-serif text-xl text-ink">Published Work</h2>
                <span className="text-[11px] text-ink/30 font-mono">{user.reputation?.publishedCount ?? 0} total</span>
              </div>

              {user.contributions.length === 0 ? (
                <div className="py-10 text-center border border-dashed border-ink/10 rounded-xl">
                  <p className="text-[14px] text-ink/40">No published contributions yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {user.contributions.map((c) => (
                    <Link
                      key={c.id}
                      href={`/contribute/${c.id}`}
                      className="flex items-start gap-3 p-4 border border-ink/8 rounded-xl hover:border-ink/20 hover:bg-ink/2 transition-all group"
                    >
                      <span className="text-xl shrink-0 mt-0.5">{TYPE_ICONS[c.type] ?? "📰"}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap gap-1.5 mb-1">
                          <span className="text-[10px] font-mono text-ink/30">{c.type.replace(/_/g, " ")}</span>
                          {c.isBreaking && <span className="text-[10px] font-bold text-red-600">BREAKING</span>}
                        </div>
                        <h3 className="text-[14px] font-medium text-ink group-hover:underline underline-offset-2 leading-snug mb-1.5">
                          {c.title}
                        </h3>
                        <div className="flex items-center gap-3 text-[11px] text-ink/30">
                          <span>{c.publishedAt ? new Date(c.publishedAt).toLocaleDateString() : ""}</span>
                          <span>·</span>
                          <span>{c._count.communityVotes} votes</span>
                          <span>·</span>
                          <span>{c._count.factChecks} fact-checks</span>
                          {c._count.evidence > 0 && (
                            <>
                              <span>·</span>
                              <span>{c._count.evidence} evidence</span>
                            </>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Recent activity */}
            {user.activities.length > 0 && (
              <div>
                <h2 className="text-[11px] font-mono uppercase tracking-wider text-ink/40 mb-4">Recent Activity</h2>
                <div className="space-y-2 border-l border-ink/10 pl-4">
                  {user.activities.map((a) => (
                    <div key={a.id} className="flex items-start gap-2 text-[13px]">
                      <span className="text-ink/30 font-mono text-[10px] mt-0.5 shrink-0 w-20">
                        {new Date(a.createdAt).toLocaleDateString("en", { month: "short", day: "numeric" })}
                      </span>
                      <span className="text-ink/60">{formatActivity(a.type, a.metadata as Record<string, unknown> | null)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function formatActivity(type: string, metadata: Record<string, unknown> | null): string {
  switch (type) {
    case "CONTRIBUTION_PUBLISHED":
      return metadata?.title ? `Published "${String(metadata.title).slice(0, 60)}"` : "Published a contribution";
    case "FACT_CHECK_COMPLETED":
      return "Completed a fact-check";
    case "BADGE_EARNED":
      return metadata?.badgeName ? `Earned badge: ${metadata.badgeName}` : "Earned a badge";
    case "STREAK_MILESTONE":
      return metadata?.streak ? `Reached a ${metadata.streak}-day streak` : "Hit a streak milestone";
    case "MISSION_JOINED":
      return metadata?.missionTitle ? `Joined mission: ${metadata.missionTitle}` : "Joined a mission";
    case "MISSION_COMPLETED":
      return "Completed a mission";
    case "INVESTIGATION_JOINED":
      return "Joined an investigation";
    case "EVIDENCE_SUBMITTED":
      return "Submitted evidence";
    case "NOTE_PROMOTED":
      return "Community note was promoted";
    case "CORRECTION_ISSUED":
      return "Issued a correction";
    default:
      return type.replace(/_/g, " ").toLowerCase();
  }
}
