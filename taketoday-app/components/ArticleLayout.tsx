import Link from "next/link";
import type { Category, Takeaways } from "@/types/article";
import type { ArticleDoc } from "@/lib/content/queries";
import { ReadingProgressBar } from "@/components/ReadingProgressBar";
import { ArticleShareBar } from "@/components/ArticleShareBar";
import { NewsCard } from "@/components/NewsCard";
import { SITE } from "@/lib/site";

/* ── Types ────────────────────────────────────────────────────────────────── */

export type RelatedArticle = Readonly<{
  slug: string;
  title: string;
  category: Category;
  readTime: string;
  publishedAt: string;
  quickTake: string;
}>;

export type ArticleLayoutProps = Readonly<{
  slug: string;
  title: string;
  deck: string;
  category: Category;
  readTime: string;
  publishedAt: string;
  updatedAt?: string;
  author: { name: string; type: string };
  quickTake: string;
  whyItMatters: string;
  takeaways: Takeaways;
  body: React.ReactNode;
  image?: string;
  relatedArticles?: readonly RelatedArticle[];
}>;

/* ── Helper ───────────────────────────────────────────────────────────────── */

export function articleToLayoutProps(
  article: ArticleDoc,
  body: React.ReactNode,
  relatedArticles?: readonly RelatedArticle[],
  image?: string
): ArticleLayoutProps {
  return {
    slug: article.slug,
    title: article.title,
    deck: article.deck,
    category: article.category,
    readTime: article.readTime,
    publishedAt: article.publishedAt,
    updatedAt: article.updatedAt,
    author: article.author,
    quickTake: article.quickTake,
    whyItMatters: article.whyItMatters,
    takeaways: article.takeaways as unknown as Takeaways,
    body,
    image,
    relatedArticles,
  };
}

/* ── Category hero gradient ───────────────────────────────────────────────── */

const CATEGORY_GRADIENTS: Record<Category, string> = {
  AI:            "from-[#0a0a0a] via-[#111] to-[#1a1a2e]",
  Finance:       "from-[#0a0a0a] via-[#0f1a0f] to-[#0a1a12]",
  Tech:          "from-[#0a0a0a] via-[#111] to-[#1a1520]",
  Startups:      "from-[#0a0a0a] via-[#1a100a] to-[#1f1208]",
  Briefings:     "from-[#0a0a0a] via-[#111] to-[#1a1a1a]",
  India:         "from-[#0a0a0a] via-[#1a110a] to-[#1f1508]",
  International: "from-[#0a0a0a] via-[#0a0f1a] to-[#0a1020]",
};

/* ── Main layout ──────────────────────────────────────────────────────────── */

