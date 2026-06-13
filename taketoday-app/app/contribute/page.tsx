import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: `Contribute — ${SITE.name}`,
  description: "Submit a tip, investigation lead, or story idea to TakeToday.",
};

export default function ContributePage() {
  return (
    <div className="mx-auto max-w-[1400px] px-6 lg:px-10 pt-16 lg:pt-24 pb-24">
      <nav aria-label="Breadcrumb" className="font-mono text-[10px] tracking-[0.22em] uppercase text-ink-500">
        <Link href="/" className="reveal hover:text-ink">Home</Link>
        <span aria-hidden className="mx-2 text-ink-300">/</span>
        <span className="text-ink">Contribute</span>
      </nav>

      <header className="mt-8 max-w-2xl">
        <h1 className="font-serif text-[56px] lg:text-[72px] leading-[1.0] tracking-[-0.03em] text-ink">
          Open<br />
          <span className="italic text-ink-400">Journalism.</span>
        </h1>
        <p className="mt-6 text-[17px] leading-relaxed text-ink-500 max-w-[52ch]">
          Have a tip, story lead, or exclusive? We read everything sent to us.
        </p>
      </header>

      <div className="mt-14 border-t border-ink-200/70 pt-12 grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-7 space-y-8 text-[16px] leading-relaxed text-ink-700">
          <section>
            <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-ink-400 mb-4">How it works</p>
            <p>Send your tip to <a href="mailto:tips@taketoday.co" className="underline underline-offset-2 hover:text-ink">tips@taketoday.co</a>. Include as much context as you can — documents, sources, or a short summary. All submissions are treated confidentially.</p>
          </section>

          <section>
            <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-ink-400 mb-4">What we cover</p>
            <ul className="space-y-2">
              {["AI & machine learning", "Finance & markets", "Tech & startups", "Corporate wrongdoing", "Policy & regulation"].map((t) => (
                <li key={t} className="flex items-center gap-3 text-[15px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-ink-300 shrink-0" />
                  {t}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-ink-400 mb-4">Secure drop</p>
            <p className="text-[15px] text-ink-500">For sensitive material, email us first and we&rsquo;ll arrange a secure channel. We do not log IP addresses or metadata from tip submissions.</p>
          </section>
        </div>

        <aside className="lg:col-span-4 lg:col-start-9">
          <div className="border border-ink-200/70 p-8 space-y-6">
            <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-ink-400">Contact</p>
            <div className="space-y-4 text-[14px]">
              <div>
                <p className="text-ink-400 text-[12px] mb-1">Tips & investigations</p>
                <a href="mailto:tips@taketoday.co" className="text-ink underline underline-offset-2 hover:text-ink-700">tips@taketoday.co</a>
              </div>
              <div>
                <p className="text-ink-400 text-[12px] mb-1">Editorial</p>
                <a href="mailto:editorial@taketoday.co" className="text-ink underline underline-offset-2 hover:text-ink-700">editorial@taketoday.co</a>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
