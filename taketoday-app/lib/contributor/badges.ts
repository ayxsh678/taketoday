import { prisma } from "@/lib/db/prisma";
import { BadgeRarity, BadgeCategory } from "@prisma/client";
import type { InputJsonObject } from "@prisma/client/runtime/library";
import { logActivity } from "./activity-feed";

interface BadgeCriteria {
  type: string;
  threshold?: number;
  min_checks?: number;
  streak_type?: string;
}

interface BadgeDef {
  slug: string;
  name: string;
  description: string;
  icon: string;
  rarity: BadgeRarity;
  category: BadgeCategory;
  criteria: BadgeCriteria;
}

export const BADGE_DEFINITIONS: BadgeDef[] = [
  // Reporting
  { slug: "ground-reporter", name: "Ground Reporter", description: "Published your first contribution", icon: "📡", rarity: "COMMON", category: "REPORTING", criteria: { type: "published_count", threshold: 1 } },
  { slug: "civic-watchdog", name: "Civic Watchdog", description: "Published 5 verified contributions", icon: "👁️", rarity: "UNCOMMON", category: "REPORTING", criteria: { type: "published_count", threshold: 5 } },
  { slug: "truth-defender", name: "Truth Defender", description: "Published 25 contributions", icon: "🛡️", rarity: "RARE", category: "REPORTING", criteria: { type: "published_count", threshold: 25 } },
  { slug: "civic-legend", name: "Civic Legend", description: "Published 100 contributions", icon: "🏛️", rarity: "LEGENDARY", category: "REPORTING", criteria: { type: "published_count", threshold: 100 } },
  { slug: "data-journalist", name: "Data Journalist", description: "Published 5 data journalism pieces", icon: "📊", rarity: "RARE", category: "REPORTING", criteria: { type: "type_count", threshold: 5 } },
  // Fact Checking
  { slug: "truth-seeker", name: "Truth Seeker", description: "Completed your first fact-check", icon: "🔎", rarity: "COMMON", category: "FACT_CHECKING", criteria: { type: "fact_check_count", threshold: 1 } },
  { slug: "fact-hunter", name: "Fact Hunter", description: "Completed 10 fact-checks", icon: "🎯", rarity: "UNCOMMON", category: "FACT_CHECKING", criteria: { type: "fact_check_count", threshold: 10 } },
  { slug: "misinfo-slayer", name: "Misinformation Slayer", description: "Confirmed 50 fact-checks as VERIFIED or FALSE", icon: "⚔️", rarity: "EPIC", category: "FACT_CHECKING", criteria: { type: "decisive_fact_checks", threshold: 50 } },
  { slug: "accuracy-titan", name: "Accuracy Titan", description: "95%+ fact-check accuracy over 20 checks", icon: "🎖️", rarity: "EPIC", category: "ACCURACY", criteria: { type: "accuracy_score", threshold: 0.95, min_checks: 20 } },
  // Sources
  { slug: "source-maven", name: "Source Maven", description: "Added 10 source citations", icon: "📚", rarity: "COMMON", category: "REPORTING", criteria: { type: "citation_count", threshold: 10 } },
  // Evidence
  { slug: "evidence-trail", name: "Evidence Trail", description: "Uploaded 5 pieces of evidence", icon: "🗂️", rarity: "UNCOMMON", category: "INVESTIGATION", criteria: { type: "evidence_count", threshold: 5 } },
  // Investigation
  { slug: "team-investigator", name: "Team Investigator", description: "Joined 3 investigations", icon: "🕵️", rarity: "UNCOMMON", category: "INVESTIGATION", criteria: { type: "investigation_count", threshold: 3 } },
  { slug: "open-source-investigator", name: "Open Source Investigator", description: "Led 3 investigations", icon: "🔬", rarity: "RARE", category: "INVESTIGATION", criteria: { type: "led_investigations", threshold: 3 } },
  // Community
  { slug: "community-guardian", name: "Community Guardian", description: "Cast 50 community votes", icon: "🤝", rarity: "RARE", category: "COMMUNITY", criteria: { type: "vote_count", threshold: 50 } },
  { slug: "signal-amplifier", name: "Signal Amplifier", description: "Reached top 10% of contributors by reputation", icon: "📶", rarity: "EPIC", category: "COMMUNITY", criteria: { type: "top_percentile", threshold: 10 } },
  // Streaks
  { slug: "streak-starter", name: "Streak Starter", description: "Maintained a 7-day contribution streak", icon: "🔥", rarity: "COMMON", category: "STREAK", criteria: { type: "streak_days", threshold: 7, streak_type: "DAILY_CONTRIBUTION" } },
  { slug: "consistent-voice", name: "Consistent Voice", description: "Maintained a 30-day contribution streak", icon: "🏃", rarity: "UNCOMMON", category: "STREAK", criteria: { type: "streak_days", threshold: 30, streak_type: "DAILY_CONTRIBUTION" } },
  { slug: "relentless-reporter", name: "Relentless Reporter", description: "Maintained a 90-day contribution streak", icon: "⚡", rarity: "RARE", category: "STREAK", criteria: { type: "streak_days", threshold: 90, streak_type: "DAILY_CONTRIBUTION" } },
  { slug: "unstoppable", name: "Unstoppable", description: "Maintained a 365-day streak", icon: "💎", rarity: "LEGENDARY", category: "STREAK", criteria: { type: "streak_days", threshold: 365, streak_type: "DAILY_CONTRIBUTION" } },
  // Missions
  { slug: "mission-champion", name: "Mission Champion", description: "Completed 5 community missions", icon: "🏆", rarity: "RARE", category: "MILESTONE", criteria: { type: "missions_completed", threshold: 5 } },
  { slug: "crisis-reporter", name: "Crisis Reporter", description: "Contributed to a crisis coverage mission", icon: "🚨", rarity: "RARE", category: "SEASONAL", criteria: { type: "mission_type", threshold: 1 } },
  // Special
  { slug: "verified-journalist", name: "Verified Journalist", description: "Achieved verified journalist status", icon: "✅", rarity: "LEGENDARY", category: "SPECIAL", criteria: { type: "is_verified_journalist", threshold: 1 } },
];

