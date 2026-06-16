import 'server-only';
import { embedText } from '@/lib/ai/embeddings';
import {
  upsertQuestionEmbeddingRecord,
  storeQuestionEmbeddingVector,
  findSimilarQuestions,
} from '@/lib/intelligence/repositories/question-embedding';
import { createQuestion, linkQuestionToArticle } from '@/lib/intelligence/repositories/question';
import type { QuestionType, QuestionPriority } from '@prisma/client';
import type { GeneratedQuestionRaw } from '@/lib/intelligence/types';

const DEDUP_THRESHOLD = 0.88; // cosine similarity above this = same question

// Store embedding for a newly created question
async function embedAndStoreQuestion(questionId: string, text: string): Promise<void> {
  const vector = await embedText(text);
  const record = await upsertQuestionEmbeddingRecord(questionId);
  await storeQuestionEmbeddingVector(record.id, vector);
}

// Create or merge a single question, returning the question ID
export async function createOrMergeQuestion(opts: {
  text: string;
  questionType: QuestionType;
  priority: QuestionPriority;
  verificationRequired: boolean;
  articleId: string;
  storyChainId?: string;
  relatedEntityIds?: string[];
}): Promise<string> {
  // Embed the question text to check for duplicates
  const vector = await embedText(opts.text);
  const similar = await findSimilarQuestions(vector, { threshold: DEDUP_THRESHOLD, topK: 3 });

  if (similar.length > 0) {
    // Existing semantically identical question — link this article as a co-raiser
    const existingId = similar[0].questionId;
    await linkQuestionToArticle(existingId, opts.articleId);
    return existingId;
  }

  // New question — create and store embedding
  const question = await createQuestion({
    text: opts.text,
    questionType: opts.questionType,
    priority: opts.priority,
    verificationRequired: opts.verificationRequired,
    articleId: opts.articleId,
    storyChainId: opts.storyChainId,
    relatedEntityIds: opts.relatedEntityIds ?? [],
  });

  // Store embedding (best-effort — doesn't block if it fails)
  embedAndStoreQuestion(question.id, opts.text).catch((err) =>
    console.error(`[question-dedup] Failed to store embedding for ${question.id}:`, err),
  );

  return question.id;
}

// Process all questions from one generation batch
export async function deduplicateAndStoreQuestions(
  questions: GeneratedQuestionRaw[],
  questionType: QuestionType,
  articleId: string,
  opts: { storyChainId?: string; relatedEntityIds?: string[] } = {},
): Promise<string[]> {
  const ids: string[] = [];

  // Sequential to avoid race conditions on the dedup check
  for (const q of questions) {
    const id = await createOrMergeQuestion({
      text: q.text,
      questionType,
      priority: q.priority as QuestionPriority,
      verificationRequired: q.verificationRequired ?? false,
      articleId,
      storyChainId: opts.storyChainId,
      relatedEntityIds: opts.relatedEntityIds,
    });
    ids.push(id);
  }

  return ids;
}
