import Link from "next/link";
import { Images, Clapperboard, Send, Clock, History } from "lucide-react";

const cards = [
  {
    href: "/admin/studio/carousel",
    icon: Images,
    title: "Carousel Generator",
    description: "Generate multi-slide Instagram carousels from a topic or article using Gemini AI.",
    color: "from-blue-500 to-indigo-600",
  },
  {
    href: "/admin/studio/reels",
    icon: Clapperboard,
    title: "Reel Script Generator",
    description: "Create structured short-form video scripts with hook, body, and CTA.",
    color: "from-purple-500 to-pink-600",
  },
  {
    href: "/admin/studio/compose",
    icon: Send,
    title: "Post Composer",
    description: "Write and publish posts to Instagram, LinkedIn, Twitter/X, and WhatsApp.",
    color: "from-green-500 to-teal-600",
  },
  {
    href: "/admin/studio/scheduled",
    icon: Clock,
    title: "Scheduled Posts",
    description: "View and manage queued posts across all platforms.",
    color: "from-orange-500 to-amber-600",
  },
  {
    href: "/admin/studio/scheduled?status=POSTED",
    icon: History,
    title: "Published History",
    description: "Review all published posts and their performance.",
    color: "from-slate-500 to-zinc-600",
  },
];

export default function StudioPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Content Studio</h1>
        <p className="text-muted-foreground mt-1">Generate, compose, and publish social content from one place.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.href}
              href={card.href}
              className="group rounded-xl border bg-card hover:shadow-md transition-shadow overflow-hidden"
            >
              <div className={`bg-gradient-to-br ${card.color} p-4 flex items-center justify-center`}>
                <Icon className="size-8 text-white" />
              </div>
              <div className="p-4">
                <h2 className="font-semibold text-sm group-hover:text-primary transition-colors">{card.title}</h2>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{card.description}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
