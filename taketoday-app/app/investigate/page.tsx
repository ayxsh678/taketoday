import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: `Investigate — ${SITE.name}`,
  description: "Collaborative investigations powered by the TakeToday community.",
};

export default function InvestigatePage() {
  return (
    <div className="mx-auto max-w-[1400px] px-6 lg:px-10 pt-16 lg:pt-24 pb-24">
      <nav aria-label="Breadcrumb" className="font-mono text-[10px] tracking-[0.22em] uppercase text-ink-500">
        <Link href="/" className="reveal hover:text-ink">Home</Link>
        <span aria-hidden className="mx-2 text-ink-300">/</span>
        <span className="text-ink">Investigate</span>
      </nav>

      <header className="mt-8 max-w-2xl">
        <h1 className="font-serif text-[56px] lg:text-[72px] leading-[1.0] tracking-[-0.03em] text-ink">
          Investigate<br />
          <span className="italic text-ink-400">Together.</span>
        </h1>
        <p className="mt-6 text-[17px] leading-relaxed text-ink-500 max-w-[52ch]">
          Collaborative, community-powered investigations. Coming soon.
        </p>
      </header>

      <div className="mt-14 border-t border-ink-200/70 pt-12 max-w-2xl">
        <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-ink-400 mb-6">What&rsquo;s coming</p>
        <div className="space-y-6 text-[15px] leading-relaxed text-ink-600">
          <p>Open investigation threads where readers contribute documents, data, and local knowledge. Vetted leads get elevated to the editorial team. Every contributor is credited.</p>
          <p>Think of it as distributed journalism — the story lives in the crowd before it makes it to the page.</p>
        </div>

        <div className="mt-10 border border-ink-200/70 p-6 inline-block">
          <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-ink-400 mb-3">Get notified</p>
          <p className="text-[14px] text-ink-600 mb-4">Be the first to know when Investigate launches.</p>
          <Link
            href="/subscribe"
            className="inline-flex items-center bg-ink text-paper px-5 py-2.5 text-[13px] font-medium tracking-wide hover:bg-ink-700 transition-colors"
          >
            Subscribe free →
          </Link>
        </div>
      </div>
    </div>
  );
}
