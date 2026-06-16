/**
 * Intelligence pipeline event queue.
 *
 * Current implementation: in-process async dispatch (works on Vercel serverless).
 * Each event fires the registered handler immediately via a non-blocking Promise.
 *
 * Migration path to BullMQ / Inngest: swap the adapter, keep all handler files unchanged.
 */

import type { QueueEventType, JobHandler, QueueAdapter } from './types';

// ─── In-Process Adapter ───────────────────────────────────────────────────────

class InProcessQueueAdapter implements QueueAdapter {
  private handlers = new Map<QueueEventType, JobHandler[]>();

  subscribe<T>(type: QueueEventType, handler: JobHandler<T>): void {
    const existing = this.handlers.get(type) ?? [];
    existing.push(handler as JobHandler);
    this.handlers.set(type, existing);
  }

  async emit<T>(type: QueueEventType, payload: T): Promise<void> {
    const handlers = this.handlers.get(type) ?? [];
    // Non-blocking: dispatch all handlers as background microtasks
    // On Vercel, use waitUntil via the Next.js after() API when handlers are registered there
    for (const handler of handlers) {
      handler(payload).catch((err) =>
        console.error(`[queue] Handler for ${type} failed:`, err),
      );
    }
  }
}

// Singleton — initialized once per process
const queue: QueueAdapter = new InProcessQueueAdapter();

export default queue;
export { queue };

// ─── Convenience emitters (typed) ─────────────────────────────────────────────

import type {
  ArticleIngestedPayload,
  EntityExtractedPayload,
  StoryLinkedPayload,
  QuestionGeneratedPayload,
  ClaimExtractedPayload,
  VerificationRequestedPayload,
  NarrativeUpdatedPayload,
  ResearchRequestedPayload,
} from './types';

export const events = {
  articleIngested: (payload: ArticleIngestedPayload) =>
    queue.emit('article.ingested', payload),

  entityExtracted: (payload: EntityExtractedPayload) =>
    queue.emit('entity.extracted', payload),

  storyLinked: (payload: StoryLinkedPayload) =>
    queue.emit('story.linked', payload, { priority: 'standard' }),

  questionGenerated: (payload: QuestionGeneratedPayload) =>
    queue.emit('question.generated', payload, { priority: 'standard' }),

  claimExtracted: (payload: ClaimExtractedPayload) =>
    queue.emit('claim.extracted', payload, { priority: 'standard' }),

  verificationRequested: (payload: VerificationRequestedPayload) =>
    queue.emit('verification.requested', payload, { priority: payload.priority ?? 'low' }),

  narrativeUpdated: (payload: NarrativeUpdatedPayload) =>
    queue.emit('narrative.updated', payload, { priority: 'low' }),

  researchRequested: (payload: ResearchRequestedPayload) =>
    queue.emit('research.requested', payload, { priority: 'low' }),

  graphUpdated: (payload: { articleId: string }) =>
    queue.emit('graph.updated', payload, { priority: 'low' }),
};
