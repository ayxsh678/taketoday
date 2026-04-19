import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import {
  ArticleLayout,
  articleToLayoutProps,
} from "@/components/ArticleLayout";
import {
  getAllArticles,
  getArticle,
} from "@/lib/content/queries";
import { SITE, abs } from "@/lib/site";

/**
 * TakeToday — Dynamic Article Route
 * Statically generated at build time via `generateStaticParams`.
 * The MDX body is compiled on the server (RSC) so nothing ships to the client.
 */

export function generateStaticParams(): { slug: string }[] {
  return getAllArticles().map((a) => ({ slug: a.metadata.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const a = getArticle(slug);
  if (!a) return { title: "Not found — TakeToday" };

  const { title, deck, publishedAt, updatedAt, author, category } = a.metadata;

  return {
    metadataBase: new URL(SITE.url),
    title: `${title} — ${SITE.name}`,
    description: deck,
    openGraph: {
      title,
      description: deck,
      type: "article",
      siteName: SITE.name,
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
  const article = getArticle(slug);
  if (!article) notFound();

  const body = <MDXRemote source={article.content.body} />;
  const layoutProps = articleToLayoutProps(article, body);

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE.url },
      {
        "@type": "ListItem",
        position: 2,
        name: article.metadata.category,
        item: abs(`/category/${article.metadata.category.toLowerCase()}`),
      },
      {
        "@type": "ListItem",
        position: 3,
        name: article.metadata.title,
        item: abs(`/article/${article.metadata.slug}`),
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
