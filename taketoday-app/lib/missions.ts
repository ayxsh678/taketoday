import { MissionDifficulty } from "@prisma/client";

export const POINTS_BY_DIFFICULTY: Record<MissionDifficulty, number> = {
  EASY: 50,
  MEDIUM: 150,
  HARD: 300,
};

export const BONUS_OPTIONS = [50, 100, 250] as const;
export type BonusAmount = (typeof BONUS_OPTIONS)[number];

export type ContributorLevel = {
  label: string;
  minPoints: number;
  maxPoints: number | null;
};

export const CONTRIBUTOR_LEVELS: ContributorLevel[] = [
  { label: "Researcher", minPoints: 0, maxPoints: 499 },
  { label: "Contributor", minPoints: 500, maxPoints: 1999 },
  { label: "Investigator", minPoints: 2000, maxPoints: 4999 },
  { label: "Lead Investigator", minPoints: 5000, maxPoints: null },
];

export function getContributorLevel(points: number): ContributorLevel {
  return (
    [...CONTRIBUTOR_LEVELS].reverse().find((l) => points >= l.minPoints) ??
    CONTRIBUTOR_LEVELS[0]
  );
}

export function getNextLevel(points: number): ContributorLevel | null {
  const current = getContributorLevel(points);
  const idx = CONTRIBUTOR_LEVELS.findIndex((l) => l.label === current.label);
  return CONTRIBUTOR_LEVELS[idx + 1] ?? null;
}

export function getProgressToNextLevel(points: number): number {
  const current = getContributorLevel(points);
  const next = getNextLevel(points);
  if (!next) return 100;
  const range = next.minPoints - current.minPoints;
  const earned = points - current.minPoints;
  return Math.min(100, Math.round((earned / range) * 100));
}
