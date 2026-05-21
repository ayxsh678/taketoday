import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import {
  ArticleLayout,
  articleToLayoutProps,
} from "@/components/ArticleLayout";
import {
  getAllArticles,
  getArticleBySlug,
} from "@/lib/content/queries";
import { SITE, abs } from "@/lib/site";
import { TrackPageView } from "@/components/TrackPageView";

export function generateStaticParams(): { slug: string }[] {
  return getAllArticles().map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const a = getArticleBySlug(slug);
  if (!a) return { title: "Not found — TakeToday" };

  const { title, deck, publishedAt, updatedAt, author, category } = a;

  const ogImage = `${SITE.url}/api/og?${new URLSearchParams({
    title,
    deck,
    category,
  }).toString()}`;

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
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: deck,
      images: [ogImage],
    },
  };
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article) notFound();

  const { title, deck, publishedAt, updatedAt, author, category, slug: articleSlug } = article;
  const articleUrl = abs(`/article/${articleSlug}`);
  const ogImage = `${SITE.url}/api/og?${new URLSearchParams({
    title,
    deck,
    category,
  }).toString()}`;

  const newsArticleLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: title,
    description: deck,
    datePublished: publishedAt,
    dateModified: updatedAt ?? publishedAt,
    url: articleUrl,
    image: ogImage,
    author: {
      "@type": author.type === "Person" ? "Person" : "Organization",
      name: author.name,
    },
    publisher: {
      "@type": "Organization",
      name: SITE.name,
      url: SITE.url,
    },
    articleSection: category,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": articleUrl,
    },
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE.url },
      {
        "@type": "ListItem",
        position: 2,
        name: category,
        item: abs(`/category/${category.toLowerCase()}`),
      },
      {
        "@type": "ListItem",
        position: 3,
        name: title,
        item: articleUrl,
      },
    ],
  };

  const body = <MDXRemote source={article.body.raw} />;
  const layoutProps = articleToLayoutProps(article, body);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(newsArticleLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      <TrackPageView slug={articleSlug} category={category} />
      <ArticleLayout {...layoutProps} />
    </>
  );
}