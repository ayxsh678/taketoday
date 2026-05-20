import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { NewsCard } from "@/components/NewsCard";
import { CATEGORIES, type Category } from "@/types/article";
import { getArticlesByCategory } from "@/lib/content/queries";
import { SITE, abs } from "@/lib/site";

/**
 * TakeToday — Category index
 * One static page per Category, generated at build time. URL is the category
 * name lowercased (e.g. `/category/ai`, `/category/startups`).
 *
 * No filter pills here (you're already filtered). Just a clean header + grid.
 */

const CATEGORY_COPY: Readonly<Record<Category, { desk: string; blurb: string }>> = {
  AI: {
    desk: "The AI Desk",
    blurb:
      "Models, labs, and the deals that move the frontier — without the hype cycle.",
  },
  Finance: {
    desk: "The Finance Desk",
    blurb:
      "Rates, markets, and money flows — explained in the time it takes to finish a coffee.",
  },
  Tech: {
    desk: "The Tech Desk",
    blurb:
      "Platforms, policy, and the technology shifts that actually reshape work and life.",
  },
  Startups: {
    desk: "The Startups Desk",
    blurb:
      "Founders, funds, and the signals behind who's raising, shipping, and dying.",
  },
  Briefings: {
    desk: "The Briefings Desk",
    blurb:
      "Short, sharp reads on the stories moving markets, tech, and policy today.",
  },
  India: {
    desk: "The India Desk",
    blurb:
      "Policy, markets, and tech shifts from the world's largest democracy — what matters and why.",
  },
  International: {
    desk: "The International Desk",
    blurb:
      "The global stories with cross-border consequences — trade, geopolitics, and the macro moves that ripple everywhere.",
  },
};

/** Map URL slug (lowercase) → Category enum value. */
function slugToCategory(slug: string): Category | null {
  const match = CATEGORIES.find((c) => c.toLowerCase() === slug);
  return match ?? null;
}

export function generateStaticParams(): { category: string }[] {
  return CATEGORIES.map((c) => ({ category: c.toLowerCase() }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category } = await params;
  const cat = slugToCategory(category);
  if (!cat) return { title: `Not found — ${SITE.name}` };

  const copy = CATEGORY_COPY[cat];
  const canonical = abs(`/category/${cat.toLowerCase()}`);

  return {
    metadataBase: new URL(SITE.url),
    title: `${copy.desk} — ${SITE.name}`,
    description: copy.blurb,
    alternates: { canonical },
    openGraph: {
      title: `${copy.desk} — ${SITE.name}`,
      description: copy.blurb,
      type: "website",
      siteName: SITE.name,
      url: canonical,
      images: [{
        url: `${SITE.url}/api/og?${new URLSearchParams({ title: copy.desk, deck: copy.blurb }).toString()}`,
        width: 1200,
        height: 630,
        alt: copy.desk,
      }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${copy.desk} — ${SITE.name}`,
      description: copy.blurb,
      images: [`${SITE.url}/api/og?${new URLSearchParams({ title: copy.desk, deck: copy.blurb }).toString()}`],
    },
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const cat = slugToCategory(category);
  if (!cat) notFound();

  const copy = CATEGORY_COPY[cat];
  const articles = getArticlesByCategory(cat);

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE.url },
      {
        "@type": "ListItem",
        position: 2,
        name: cat,
        item: abs(`/category/${cat.toLowerCase()}`),
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />

      <section className="mx-auto max-w-[1400px] px-6 lg:px-10 pt-16 lg:pt-24 pb-10">
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
          <span className="text-ink">{cat}</span>
        </nav>

        <header className="mt-8 flex flex-col gap-5 max-w-3xl">
          <h1 className="font-serif text-[56px] lg:text-[80px] leading-[1.0] tracking-[-0.03em] text-ink">
            <span className="text-ink-400">The </span>
            <span className="italic">{cat}</span>
            <span className="text-ink-400"> Desk</span>
          </h1>
          <p className="text-[17px] leading-relaxed text-ink-500 max-w-[60ch]">
            {copy.blurb}
          </p>
          <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-ink-400">
            {articles.length} {articles.length === 1 ? "Story" : "Stories"}
          </p>
        </header>
      </section>

      <section
        aria-label={`${cat} stories`}
        className="mx-auto max-w-[1400px] px-6 lg:px-10 pb-24 border-t border-ink-200/70 pt-14"
      >
        {articles.length === 0 ? (
          <p className="text-[15px] text-ink-500">
            Nothing filed on this desk yet. Check back soon.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-14">
            {articles.map((a) => (
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
        )}
      </section>
    </>
  );
}
