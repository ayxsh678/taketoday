import Link from "next/link";

const ITEMS = [
  {
    href: "/contribute",
    label: "Contribute",
    desc: "Submit reports, investigations, tips & documents",
    tag: "Write",
  },
  {
    href: "/investigate",
    label: "Investigate",
    desc: "Collaborate on open investigations with journalists",
    tag: "Dig",
  },
  {
    href: "/missions",
    label: "Missions",
    desc: "Complete civic journalism quests and earn badges",
    tag: "Earn",
  },
  {
    href: "/leaderboard",
    label: "Leaderboard",
    desc: "Top contributors ranked by reputation and impact",
    tag: "Rank",
  },
] as const;

export function OpenJournalismStrip() {
  return (
    <section
      aria-label="Open journalism"
      className="mx-auto max-w-[1400px] px-6 lg:px-10 py-12 border-t border-ink-200/60"
    >
      <div className="flex items-center gap-3 mb-6">
        <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-ink-500">
          Open Journalism
        </p>
        <span className="flex-1 h-px bg-ink-200/60" />
        <Link
          href="/contribute/register"
          className="font-mono text-[10px] tracking-[0.18em] uppercase text-accent hover:underline"
        >
          Join as contributor →
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-ink-200/30 border border-ink-200/30">
        {ITEMS.map(({ href, label, desc, tag }) => (
          <Link
            key={href}
            href={href}
            className="group bg-paper p-5 hover:bg-ink hover:text-paper transition-colors duration-200"
          >
            <p className="font-mono text-[9px] tracking-[0.22em] uppercase text-ink-400 group-hover:text-paper/50 mb-3">
              {tag}
            </p>
            <p className="font-serif italic text-[22px] leading-tight tracking-tight text-ink group-hover:text-paper mb-2">
              {label}
            </p>
            <p className="text-[12px] leading-relaxed text-ink-600 group-hover:text-paper/70">
              {desc}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
