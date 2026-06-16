import type {
  QueueEventType,
  QueueEvent,
  ArticleIngestedPayload,
  EntityExtractedPayload,
  StoryLinkedPayload,
  QuestionGeneratedPayload,
  ClaimExtractedPayload,
  VerificationRequestedPayload,
  NarrativeUpdatedPayload,
  ResearchRequestedPayload,
} from '@/lib/intelligence/types';

export type {
  QueueEventType,
  QueueEvent,
  ArticleIngestedPayload,
  EntityExtractedPayload,
  StoryLinkedPayload,
  QuestionGeneratedPayload,
  ClaimExtractedPayload,
  VerificationRequestedPayload,
  NarrativeUpdatedPayload,
  ResearchRequestedPayload,
};

export type JobHandler<T = unknown> = (payload: T) => Promise<void>;

export interface QueueAdapter {
  emit<T>(type: QueueEventType, payload: T, opts?: { priority?: 'high' | 'standard' | 'low' }): Promise<void>;
  subscribe<T>(type: QueueEventType, handler: JobHandler<T>): void;
}
