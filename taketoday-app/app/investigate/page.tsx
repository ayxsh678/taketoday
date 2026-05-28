import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Investigations — TakeToday",
  description: "Open investigations. Collaborative research rooms for journalists, researchers, and the public.",
};

export default function InvestigationsLandingPage() {
  return (
    <div className="min-h-screen bg-paper">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="mb-12 text-center">
          <div className="inline-block bg-ink/5 border border-ink/10 rounded-full px-4 py-1 text-sm font-mono text-ink/60 mb-6">
            Investigation Engine
          </div>
          <h1 className="font-instrument text-5xl text-ink mb-4">Open Investigations</h1>
          <p className="text-ink/60 text-lg max-w-xl mx-auto mb-8">
            Collaborative research rooms. Upload evidence, map sources, build timelines,
            and investigate together — like a newsroom, but open.
          </p>
          <div className="flex justify-center gap-3">
            <Link href="/investigate/new" className="bg-ink text-paper px-6 py-3 rounded-lg font-medium hover:bg-ink/90 transition-colors">
              Start an investigation
            </Link>
            <Link href="/investigate/browse" className="border border-ink/20 text-ink px-6 py-3 rounded-lg font-medium hover:bg-ink/5 transition-colors">
              Browse public rooms
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {[
            { icon: "📋", title: "Research Boards", desc: "Kanban boards for organizing leads, evidence, and findings" },
            { icon: "🔗", title: "Evidence Linking", desc: "Connect documents, witnesses, and sources to specific findings" },
            { icon: "👥", title: "Team Rooms", desc: "Invite researchers, fact-checkers, editors with role-based access" },
            { icon: "🗺️", title: "Source Mapping", desc: "Visualize relationships between people, orgs, and documents" },
            { icon: "🔒", title: "Private by Default", desc: "Investigations stay private until you choose to publish" },
            { icon: "📰", title: "Publish to Newsroom", desc: "Convert investigation findings into published contributions" },
          ].map((f) => (
            <div key={f.title} className="border border-ink/10 rounded-xl p-5">
              <div className="text-2xl mb-2">{f.icon}</div>
              <div className="font-medium text-ink mb-1">{f.title}</div>
              <div className="text-ink/60 text-sm">{f.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
