import Link from "next/link";
import type { Category } from "@/types/article";
import { CategoryThumbnail } from "@/components/CategoryThumbnail";

/**
 * TakeToday — NewsCard
 * Two variants:
 *   `grid`   — stacked card with thumbnail (used in feeds, category pages)
 *   `inline` — horizontal compact row with small thumbnail (side-stack in Lead)
 *
 * Both accept an optional `image` URL; falls back to CategoryThumbnail.
 */

export type NewsCardProps = Readonly<{
  slug: string;
  title: string;
  summary: string;
  category: Category;
  readTime: string;
  publishedAt: string; // ISO
  variant?: "grid" | "inline";
  image?: string;
}>;

export function NewsCard({
  slug,
  title,
  summary,
  category,
  readTime,
  publishedAt,
  variant = "grid",
  image,
}: NewsCardProps) {
  const href = `/article/${slug}`;
  const date = new Date(publishedAt);

  if (variant === "inline") {
    return (
      <article className="group py-6 first:pt-0 border-b border-ink-200/70 last:border-0">
        <Link href={href} className="flex items-start gap-4">
          {/* Small thumbnail */}
          <div className="shrink-0 w-[72px] h-[56px] overflow-hidden rounded-sm">
            {image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={image}
                alt=""
                aria-hidden
                className="w-full h-full object-cover"
              />
            ) : (
              <CategoryThumbnail category={category} className="w-full h-full" watermark={false} />
            )}
          </div>

          {/* Text */}
          <div className="flex-1 min-w-0">
            <Meta category={category} readTime={readTime} />
            <h3 className="mt-2 text-[17px] leading-snug tracking-tight text-ink group-hover:text-ink-700 transition-colors text-balance">
              {title}
            </h3>
            <p className="mt-2 text-[13px] leading-relaxed text-ink-500 clamp-2">
              {summary}
            </p>
            <time
              dateTime={publishedAt}
              className="mt-2.5 block font-mono text-[10px] tracking-[0.18em] uppercase text-ink-400"
            >
              {formatDate(date)}
            </time>
          </div>
        </Link>
      </article>
    );
  }

  // Grid variant
  return (
    <article className="group">
      <Link href={href} className="block">
        {/* Thumbnail */}
        <div className="aspect-[16/10] overflow-hidden rounded-sm mb-5">
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={image}
              alt=""
              aria-hidden
              className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
            />
          ) : (
            <CategoryThumbnail
              category={category}
              className="w-full h-full group-hover:scale-[1.02] transition-transform duration-500"
            />
          )}
        </div>

        <Meta category={category} readTime={readTime} />
        <h3 className="mt-4 text-[23px] leading-[1.15] tracking-tight text-ink group-hover:text-ink-700 transition-colors text-balance">
          {title}
        </h3>
        <p className="mt-4 text-[14px] leading-relaxed text-ink-500 clamp-3">
          {summary}
        </p>
        <time
          dateTime={publishedAt}
          className="mt-5 block font-mono text-[10px] tracking-[0.18em] uppercase text-ink-400"
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
      <span aria-hidden className="text-ink-300">/</span>
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
