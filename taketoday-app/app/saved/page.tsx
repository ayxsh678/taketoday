import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { db } from "@/lib/firebase/admin";
import { getArticle } from "@/lib/content/queries";
import { NewsCard } from "@/components/NewsCard";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Saved — TakeToday",
};

export default async function SavedPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin?callbackUrl=/saved");

  const snapshot = await db
    .collection("bookmarks")
    .doc(session.user.id)
    .collection("articles")
    .orderBy("savedAt", "desc")
    .get();

  const slugs = snapshot.docs.map((d) => d.id);

  const articles = slugs
    .map((slug) => getArticle(slug))
    .filter((a): a is NonNullable<typeof a> => a !== null && a !== undefined);

  return (
    <div className="mx-auto max-w-[1400px] px-6 lg:px-10 py-16">
      <div className="mb-10">
        <h1 className="font-serif text-[40px] lg:text-[56px] leading-tight tracking-tight">
          Saved
        </h1>
        <p className="mt-2 text-sm text-ink-500">
          {articles.length === 0
            ? "No saved articles yet."
            : `${articles.length} article${articles.length === 1 ? "" : "s"}`}
        </p>
      </div>

      {articles.length === 0 ? (
        <div className="py-24 text-center space-y-4">
          <p className="text-ink-500">Bookmark articles to read them later.</p>
          <Link
            href="/"
            className="inline-block text-sm font-medium underline underline-offset-4 hover:text-ink-700 transition-colors"
          >
            Browse articles
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
          {articles.map((article) => (
            <NewsCard
              key={article.metadata.slug}
              slug={article.metadata.slug}
              title={article.metadata.title}
              summary={article.content.quickTake}
              category={article.metadata.category}
              readTime={article.metadata.readTime}
              publishedAt={article.metadata.publishedAt}
            />
          ))}
        </div>
      )}
    </div>
  );
}
