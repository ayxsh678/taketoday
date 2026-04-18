import Link from "next/link";
import type { Category } from "@/types/article";

/**
 * TakeToday — NewsCard
 * Two variants: `grid` (stacked, used in feeds) and `inline` (horizontal,
 * used in side-lists under the Lead). Same data shape, same typography rules.
 *
 * Hover moves from ink → ink-700 on the headline and reveals a subtle
 * underline on the category pill via the shared `.reveal` utility.
 */

export type NewsCardProps = Readonly<{
  slug: string;
  title: string;
  summary: string;
  category: Category;
  readTime: string;
  publishedAt: string; // ISO
  variant?: "grid" | "inline";
}>;

export function NewsCard({
  slug,
  title,
  summary,
  category,
  readTime,
  publishedAt,
  variant = "grid",
}: NewsCardProps) {
  const href = `/article/${slug}`;
  const date = new Date(publishedAt);

  if (variant === "inline") {
    return (
      <article className="group py-5 first:pt-0 border-b border-ink-200/70 last:border-0">
        <Link href={href} className="block">
          <Meta category={category} readTime={readTime} />
          <h3 className="mt-2 text-[18px] leading-snug tracking-tight text-ink group-hover:text-ink-700 transition-colors text-balance">
            {title}
          </h3>
          <p className="mt-2 text-[13px] leading-relaxed text-ink-500 clamp-2">
            {summary}
          </p>
          <time
            dateTime={publishedAt}
            className="mt-3 block font-mono text-[10px] tracking-[0.18em] uppercase text-ink-400"
          >
            {formatDate(date)}
          </time>
        </Link>
      </article>
    );
  }

  return (
    <article className="group">
      <Link href={href} className="block">
        <Meta category={category} readTime={readTime} />
        <h3 className="mt-3 text-[22px] leading-[1.15] tracking-tight text-ink group-hover:text-ink-700 transition-colors text-balance">
          {title}
        </h3>
        <p className="mt-3 text-[14px] leading-relaxed text-ink-500 clamp-3">
          {summary}
        </p>
        <time
          dateTime={publishedAt}
          className="mt-4 block font-mono text-[10px] tracking-[0.18em] uppercase text-ink-400"
        >
          {formatDate(date)}
        </time>
      </Link>
    </article>
  );
}

function Meta({ category, readTime }: { category: Category; readTime: string }) {
  return (
    <div className="flex items-center gap-3 font-mono text-[10px] tracking-[0.18em] uppercase">
      <span className="text-accent">{category}</span>
      <span aria-hidden className="text-ink-300">
        /
      </span>
      <span className="text-ink-500">{readTime}</span>
    </div>
  );
}

function formatDate(d: Date): string {
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
