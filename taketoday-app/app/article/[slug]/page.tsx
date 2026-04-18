import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticleLayout } from "@/components/ArticleLayout";
import type { Article } from "@/types/article";

/**
 * TakeToday — Dynamic Article Route
 * Phase 2 will replace the inline MOCK with a real MDX loader. For now the
 * route demonstrates the full layout + metadata pipeline against one fixture
 * so we can verify typography, hierarchy, and SEO end-to-end.
 */

const MOCK: Article = {
  metadata: {
    slug: "openai-unveils-new-enterprise-tier",
    title:
      "OpenAI opens a quieter, more expensive door for the enterprises that matter most",
    deck: "The new tier isn\u2019t about model access. It\u2019s about the kind of commitments that get a deal past legal.",
    category: "AI",
    format: "SmartBreakdown",
    readTime: "4 min read",
    publishedAt: "2026-04-18T09:00:00Z",
    author: { name: "TakeToday Editorial", type: "Organization" },
  },
  content: {
    quickTake:
      "OpenAI\u2019s new enterprise tier trades launch-event flash for the unglamorous contract terms that actually unlock regulated industries.",
    whyItMatters:
      "For the first time, a frontier model lab is structured to sell into banks, hospitals, and governments without forcing them to pretend procurement doesn\u2019t exist. If it works, it rewrites who wins the next wave of AI deals.",
    takeaways: [
      "The headline isn\u2019t capability \u2014 it\u2019s accountability: audit logs, residency, and named engineers.",
      "Regulated buyers don\u2019t churn. If OpenAI lands them, they stay long after the hype cycle turns.",
      "Expect Anthropic and Google to match the terms within a quarter; differentiation moves to support.",
    ],
    body: "",
  },
} as const;

const SITE_URL = "https://taketoday.vercel.app";

function getArticle(slug: string): Article | undefined {
  return slug === MOCK.metadata.slug ? MOCK : undefined;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const a = getArticle(slug);
  if (!a) return { title: "Not found \u2014 TakeToday" };

  const { title, deck, publishedAt, updatedAt, author, category } = a.metadata;

  return {
    metadataBase: new URL(SITE_URL),
    title: `${title} \u2014 TakeToday`,
    description: deck,
    openGraph: {
      title,
      description: deck,
      type: "article",
      siteName: "TakeToday",
      publishedTime: publishedAt,
      modifiedTime: updatedAt ?? publishedAt,
      authors: [author.name],
      section: category,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: deck,
    },
  };
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const a = getArticle(slug);
  if (!a) notFound();

  const body = (
    <>
      <p>
        OpenAI&rsquo;s pitch to the Fortune 100 used to be the same as its pitch
        to a college sophomore: here is a very impressive model, have fun. That
        worked for demos. It did not work for deals.
      </p>
      <p>
        The new tier &mdash; announced quietly, without a keynote &mdash; signals
        a different understanding. It bundles the boring things that have always
        blocked serious buyers: audit logs that satisfy a compliance team, data
        residency in the regions their regulators actually care about, and a
        direct line to engineering when something breaks at 3am.
      </p>
      <h2>What changed</h2>
      <p>
        None of this is glamorous. None of it shows well on stage. But it is the
        first time a frontier lab has built a product that can survive a
        procurement review at a bank.
      </p>
      <blockquote>
        The interesting companies in AI right now aren&rsquo;t the ones with the
        best model. They&rsquo;re the ones that can get a model past the lawyers.
      </blockquote>
      <h2>What comes next</h2>
      <p>
        Expect Anthropic and Google to match these terms within a quarter. Once
        the contract shape stabilizes, the differentiator moves elsewhere &mdash;
        probably to implementation support, and to the breadth of the partner
        ecosystem around each platform.
      </p>
    </>
  );

  const layoutProps = {
    slug: a.metadata.slug,
    title: a.metadata.title,
    deck: a.metadata.deck,
    category: a.metadata.category,
    readTime: a.metadata.readTime,
    publishedAt: a.metadata.publishedAt,
    updatedAt: a.metadata.updatedAt,
    author: a.metadata.author,
    quickTake: a.content.quickTake,
    whyItMatters: a.content.whyItMatters,
    takeaways: a.content.takeaways,
    body,
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      {
        "@type": "ListItem",
        position: 2,
        name: a.metadata.category,
        item: `${SITE_URL}/category/${a.metadata.category.toLowerCase()}`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: a.metadata.title,
        item: `${SITE_URL}/article/${a.metadata.slug}`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      <ArticleLayout {...layoutProps} />
    </>
  );
}
