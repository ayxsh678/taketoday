import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: `Leaderboard — ${SITE.name}`,
  description: "Top contributors to TakeToday's open journalism platform.",
};

export default function LeaderboardPage() {
  return (
    <div className="mx-auto max-w-[1400px] px-6 lg:px-10 pt-16 lg:pt-24 pb-24">
      <nav aria-label="Breadcrumb" className="font-mono text-[10px] tracking-[0.22em] uppercase text-ink-500">
        <Link href="/" className="reveal hover:text-ink">Home</Link>
        <span aria-hidden className="mx-2 text-ink-300">/</span>
        <span className="text-ink">Leaderboard</span>
      </nav>

      <header className="mt-8 max-w-2xl">
        <h1 className="font-serif text-[56px] lg:text-[72px] leading-[1.0] tracking-[-0.03em] text-ink">
          Top<br />
          <span className="italic text-ink-400">Contributors.</span>
        </h1>
        <p className="mt-6 text-[17px] leading-relaxed text-ink-500 max-w-[52ch]">
          The readers who help make TakeToday sharper. Launching with Missions.
        </p>
      </header>

      <div className="mt-14 border-t border-ink-200/70 pt-12 max-w-2xl">
        <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-ink-400 mb-6">Coming soon</p>
        <p className="text-[15px] leading-relaxed text-ink-600 max-w-[48ch]">
          Once the Missions program launches, contributors who fact-check, translate, and surface local data will appear here — ranked by points and editorial impact.
        </p>

        <div className="mt-10 space-y-px">
          {["#1 — ???", "#2 — ???", "#3 — ???"].map((row) => (
            <div key={row} className="border border-ink-200/70 px-6 py-4 text-[14px] text-ink-300 font-mono">
              {row}
            </div>
          ))}
        </div>

        <div className="mt-10">
          <Link
            href="/missions"
            className="inline-flex items-center bg-ink text-paper px-5 py-2.5 text-[13px] font-medium tracking-wide hover:bg-ink-700 transition-colors"
          >
            Learn about Missions →
          </Link>
        </div>
      </div>
    </div>
  );
}
