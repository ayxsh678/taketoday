import 'server-only';
import { assignArticleToStoryChain } from './story-assignment';
import { synthesizeNarrative } from './narrative-synthesis';
import { checkQuestionsForArticle } from './question-lifecycle';
import { detectTurningPointsFromLinks } from './turning-points';
import { updateStoryChainNarrative } from '@/lib/intelligence/repositories/story-chain';
import { findStoryChainById } from '@/lib/intelligence/repositories/story-chain';
import type { ClassifiedStoryLink } from '@/lib/intelligence/types';

export interface NarrativeResult {
  storyChainId: string | null;
  narrativeUpdated: boolean;
  questionsChecked: number;
  questionsResolved: number;
  turningPointDetected: boolean;
  newThreads: string[];
}

// Orchestrates all narrative intelligence for a newly processed article.
// Runs after story linking and claim extraction in the pipeline.
export async function updateNarrative(opts: {
  articleId: string;
  headline: string;
  body: string | null;
  links: ClassifiedStoryLink[];
  entityIds: string[];
}): Promise<NarrativeResult> {
  const { articleId, headline, body, links, entityIds } = opts;

  // Step 1: Assign article to best-matching story chain
  const storyChainId = await assignArticleToStoryChain(articleId, links, entityIds);

  if (!storyChainId) {
    return {
      storyChainId: null,
      narrativeUpdated: false,
      questionsChecked: 0,
      questionsResolved: 0,
      turningPointDetected: false,
      newThreads: [],
    };
  }

  // Step 2: Detect turning points from the links
  const newThreads = detectTurningPointsFromLinks(links, headline);
  const turningPointDetected = newThreads.length > 0;

  // Step 3: Synthesize updated living narrative (incorporates new article)
  let narrativeUpdated = false;
  try {
    narrativeUpdated = await synthesizeNarrative(storyChainId);
  } catch {
    // Narrative synthesis failure is non-fatal — append threads manually if we have them
    if (turningPointDetected) {
      try {
        const chain = await findStoryChainById(storyChainId);
        if (chain) {
          const existingThreads = chain.unresolvedThreads ?? [];
          const merged = [...new Set([...existingThreads, ...newThreads])].slice(0, 10);
          await updateStoryChainNarrative(
            storyChainId,
            chain.livingNarrative ?? '',
            merged,
          );
        }
      } catch {
        // Best effort
      }
    }
  }

  // Step 4: Check whether new article resolves any open questions
  let questionsChecked = 0;
  let questionsResolved = 0;
  try {
    const lifecycleResult = await checkQuestionsForArticle(
      articleId,
      storyChainId,
      headline,
      body ?? '',
    );
    questionsChecked = lifecycleResult.checked;
    questionsResolved = lifecycleResult.resolved;
  } catch {
    // Non-fatal
  }

  return {
    storyChainId,
    narrativeUpdated,
    questionsChecked,
    questionsResolved,
    turningPointDetected,
    newThreads,
  };
}
