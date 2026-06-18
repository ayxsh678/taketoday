import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/lib/site";
import { TipSubmissionForm } from "@/components/contribute/TipSubmissionForm";

export const metadata: Metadata = {
  title: `Contribute — ${SITE.name}`,
  description: "Submit a tip, investigation lead, document, or story idea to TakeToday.",
};

export default function ContributePage() {
  return (
    <div className="mx-auto max-w-site px-6 lg:px-10 pt-16 lg:pt-24 pb-24">
      <nav aria-label="Breadcrumb" className="font-mono text-[10px] tracking-[0.22em] uppercase text-ink-500">
        <Link href="/" className="reveal hover:text-ink">Home</Link>
        <span aria-hidden className="mx-2 text-ink-300">/</span>
        <span className="text-ink">Contribute</span>
      </nav>

      <header className="mt-8 max-w-2xl">
        <h1 className="font-serif text-[56px] lg:text-[72px] leading-none tracking-tighter-2 text-ink">
          Open<br />
          <span className="italic text-ink-400">Journalism.</span>
        </h1>
        <p className="mt-6 text-[17px] leading-relaxed text-ink-500 max-w-[52ch]">
          Have a tip, story lead, document, or leak? Submit it here. Every
          submission reaches our editorial team directly.
        </p>
      </header>

      <div className="mt-14 border-t border-ink-200/70 pt-12 grid grid-cols-1 lg:grid-cols-12 gap-14">
        {/* Form */}
        <div className="lg:col-span-7">
          <TipSubmissionForm />
        </div>

        {/* Sidebar */}
        <aside className="lg:col-span-4 lg:col-start-9 space-y-8">
          <div className="border border-ink-200/70 p-8 space-y-6">
            <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-ink-400">Contact</p>
            <div className="space-y-4 text-[14px]">
              <div>
                <p className="text-ink-400 text-[11px] mb-1">Tips & investigations</p>
                <a
                  href="mailto:tips@taketoday.co"
                  className="text-ink underline underline-offset-2 hover:text-ink-700"
                >
                  tips@taketoday.co
                </a>
              </div>
              <div>
                <p className="text-ink-400 text-[11px] mb-1">Editorial</p>
                <a
                  href="mailto:editorial@taketoday.co"
                  className="text-ink underline underline-offset-2 hover:text-ink-700"
                >
                  editorial@taketoday.co
                </a>
              </div>
            </div>
          </div>

          <div className="space-y-4 text-[14px] text-ink-600">
            <div>
              <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-ink-400 mb-3">
                What we cover
              </p>
              <ul className="space-y-2">
                {[
                  "AI & machine learning",
                  "Finance & markets",
                  "Technology & startups",
                  "Corporate wrongdoing",
                  "Policy & regulation",
                ].map((t) => (
                  <li key={t} className="flex items-center gap-3 text-[14px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-ink-300 shrink-0" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>

            <div className="border-t border-ink-200/70 pt-4">
              <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-ink-400 mb-3">
                Confidentiality
              </p>
              <p className="text-[13px] text-ink-500 leading-relaxed">
                Anonymous submissions store no identifying metadata. For
                particularly sensitive material, email us first to arrange a
                secure channel.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
