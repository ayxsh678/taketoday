"use client";

import { cn } from "@/lib/utils";

const RARITY_STYLES: Record<string, { ring: string; glow: string; label: string }> = {
  COMMON:    { ring: "ring-gray-200",   glow: "",                    label: "text-gray-500" },
  UNCOMMON:  { ring: "ring-blue-300",   glow: "shadow-blue-100",     label: "text-blue-600" },
  RARE:      { ring: "ring-purple-400", glow: "shadow-purple-100",   label: "text-purple-700" },
  EPIC:      { ring: "ring-orange-400", glow: "shadow-orange-100",   label: "text-orange-700" },
  LEGENDARY: { ring: "ring-yellow-400", glow: "shadow-yellow-100",   label: "text-yellow-700" },
};

interface Badge {
  id: string;
  isShowcased: boolean;
  earnedAt: string;
  badge: {
    slug: string;
    name: string;
    description: string;
    icon: string;
    rarity: string;
    category: string;
  };
}

interface BadgeShowcaseProps {
  badges: Badge[];
  showcaseOnly?: boolean;
  onToggle?: (id: string, showcase: boolean) => void;
  className?: string;
}

export function BadgeShowcase({ badges, showcaseOnly = false, onToggle, className }: BadgeShowcaseProps) {
  const shown = showcaseOnly ? badges.filter((b) => b.isShowcased) : badges;

  if (shown.length === 0) {
    return (
      <div className="text-sm text-ink/40 py-4">
        {showcaseOnly ? "No badges showcased yet." : "No badges earned yet."}
      </div>
    );
  }

  return (
    <div className={cn("flex flex-wrap gap-3", className)}>
      {shown.map((ub) => {
        const style = RARITY_STYLES[ub.badge.rarity] ?? RARITY_STYLES.COMMON;
        return (
          <div
            key={ub.id}
            className={cn(
              "group relative flex flex-col items-center gap-1 p-3 rounded-xl border bg-paper cursor-default",
              "ring-1 shadow-sm transition-all hover:scale-105",
              style.ring,
              style.glow,
              onToggle && "cursor-pointer",
            )}
            title={ub.badge.description}
            onClick={() => onToggle?.(ub.id, !ub.isShowcased)}
          >
            <span className="text-2xl leading-none">{ub.badge.icon}</span>
            <span className="text-[11px] font-medium text-ink text-center leading-tight max-w-[72px]">
              {ub.badge.name}
            </span>
            <span className={cn("text-[9px] font-mono uppercase tracking-wide", style.label)}>
              {ub.badge.rarity}
            </span>
            {ub.isShowcased && (
              <span className="absolute -top-1.5 -right-1.5 bg-ink text-paper rounded-full w-4 h-4 flex items-center justify-center text-[9px]">
                ★
              </span>
            )}
            {/* Tooltip */}
            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-10 hidden group-hover:block w-44 bg-ink text-paper text-[11px] rounded-lg p-2 shadow-lg pointer-events-none">
              <p className="font-semibold mb-0.5">{ub.badge.name}</p>
              <p className="text-paper/70">{ub.badge.description}</p>
              <p className="text-paper/40 mt-1">{new Date(ub.earnedAt).toLocaleDateString()}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