export function ArticleLayout(props: ArticleLayoutProps) {
  const {
    slug,
    title,
    deck,
    category,
    readTime,
    publishedAt,
    updatedAt,
    author,
    quickTake,
    whyItMatters,
    takeaways,
    body,
    image,
    relatedArticles,
  } = props;

  const published = new Date(publishedAt);
  const modified = updatedAt ? new Date(updatedAt) : undefined;
  const articleUrl = `${SITE.url}/article/${slug}`;
  const gradient = CATEGORY_GRADIENTS[category] ?? CATEGORY_GRADIENTS.Briefings;

  return (
    <article className="relative">
      <ReadingProgressBar />

      {/* ── Hero banner ─────────────────────────────────────────────────── */}
      <div
        className={`bg-linear-to-br ${gradient} w-full`}
        aria-hidden
      >
        <div className="mx-auto max-w-215 px-6 lg:px-10 pt-16 lg:pt-24 pb-12 lg:pb-16">
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="font-mono text-[10px] tracking-[0.22em] uppercase">
            <Link href="/" className="text-ink-400 hover:text-ink-300 transition-colors">Home</Link>
            <span aria-hidden className="mx-2 text-ink-500">/</span>
            <Link href={`/category/${category.toLowerCase()}`} className="text-ink-400 hover:text-ink-300 transition-colors">
              {category}
            </Link>
          </nav>

          {/* Category label */}
          <p className="mt-6 font-mono text-[10px] tracking-[0.22em] uppercase text-accent">
            {category}
          </p>

          {/* Title */}
          <h1
            id="article-title"
            className="mt-4 font-serif text-[40px] sm:text-[52px] lg:text-[68px] leading-[1.02] tracking-tighter-2 text-paper hyphens-auto text-pretty"
          >
            {title}
          </h1>

          {/* Deck */}
          <p className="mt-5 max-w-[60ch] text-[17px] lg:text-[18px] leading-relaxed text-ink-300">
            {deck}
          </p>

          {/* Meta row */}
          <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-[11px] tracking-[0.18em] uppercase text-ink-400">
            <span>
              By <span className="text-ink-200">{author.name}</span>
            </span>
            <span aria-hidden className="text-ink-600">/</span>
            <time dateTime={publishedAt}>
              {published.toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </time>
            {modified && (
              <>
                <span aria-hidden className="text-ink-600">/</span>
                <time dateTime={updatedAt} className="text-ink-500">
                  Updated{" "}
                  {modified.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </time>
              </>
            )}
            <span aria-hidden className="text-ink-600">/</span>
            <span>{readTime}</span>
          </div>
        </div>
      </div>

      {/* ── Cover image ─────────────────────────────────────────────────── */}
      {image && (
        <div className="mx-auto max-w-215 px-6 lg:px-10 mt-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image}
            alt={title}
            className="w-full rounded-lg object-cover max-h-130"
          />
        </div>
      )}

      {/* ── Share bar ───────────────────────────────────────────────────── */}
      <div className="mx-auto max-w-215 px-6 lg:px-10">
        <ArticleShareBar title={title} url={articleUrl} />
      </div>

      {/* ── Quick Take ──────────────────────────────────────────────────── */}
      {quickTake && (
        <section
          aria-labelledby="quick-take-heading"
          className="mx-auto max-w-215 px-6 lg:px-10 py-8 border-y border-ink-200/70 mt-8"
        >
          <h2
            id="quick-take-heading"
            className="font-mono text-[10px] tracking-[0.22em] uppercase text-accent"
          >
            Quick Take
          </h2>
          <p className="mt-4 font-serif italic text-[24px] lg:text-[28px] leading-tight tracking-tight text-ink text-balance">
            {quickTake}
          </p>
        </section>
      )}

      {/* ── Body ────────────────────────────────────────────────────────── */}
      <section aria-label="Article body" className="article mx-auto max-w-[68ch] px-6 lg:px-10 py-14">
        {body}
      </section>

      {/* ── Why It Matters ──────────────────────────────────────────────── */}
      {whyItMatters && (
        <section aria-labelledby="why-heading" className="bg-ink text-paper">
          <div className="mx-auto max-w-215 px-6 lg:px-10 py-16 lg:py-20">
            <h2
              id="why-heading"
              className="font-mono text-[10px] tracking-[0.22em] uppercase text-accent"
            >
              Why It Matters
            </h2>
            <p className="mt-5 font-serif text-[26px] lg:text-[32px] leading-tight tracking-tight text-paper text-balance">
              {whyItMatters}
            </p>
          </div>
        </section>
      )}

      {/* ── Takeaways ───────────────────────────────────────────────────── */}
      {takeaways.length > 0 && (
        <section
          aria-labelledby="takeaways-heading"
          className="mx-auto max-w-215 px-6 lg:px-10 py-16 lg:py-20"
        >
          <h2
            id="takeaways-heading"
            className="font-mono text-[10px] tracking-[0.22em] uppercase text-ink-500"
          >
            Takeaways
          </h2>
          <ol className="mt-8 space-y-6">
            {takeaways.map((t, i) => (
              <li key={i} className="grid grid-cols-[auto_1fr] gap-5 items-start">
                <span
                  aria-hidden
                  className="font-mono text-[11px] tracking-[0.18em] text-ink-400 pt-1.5"
                >
                  0{i + 1}
                </span>
                <p className="text-[18px] leading-relaxed text-ink-700 text-pretty">{t}</p>
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* ── Author block ────────────────────────────────────────────────── */}
      <section
        aria-label="About the author"
        className="mx-auto max-w-215 px-6 lg:px-10 py-10 border-t border-ink-200/70"
      >
        <div className="flex items-start gap-5">
          <div
            aria-hidden
            className="w-12 h-12 rounded-full bg-ink flex items-center justify-center shrink-0 mt-0.5"
          >
            <span className="font-serif italic text-paper text-[18px] leading-none">T</span>
          </div>
          <div>
            <p className="font-medium text-[15px] text-ink">{author.name}</p>
            <p className="mt-1 text-[13px] text-ink-500 leading-relaxed max-w-[52ch]">
              {author.type === "Organization"
                ? "TakeToday Newsroom covers AI, finance, tech, and startups — distilling complex developments into what actually matters."
                : "Contributing writer at TakeToday."}
            </p>
          </div>
        </div>
      </section>

      {/* ── Bottom share ────────────────────────────────────────────────── */}
      <div className="mx-auto max-w-215 px-6 lg:px-10 pb-10 border-t border-ink-200/70 pt-8">
        <ArticleShareBar title={title} url={articleUrl} />
      </div>

      {/* ── Related stories ─────────────────────────────────────────────── */}
      {relatedArticles && relatedArticles.length > 0 && (
        <section
          aria-labelledby="related-heading"
          className="border-t border-ink-200/70 bg-ink-100/30"
        >
          <div className="mx-auto max-w-site px-6 lg:px-10 py-16 lg:py-20">
            <h2
              id="related-heading"
              className="font-serif italic text-[32px] lg:text-[40px] tracking-tight text-ink mb-12"
            >
              More from {category}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-14">
              {relatedArticles.map((a) => (
                <NewsCard
                  key={a.slug}
                  slug={a.slug}
                  title={a.title}
                  summary={a.quickTake}
                  category={a.category}
                  readTime={a.readTime}
                  publishedAt={a.publishedAt}
                  variant="grid"
                />
              ))}
            </div>
            <div className="mt-10">
              <Link
                href={`/category/${category.toLowerCase()}`}
                className="inline-flex items-center rounded-full border border-ink-300 text-ink px-5 py-2.5 text-[13px] font-medium tracking-wide hover:border-ink hover:bg-ink hover:text-paper transition-colors"
              >
                All {category} stories →
              </Link>
            </div>
          </div>
        </section>
      )}
    </article>
  );
}
