import 'server-only';
import { prisma } from '@/lib/db/prisma';
import { callLLMWithTool } from '@/lib/ai/llm';
import { updateStoryChainNarrative } from '@/lib/intelligence/repositories/story-chain';

const MIN_ARTICLES_FOR_SYNTHESIS = 2;
const MAX_ARTICLES_FOR_SYNTHESIS = 10;

interface NarrativeLLMResult {
  narrative: string;
  unresolvedThreads: string[];
}

// Re-synthesize the living narrative for a story chain from its most recent articles.
// Called after a new article is assigned to the chain.
export async function synthesizeNarrative(storyChainId: string): Promise<boolean> {
  const chain = await prisma.storyChain.findUnique({ where: { id: storyChainId } });
  if (!chain) return false;

  const articles = await prisma.article.findMany({
    where: { storyChainId },
    orderBy: { publishedAt: 'asc' },
    take: MAX_ARTICLES_FOR_SYNTHESIS,
    select: { headline: true, excerpt: true, publishedAt: true },
  });

  if (articles.length < MIN_ARTICLES_FOR_SYNTHESIS) return false;

  const articleList = articles
    .map((a, i) => {
      const date = a.publishedAt?.toISOString().slice(0, 10) ?? 'undated';
      return `${i + 1}. [${date}] ${a.headline}${a.excerpt ? `: ${a.excerpt.slice(0, 120)}` : ''}`;
    })
    .join('\n');

  const result = await callLLMWithTool<NarrativeLLMResult>({
    system: [
      'You are a senior news analyst updating a living narrative for a developing story.',
      'Be factual and journalistic. Synthesis must capture the arc, key actors, and current state.',
      'Unresolved threads are open questions or tensions the story has not yet answered.',
    ].join(' '),
    user: [
      `Story chain: "${chain.title}"`,
      '',
      `Articles (chronological, ${articles.length} total):`,
      articleList,
      '',
      chain.livingNarrative
        ? `Current narrative:\n${chain.livingNarrative}`
        : 'No existing narrative — write the initial version.',
    ].join('\n'),
    toolName: 'update_narrative',
    toolDescription: 'Update the living narrative and unresolved threads for this story chain',
    schema: {
      type: 'object' as const,
      properties: {
        narrative: {
          type: 'string',
          description:
            'Updated living narrative. Max 200 words. Journalistic tone. Present tense for ongoing developments.',
        },
        unresolvedThreads: {
          type: 'array',
          items: { type: 'string' },
          description:
            'Open tensions, unanswered questions, or pending developments in this story. 2-5 items. Each under 15 words.',
          minItems: 1,
          maxItems: 5,
        },
      },
      required: ['narrative', 'unresolvedThreads'],
    },
    model: 'gpt-4o-mini',
    maxTokens: 600,
  });

  await updateStoryChainNarrative(storyChainId, result.narrative, result.unresolvedThreads);
  return true;
}