let seedDone = false;

export async function ensureBadgesSeedeed(): Promise<void> {
  if (seedDone) return;
  for (const def of BADGE_DEFINITIONS) {
    await prisma.badgeDefinition.upsert({
      where: { slug: def.slug },
      create: { ...def, criteria: def.criteria as unknown as InputJsonObject },
      update: { name: def.name, description: def.description, icon: def.icon, criteria: def.criteria as unknown as InputJsonObject },
    });
  }
  seedDone = true;
}

export async function checkAndAwardBadges(userId: string): Promise<string[]> {
  await ensureBadgesSeedeed();

  const [user, reputation, streaks, factChecks, investigations, votes, citations, evidence, missions] =
    await Promise.all([
      prisma.publicUser.findUnique({ where: { id: userId }, select: { isVerifiedJournalist: true } }),
      prisma.contributorReputation.findUnique({ where: { userId } }),
      prisma.contributorStreak.findMany({ where: { userId } }),
      prisma.factCheck.count({ where: { checkerId: userId } }),
      prisma.investigationMember.count({ where: { userId } }),
      prisma.communityVote.count({ where: { userId } }),
      prisma.citationNode.count({ where: { contribution: { authorId: userId } } }),
      prisma.evidence.count({ where: { submittedById: userId } }),
      prisma.missionParticipant.count({ where: { userId, completedAt: { not: null } } }),
    ]);

  const publishedCount = reputation?.publishedCount ?? 0;
  const totalVotes = votes;
  const dailyStreak = streaks.find((s) => s.activityType === "DAILY_CONTRIBUTION");

  // Collect per-check stats for accuracy
  const factCheckResults = await prisma.factCheck.findMany({
    where: { checkerId: userId },
    select: { verdict: true },
  });
  const decisiveVerdicts = ["TRUE", "MOSTLY_TRUE", "FALSE", "MOSTLY_FALSE"];
  const decisiveCount = factCheckResults.filter((f) => decisiveVerdicts.includes(f.verdict)).length;
  const accurateCount = factCheckResults.filter((f) => f.verdict === "TRUE" || f.verdict === "MOSTLY_TRUE").length;
  const accuracyScore = factCheckResults.length > 0 ? accurateCount / factCheckResults.length : 0;

  const ledInvestigations = await prisma.investigationMember.count({
    where: { userId, role: "LEAD" },
  });

  const dataJournalismCount = await prisma.contribution.count({
    where: { authorId: userId, type: "DATA_JOURNALISM", workflowStage: "PUBLISHED" },
  });

  const existingBadges = await prisma.userBadge.findMany({
    where: { userId },
    select: { badge: { select: { slug: true } } },
  });
  const ownedSlugs = new Set(existingBadges.map((b) => b.badge.slug));

  const toAward: string[] = [];

  const ctx = {
    published_count: publishedCount,
    fact_check_count: factChecks,
    citation_count: citations,
    evidence_count: evidence,
    vote_count: totalVotes,
    investigation_count: investigations,
    led_investigations: ledInvestigations,
    missions_completed: missions,
    decisive_fact_checks: decisiveCount,
    accuracy_score: accuracyScore,
    fact_check_total: factCheckResults.length,
    streak_days_DAILY_CONTRIBUTION: dailyStreak?.longestStreak ?? 0,
    is_verified_journalist: user?.isVerifiedJournalist ? 1 : 0,
    type_count_DATA_JOURNALISM: dataJournalismCount,
  };

  const allDefs = await prisma.badgeDefinition.findMany({ where: { isActive: true } });

  for (const def of allDefs) {
    if (ownedSlugs.has(def.slug)) continue;

    const criteria = def.criteria as unknown as BadgeCriteria;
    let earned = false;

    switch (criteria.type) {
      case "published_count":
        earned = (ctx.published_count ?? 0) >= (criteria.threshold ?? 1);
        break;
      case "fact_check_count":
        earned = (ctx.fact_check_count ?? 0) >= (criteria.threshold ?? 1);
        break;
      case "decisive_fact_checks":
        earned = (ctx.decisive_fact_checks ?? 0) >= (criteria.threshold ?? 1);
        break;
      case "accuracy_score":
        earned =
          (ctx.accuracy_score ?? 0) >= (criteria.threshold ?? 0.95) &&
          (ctx.fact_check_total ?? 0) >= (criteria.min_checks ?? 20);
        break;
      case "citation_count":
        earned = (ctx.citation_count ?? 0) >= (criteria.threshold ?? 1);
        break;
      case "evidence_count":
        earned = (ctx.evidence_count ?? 0) >= (criteria.threshold ?? 1);
        break;
      case "vote_count":
        earned = (ctx.vote_count ?? 0) >= (criteria.threshold ?? 1);
        break;
      case "investigation_count":
        earned = (ctx.investigation_count ?? 0) >= (criteria.threshold ?? 1);
        break;
      case "led_investigations":
        earned = (ctx.led_investigations ?? 0) >= (criteria.threshold ?? 1);
        break;
      case "missions_completed":
        earned = (ctx.missions_completed ?? 0) >= (criteria.threshold ?? 1);
        break;
      case "streak_days": {
        const key = `streak_days_${criteria.streak_type ?? "DAILY_CONTRIBUTION"}` as keyof typeof ctx;
        earned = ((ctx[key] as number) ?? 0) >= (criteria.threshold ?? 7);
        break;
      }
      case "is_verified_journalist":
        earned = (ctx.is_verified_journalist ?? 0) >= 1;
        break;
      case "type_count":
        earned = (ctx.type_count_DATA_JOURNALISM ?? 0) >= (criteria.threshold ?? 5);
        break;
      case "top_percentile":
        // Evaluated separately via leaderboard — skip in this pass
        break;
    }

    if (earned) {
      toAward.push(def.id);
    }
  }

  if (toAward.length === 0) return [];

  const badgesWithSlugs: string[] = [];
  for (const badgeId of toAward) {
    await prisma.userBadge.create({ data: { userId, badgeId } });
    const def = allDefs.find((d) => d.id === badgeId)!;
    badgesWithSlugs.push(def.slug);
    await logActivity(userId, "BADGE_EARNED", badgeId, {
      badgeSlug: def.slug,
      badgeName: def.name,
      rarity: def.rarity,
    });
  }

  return badgesWithSlugs;
}

export async function getUserBadges(userId: string) {
  return prisma.userBadge.findMany({
    where: { userId },
    include: { badge: true },
    orderBy: [{ isShowcased: "desc" }, { earnedAt: "desc" }],
  });
}

export async function toggleBadgeShowcase(userId: string, userBadgeId: string, showcase: boolean) {
  return prisma.userBadge.update({
    where: { id: userBadgeId, userId },
    data: { isShowcased: showcase },
  });
}
