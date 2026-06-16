import { callWithRouter } from './router';

const ARTICLE_SYSTEM = `You are an experienced news journalist. Write concise, factual, third-person news copy in AP style. No introductory meta-commentary. No headers. Output HTML paragraph tags only (<p>…</p>). 3–5 paragraphs.`;

function paragraphsToHtml(text: string): string {
  return text
    .split(/\n{2,}/)
    .map((p) => p.replace(/\n/g, ' ').trim())
    .filter(Boolean)
    .map((p) => (p.startsWith('<p>') ? p : `<p>${p}</p>`))
    .join('\n');
}

export async function generateArticleBody(
  headline: string,
  excerpt?: string,
  opts?: { category?: string; articleId?: string },
): Promise<string> {
  const userPrompt = [
    `Headline: ${headline}`,
    excerpt ? `Context: ${excerpt}` : '',
    '',
    'Write the article body now.',
  ]
    .filter(Boolean)
    .join('\n');

  const result = await callWithRouter({
    task: 'article_generation',
    category: opts?.category,
    risk: 'LOW',
    articleId: opts?.articleId,
    input: {
      system: ARTICLE_SYSTEM,
      user: userPrompt,
      temperature: 0.65,
      maxTokens: 900,
    },
  });

  return paragraphsToHtml(result.text);
}

export async function generateExcerpt(
  headline: string,
  body: string,
  opts?: { category?: string; articleId?: string },
): Promise<string> {
  const result = await callWithRouter({
    task: 'excerpt_generation',
    category: opts?.category,
    risk: 'LOW',
    articleId: opts?.articleId,
    input: {
      system: 'Write a single-sentence news excerpt (max 25 words) for this article. Plain text only, no quotes.',
      user: `Headline: ${headline}\n\nBody: ${body.slice(0, 600)}`,
      temperature: 0.5,
      maxTokens: 60,
    },
  });

  return result.text.trim();
}
