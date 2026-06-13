import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: `Missions — ${SITE.name}`,
  description: "Reader missions — contribute, earn points, shape coverage.",
};

export default function MissionsPage() {
  return (
    <div className="mx-auto max-w-[1400px] px-6 lg:px-10 pt-16 lg:pt-24 pb-24">
      <nav aria-label="Breadcrumb" className="font-mono text-[10px] tracking-[0.22em] uppercase text-ink-500">
        <Link href="/" className="reveal hover:text-ink">Home</Link>
        <span aria-hidden className="mx-2 text-ink-300">/</span>
        <span className="text-ink">Missions</span>
      </nav>

      <header className="mt-8 max-w-2xl">
        <h1 className="font-serif text-[56px] lg:text-[72px] leading-[1.0] tracking-[-0.03em] text-ink">
          Reader<br />
          <span className="italic text-ink-400">Missions.</span>
        </h1>
        <p className="mt-6 text-[17px] leading-relaxed text-ink-500 max-w-[52ch]">
          Earn points by helping shape TakeToday&rsquo;s coverage. Coming soon.
        </p>
      </header>

      <div className="mt-14 border-t border-ink-200/70 pt-12 max-w-3xl">
        <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-ink-400 mb-8">How missions work</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          {[
            { step: "01", title: "Pick a mission", body: "Fact-check a claim, translate a document, or surface a local data point." },
            { step: "02", title: "Submit your work", body: "Editors review submissions and integrate the best into live articles." },
            { step: "03", title: "Earn recognition", body: "Points, credits, and bylines for contributors whose work makes it to print." },
          ].map(({ step, title, body }) => (
            <div key={step} className="border-t-2 border-ink pt-6">
              <p className="font-mono text-[10px] tracking-[0.22em] text-ink-400 mb-3">{step}</p>
              <h2 className="font-serif text-[22px] text-ink mb-2">{title}</h2>
              <p className="text-[14px] text-ink-500 leading-relaxed">{body}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 border border-ink-200/70 p-6 inline-block">
          <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-ink-400 mb-3">Launching soon</p>
          <Link
            href="/subscribe"
            className="inline-flex items-center bg-ink text-paper px-5 py-2.5 text-[13px] font-medium tracking-wide hover:bg-ink-700 transition-colors"
          >
            Get notified →
          </Link>
        </div>
      </div>
    </div>
  );
}
