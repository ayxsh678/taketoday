import Link from "next/link";
import type {
  Article,
  Author,
  Category,
  Takeaways,
} from "@/types/article";

/**
 * TakeToday — ArticleLayout
 * Five parts, strictly ordered:
 *   1. Header       — category, date, title, dek, byline
 *   2. Quick Take   — 1-sentence TL;DR, serif italic
 *   3. Body         — MDX-rendered prose (`.article` styles)
 *   4. Why it matters — impact paragraph, dark band
 *   5. Takeaways    — exactly three, numbered
 *
 * Accessibility: every section labelled, time elements machine-readable.
 * JSON-LD is emitted by the parent route (app/article/[slug]/page.tsx).
 */

export type ArticleLayoutProps = Readonly<{
  slug: string;
  title: string;
  deck: string;
  category: Category;
  readTime: string;
  publishedAt: string;
  updatedAt?: string;
  author: Author;
  quickTake: string;
  whyItMatters: string;
  takeaways: Takeaways;
  /** Rendered MDX — passed in from the route so this stays a pure view. */
  body: React.ReactNode;
  /** Optional hero image URL; layout degrades gracefully without it. */
  image?: string;
  /** Optional action buttons rendered alongside article metadata (e.g. BookmarkButton). */
  actions?: React.ReactNode;
}>;

/** Flatten the nested `Article` shape into layout props. */
export function articleToLayoutProps(
  article: Article,
  body: React.ReactNode,
  image?: string,
  actions?: React.ReactNode,
): ArticleLayoutProps {
  const { metadata: m, content: c } = article;
  return {
    slug: m.slug,
    title: m.title,
    deck: m.deck,
    category: m.category,
    readTime: m.readTime,
    publishedAt: m.publishedAt,
    updatedAt: m.updatedAt,
    author: m.author,
    quickTake: c.quickTake,
    whyItMatters: c.whyItMatters,
    takeaways: c.takeaways,
    body,
    image,
    actions,
  };
}

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
    actions,
  } = props;

  const published = new Date(publishedAt);
  const modified = updatedAt ? new Date(updatedAt) : undefined;

  return (
    <article className="relative">

      {/* 1. Header */}
      <header
        aria-labelledby="article-title"
        className="mx-auto max-w-[860px] px-6 lg:px-10 pt-16 lg:pt-24 pb-10"
      >
        <nav
          aria-label="Breadcrumb"
          className="font-mono text-[10px] tracking-[0.22em] uppercase text-ink-500"
        >
          <Link href="/" className="reveal hover:text-ink">
            Home
          </Link>
          <span aria-hidden className="mx-2 text-ink-300">
            /
          </span>
          <Link
            href={`/category/${category.toLowerCase()}`}
            className="reveal hover:text-ink"
          >
            {category}
          </Link>
        </nav>

        <h1
          id="article-title"
          className="mt-8 font-serif text-[44px] sm:text-[56px] lg:text-[72px] leading-[1.02] tracking-[-0.03em] text-ink hyphens-auto text-pretty"
        >
          {title}
        </h1>

        <p className="mt-6 max-w-[60ch] text-[18px] leading-relaxed text-ink-500">
          {deck}
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-y-3">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-[11px] tracking-[0.18em] uppercase text-ink-500">
            <span className="text-ink-700">
              By <span className="text-ink">{author.name}</span>
            </span>
            <span aria-hidden className="text-ink-300">
              /
            </span>
            <time dateTime={publishedAt}>
              {published.toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </time>
            {modified && (
              <>
                <span aria-hidden className="text-ink-300">
                  /
                </span>
                <time dateTime={updatedAt} className="text-ink-400">
                  Updated {modified.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </time>
              </>
            )}
            <span aria-hidden className="text-ink-300">
              /
            </span>
            <span>{readTime}</span>
          </div>
          {actions && <div>{actions}</div>}
        </div>
      </header>

      {/* 2. Quick Take */}
      <section
        aria-labelledby="quick-take-heading"
        className="mx-auto max-w-[860px] px-6 lg:px-10 py-8 border-y border-ink-200/70"
      >
        <h2
          id="quick-take-heading"
          className="font-mono text-[10px] tracking-[0.22em] uppercase text-accent"
        >
          Quick Take
        </h2>
        <p className="mt-4 font-serif italic text-[24px] lg:text-[28px] leading-[1.25] tracking-tight text-ink text-balance">
          {quickTake}
        </p>
      </section>

      {/* 3. Body */}
      <section
        aria-label="Article body"
        className="article mx-auto max-w-[68ch] px-6 lg:px-10 py-14"
      >
        {body}
      </section>

      {/* 4. Why it matters */}
      <section
        aria-labelledby="why-heading"
        className="bg-ink text-paper"
      >
        <div className="mx-auto max-w-[860px] px-6 lg:px-10 py-16 lg:py-20">
          <h2
            id="why-heading"
            className="font-mono text-[10px] tracking-[0.22em] uppercase text-accent"
          >
            Why It Matters
          </h2>
          <p className="mt-5 font-serif text-[26px] lg:text-[32px] leading-[1.25] tracking-tight text-paper text-balance">
            {whyItMatters}
          </p>
        </div>
      </section>

      {/* 5. Takeaways */}
      <section
        aria-labelledby="takeaways-heading"
        className="mx-auto max-w-[860px] px-6 lg:px-10 py-16 lg:py-20"
      >
        <h2
          id="takeaways-heading"
          className="font-mono text-[10px] tracking-[0.22em] uppercase text-ink-500"
        >
          Takeaways
        </h2>
        <ol className="mt-8 space-y-6">
          {takeaways.map((t, i) => (
            <li
              key={i}
              className="grid grid-cols-[auto_1fr] gap-5 items-start"
            >
              <span
                aria-hidden
                className="font-mono text-[11px] tracking-[0.18em] text-ink-400 pt-1.5"
              >
                0{i + 1}
              </span>
              <p className="text-[18px] leading-relaxed text-ink-700 text-pretty">
                {t}
              </p>
            </li>
          ))}
        </ol>
      </section>
    </article>
  );
}
