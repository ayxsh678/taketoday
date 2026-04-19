import { getAllArticles } from "@/lib/content/queries";
import { SITE, abs } from "@/lib/site";

/**
 * TakeToday — RSS 2.0 feed
 * Route handler at `/feed.xml`. Emits every article newest-first with
 * title, link, guid (canonical URL), pubDate, category, and a CDATA
 * description pulled from `quickTake`.
 *
 * All user-supplied text is wrapped in CDATA to avoid XML escaping issues.
 * The feed is built at request time so revalidation or content changes
 * propagate without a deploy — but the underlying loader is cached per
 * process, so the cost is effectively zero.
 */

export const dynamic = "force-static";
export const revalidate = 3600; // 1h

export function GET() {
  const articles = getAllArticles();
  const newest =
    articles[0]?.metadata.publishedAt ?? new Date().toISOString();

  const items = articles
    .map((a) => {
      const { metadata: m, content: c } = a;
      const link = abs(`/article/${m.slug}`);
      return `    <item>
      <title>${cdata(m.title)}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <pubDate>${toRfc822(m.publishedAt)}</pubDate>
      <category>${cdata(m.category)}</category>
      <author>${cdata(m.author.name)}</author>
      <description>${cdata(c.quickTake)}</description>
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${cdata(SITE.name)}</title>
    <link>${SITE.url}</link>
    <description>${cdata(SITE.description)}</description>
    <language>${SITE.locale.toLowerCase()}</language>
    <lastBuildDate>${toRfc822(newest)}</lastBuildDate>
    <atom:link href="${abs("/feed.xml")}" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>
`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}

/** Wrap user-supplied text in CDATA, escaping any embedded `]]>`. */
function cdata(s: string): string {
  return `<![CDATA[${s.replace(/]]>/g, "]]]]><![CDATA[>")}]]>`;
}

/** RFC 822 date — what RSS 2.0 requires for pubDate / lastBuildDate. */
function toRfc822(iso: string): string {
  return new Date(iso).toUTCString();
}
