import 'server-only';
import { callLLMWithTool } from '@/lib/ai/llm';
import { findOpenQuestionsForStoryChain, resolveQuestion } from '@/lib/intelligence/repositories/question';
import { findQuestionsSemanticallySimilarToArticle } from '@/lib/intelligence/repositories/question-embedding';
import type { Question } from '@prisma/client';

// Max questions to check per article (controls LLM cost)
const MAX_QUESTIONS_TO_CHECK = 3;

interface QuestionResolution {
  questionId: string;
  answered: boolean;
  answer?: string;
}

interface LLMResolutionResult {
  resolutions: QuestionResolution[];
}

export interface QuestionLifecycleResult {
  checked: number;
  resolved: number;
}

// Check whether a new article answers any open questions in its story chain.
// Uses semantic similarity to pre-filter candidates, then LLM for confirmation.
export async function checkQuestionsForArticle(
  articleId: string,
  storyChainId: string,
  headline: string,
  body: string,
): Promise<QuestionLifecycleResult> {
  const openQuestions = await findOpenQuestionsForStoryChain(storyChainId);
  if (openQuestions.length === 0) return { checked: 0, resolved: 0 };

  // Try embedding similarity to find the best candidates first
  let candidates: Question[];
  try {
    const similar = await findQuestionsSemanticallySimilarToArticle(articleId, storyChainId, {
      threshold: 0.72,
      topK: MAX_QUESTIONS_TO_CHECK,
    });

    if (similar.length > 0) {
      const similarIds = new Set(similar.map((s) => s.questionId));
      candidates = openQuestions.filter((q) => similarIds.has(q.id));
    } else {
      // No embeddings yet — fall back to top questions by priority + importanceScore
      candidates = openQuestions.slice(0, MAX_QUESTIONS_TO_CHECK);
    }
  } catch {
    // Embedding query failed (e.g. no embeddings stored) — fall back
    candidates = openQuestions.slice(0, MAX_QUESTIONS_TO_CHECK);
  }

  if (candidates.length === 0) return { checked: 0, resolved: 0 };

  const questionList = candidates
    .map((q, i) => `${i + 1}. [ID:${q.id}] ${q.text}`)
    .join('\n');

  const bodySnippet = body.replace(/<[^>]+>/g, '').slice(0, 1500);

  const result = await callLLMWithTool<LLMResolutionResult>({
    system: [
      'You are a journalist reviewing whether a new article answers specific open questions.',
      'Only mark a question as answered if the article contains a direct, factual answer.',
      'Do not infer or guess. If uncertain, answered must be false.',
    ].join(' '),
    user: [
      `Article headline: "${headline}"`,
      '',
      `Article body:\n${bodySnippet}`,
      '',
      'Open questions to check:',
      questionList,
    ].join('\n'),
    toolName: 'resolve_questions',
    toolDescription: 'Report which open questions the article answers',
    schema: {
      type: 'object' as const,
      properties: {
        resolutions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              questionId: { type: 'string', description: 'The [ID:...] value from the question list' },
              answered: { type: 'boolean' },
              answer: { type: 'string', description: 'Brief factual answer from the article (required if answered=true)' },
            },
            required: ['questionId', 'answered'],
          },
        },
      },
      required: ['resolutions'],
    },
    model: 'gpt-4o-mini',
    maxTokens: 500,
    temperature: 0.1,
  });

  let resolved = 0;
  for (const r of result.resolutions) {
    if (!r.answered || !r.answer) continue;
    // Guard: LLM must return a valid questionId from our candidate list
    if (!candidates.find((q) => q.id === r.questionId)) continue;
    try {
      await resolveQuestion(r.questionId, r.answer, articleId);
      resolved++;
    } catch {
      // Non-fatal — question may have been resolved concurrently
    }
  }

  return { checked: candidates.length, resolved };
}
