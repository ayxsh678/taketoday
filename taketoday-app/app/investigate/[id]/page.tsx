import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import Link from "next/link";

type Params = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const inv = await prisma.investigation.findUnique({ where: { id }, select: { title: true, description: true } });
  if (!inv) return { title: "Not found" };
  return { title: `${inv.title} — Investigation`, description: inv.description ?? undefined };
}

const roleColors: Record<string, string> = {
  LEAD: "bg-purple-50 text-purple-700",
  EDITOR: "bg-blue-50 text-blue-700",
  RESEARCHER: "bg-green-50 text-green-700",
  FACT_CHECKER: "bg-orange-50 text-orange-700",
  VIEWER: "bg-gray-100 text-gray-600",
};

const statusColors: Record<string, string> = {
  ACTIVE: "bg-green-50 text-green-700",
  ON_HOLD: "bg-yellow-50 text-yellow-700",
  PUBLISHED: "bg-blue-50 text-blue-700",
  CLOSED: "bg-gray-100 text-gray-600",
  ARCHIVED: "bg-gray-100 text-gray-500",
};

export default async function InvestigationPage({ params }: Params) {
  const { id } = await params;

  const investigation = await prisma.investigation.findUnique({
    where: { id },
    include: {
      members: {
        include: {
          user: {
            select: {
              id: true, username: true, displayName: true, avatar: true,
              isVerifiedJournalist: true,
              reputation: { select: { tier: true } },
            },
          },
        },
        orderBy: { joinedAt: "asc" },
      },
      boards: {
        include: { _count: { select: { cards: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!investigation) notFound();

  return (
    <div className="min-h-screen bg-paper">
      <div className="max-w-5xl mx-auto px-4 py-10">

        {/* Header */}
        <div className="mb-8">
          <Link href="/investigate" className="text-sm text-ink/50 hover:text-ink mb-3 block">← Investigations</Link>
          <div className="flex flex-wrap items-start gap-3 mb-3">
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColors[investigation.status] ?? ""}`}>
              {investigation.status}
            </span>
            {!investigation.isPublic && (
              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-ink/8 text-ink/60">🔒 Private</span>
            )}
          </div>
          <h1 className="font-instrument text-4xl text-ink mb-3">{investigation.title}</h1>
          {investigation.description && (
            <p className="text-ink/70 text-base max-w-2xl leading-relaxed">{investigation.description}</p>
          )}
          {investigation.targetEntity && (
            <div className="mt-3 text-sm text-ink/60">
              <span className="font-medium text-ink/80">Subject:</span> {investigation.targetEntity}
            </div>
          )}
          {investigation.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {investigation.tags.map((tag) => (
                <span key={tag} className="text-xs px-2.5 py-1 bg-ink/5 border border-ink/8 rounded-full text-ink/60">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Research boards */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-medium text-ink">Research boards ({investigation.boards.length})</h2>
              <Link
                href={`/investigate/${id}/board/new`}
                className="text-xs border border-ink/15 text-ink/70 px-3 py-1.5 rounded-lg hover:bg-ink/5"
              >
                + New board
              </Link>
            </div>

            {investigation.boards.length === 0 ? (
              <div className="border-2 border-dashed border-ink/10 rounded-xl p-8 text-center">
                <div className="text-2xl mb-2">📋</div>
                <div className="text-sm text-ink/60 mb-3">No boards yet</div>
                <Link
                  href={`/investigate/${id}/board/new`}
                  className="text-sm text-ink font-medium hover:underline"
                >
                  Create first research board →
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {investigation.boards.map((board) => (
                  <Link
                    key={board.id}
                    href={`/investigate/${id}/board/${board.id}`}
                    className="flex items-center justify-between border border-ink/10 rounded-xl p-4 hover:border-ink/25 hover:bg-ink/2 transition-all"
                  >
                    <div>
                      <div className="font-medium text-ink">{board.name}</div>
                      {board.description && (
                        <div className="text-xs text-ink/50 mt-0.5">{board.description}</div>
                      )}
                    </div>
                    <div className="text-xs text-ink/40 shrink-0">{board._count.cards} cards</div>
                  </Link>
                ))}
              </div>
            )}

            {/* Quick actions */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <Link
                href={`/contribute/new?type=INVESTIGATION`}
                className="flex items-center gap-2 border border-ink/10 rounded-xl p-4 hover:border-ink/20 hover:bg-ink/2 transition-all"
              >
                <span className="text-lg">✍️</span>
                <div>
                  <div className="text-sm font-medium text-ink">Write story</div>
                  <div className="text-xs text-ink/50">Turn findings into article</div>
                </div>
              </Link>
              <Link
                href={`/contribute/${id}/evidence`}
                className="flex items-center gap-2 border border-ink/10 rounded-xl p-4 hover:border-ink/20 hover:bg-ink/2 transition-all"
              >
                <span className="text-lg">📎</span>
                <div>
                  <div className="text-sm font-medium text-ink">Add evidence</div>
                  <div className="text-xs text-ink/50">Upload docs, images, files</div>
                </div>
              </Link>
            </div>
          </div>

          {/* Team sidebar */}
          <div className="space-y-4">
            <div className="border border-ink/10 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-ink">Team ({investigation.members.length})</h3>
                <Link
                  href={`/investigate/${id}/members`}
                  className="text-xs text-ink/50 hover:text-ink"
                >
                  Manage
                </Link>
              </div>
              <div className="space-y-3">
                {investigation.members.map((m) => (
                  <div key={m.userId} className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-ink/10 flex items-center justify-center text-xs font-medium text-ink shrink-0">
                      {m.user.displayName[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <Link href={`/profile/${m.user.username}`} className="text-xs font-medium text-ink hover:underline truncate">
                          {m.user.displayName}
                        </Link>
                        {m.user.isVerifiedJournalist && <span className="text-blue-500 text-xs">✓</span>}
                      </div>
                      <div className="text-xs text-ink/40">@{m.user.username}</div>
                    </div>
                    <span className={`text-xs px-1.5 py-0.5 rounded ${roleColors[m.role] ?? ""}`}>
                      {m.role}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="border border-ink/10 rounded-xl p-4">
              <h3 className="text-sm font-medium text-ink mb-2">Investigation details</h3>
              <div className="space-y-1.5 text-xs text-ink/60">
                <div className="flex justify-between">
                  <span>Created</span>
                  <span>{new Date(investigation.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Updated</span>
                  <span>{new Date(investigation.updatedAt).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Visibility</span>
                  <span>{investigation.isPublic ? "Public" : "Private"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
