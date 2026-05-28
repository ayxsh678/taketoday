import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Contribute — TakeToday Open Journalism",
  description:
    "Join TakeToday's open journalism platform. Submit reports, investigations, research, and stories. Collaborate with journalists, fact-checkers, and researchers worldwide.",
};

const contributionTypes = [
  { type: "BREAKING_NEWS", label: "Breaking News", icon: "⚡", desc: "Time-sensitive news reports" },
  { type: "INVESTIGATION", label: "Investigation", icon: "🔍", desc: "Deep investigative reporting" },
  { type: "RESEARCH", label: "Research", icon: "📊", desc: "Data and research findings" },
  { type: "EXPLAINER", label: "Explainer", icon: "💡", desc: "Context and background on issues" },
  { type: "DATA_JOURNALISM", label: "Data Journalism", icon: "📈", desc: "Stories driven by data" },
  { type: "THREAD", label: "Thread", icon: "🧵", desc: "Structured narrative threads" },
  { type: "DOCUMENT_LEAK", label: "Document", icon: "📄", desc: "Documents and leaked records" },
  { type: "WHISTLEBLOWER_TIP", label: "Tip", icon: "🔒", desc: "Anonymous tips and whistleblowing" },
];

const roles = [
  { role: "Writers", desc: "Draft articles and news reports" },
  { role: "Researchers", desc: "Dig into data and documents" },
  { role: "Fact-checkers", desc: "Verify claims and sources" },
  { role: "Photographers", desc: "Contribute visual journalism" },
  { role: "Local Citizens", desc: "Report what you witness" },
  { role: "Analysts", desc: "Provide expert commentary" },
  { role: "Whistleblowers", desc: "Share sensitive information safely" },
  { role: "Students", desc: "Learn journalism by doing it" },
];

export default function ContributePage() {
  return (
    <div className="min-h-screen bg-paper">
      {/* Hero */}
      <section className="border-b border-ink/10 py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-block bg-ink/5 border border-ink/10 rounded-full px-4 py-1 text-sm font-mono text-ink/60 mb-6">
            Open Journalism Platform
          </div>
          <h1 className="font-instrument text-5xl md:text-6xl text-ink mb-6 leading-tight">
            Journalism is a{" "}
            <em>collective act</em>
          </h1>
          <p className="text-ink/70 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            TakeToday is building an open newsroom. Submit reports, collaborate on investigations,
            fact-check stories, and help shape the information that matters.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/contribute/register"
              className="bg-ink text-paper px-8 py-3 rounded-lg font-medium hover:bg-ink/90 transition-colors"
            >
              Join as Contributor
            </Link>
            <Link
              href="/contribute/new"
              className="border border-ink/20 text-ink px-8 py-3 rounded-lg font-medium hover:bg-ink/5 transition-colors"
            >
              Submit a Story
            </Link>
          </div>
        </div>
      </section>

      {/* Who can contribute */}
      <section className="py-16 px-4 border-b border-ink/10">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-instrument text-3xl text-ink mb-2 text-center">Anyone can contribute</h2>
          <p className="text-ink/60 text-center mb-10">No press card required. Expertise and community trust matter.</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {roles.map((r) => (
              <div key={r.role} className="bg-ink/3 border border-ink/8 rounded-xl p-4">
                <div className="font-medium text-ink mb-1">{r.role}</div>
                <div className="text-ink/60 text-sm">{r.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What you can submit */}
      <section className="py-16 px-4 border-b border-ink/10">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-instrument text-3xl text-ink mb-2 text-center">What you can submit</h2>
          <p className="text-ink/60 text-center mb-10">Every format serves a purpose in the journalism ecosystem.</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {contributionTypes.map((t) => (
              <Link
                key={t.type}
                href={`/contribute/new?type=${t.type}`}
                className="bg-ink/3 border border-ink/8 rounded-xl p-4 hover:border-ink/20 hover:bg-ink/5 transition-all group"
              >
                <div className="text-2xl mb-2">{t.icon}</div>
                <div className="font-medium text-ink mb-1">{t.label}</div>
                <div className="text-ink/60 text-sm">{t.desc}</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 px-4 border-b border-ink/10">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-instrument text-3xl text-ink mb-10 text-center">How it works</h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { step: "1", title: "Submit", desc: "Write your story, upload evidence, cite sources" },
              { step: "2", title: "Verify", desc: "Community votes and fact-checkers review claims" },
              { step: "3", title: "Edit", desc: "Editors collaborate with you to strengthen the piece" },
              { step: "4", title: "Publish", desc: "Story goes live with full transparency trail" },
            ].map((s) => (
              <div key={s.step} className="text-center">
                <div className="w-10 h-10 rounded-full bg-ink text-paper flex items-center justify-center font-mono font-bold mx-auto mb-3">
                  {s.step}
                </div>
                <div className="font-medium text-ink mb-1">{s.title}</div>
                <div className="text-ink/60 text-sm">{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Transparency */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-instrument text-3xl text-ink mb-2 text-center">Radical transparency</h2>
          <p className="text-ink/60 text-center mb-10 max-w-xl mx-auto">
            Every published story shows its full trail — who contributed, what sources were used,
            how the AI helped, what was fact-checked, and every edit ever made.
          </p>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { icon: "🔗", label: "Source graph", desc: "Every citation is public and scored" },
              { icon: "📝", label: "Edit history", desc: "Full version history like GitHub" },
              { icon: "🤖", label: "AI disclosure", desc: "All AI assistance is disclosed" },
              { icon: "✅", label: "Fact-check log", desc: "Every claim that was verified" },
              { icon: "👥", label: "Contributor trail", desc: "Everyone who worked on it" },
              { icon: "⚖️", label: "Editorial record", desc: "Why decisions were made" },
            ].map((t) => (
              <div key={t.label} className="flex gap-3 p-4 bg-ink/3 border border-ink/8 rounded-xl">
                <span className="text-xl">{t.icon}</span>
                <div>
                  <div className="font-medium text-ink text-sm">{t.label}</div>
                  <div className="text-ink/60 text-xs mt-0.5">{t.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
