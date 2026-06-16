import type {
  Entity,
  EntityMention,
  StoryChain,
  StoryLink,
  Question,
  ArticleQuestion,
  Claim,
  Prediction,
  ResearchDossier,
  ArticleEmbedding,
  NewsSource,
  EntityType,
  StoryRelationshipType,
  QuestionType,
  QuestionPriority,
  QuestionStatus,
  ClaimType,
  VerificationStatus,
  PredictionType,
  PredictionStatus,
} from '@prisma/client';

// Re-export Prisma types for use throughout the intelligence layer
export type {
  Entity,
  EntityMention,
  StoryChain,
  StoryLink,
  Question,
  ArticleQuestion,
  Claim,
  Prediction,
  ResearchDossier,
  ArticleEmbedding,
  NewsSource,
  EntityType,
  StoryRelationshipType,
  QuestionType,
  QuestionPriority,
  QuestionStatus,
  ClaimType,
  VerificationStatus,
  PredictionType,
  PredictionStatus,
};

// ─── Entity Extraction ────────────────────────────────────────────────────────

export interface ExtractedEntity {
  surfaceForm: string;
  canonicalName: string;
  type: EntityType;
  wikidataId?: string;
  confidence: number;
  attributes: Record<string, string>;
  relationships: {
    targetEntity: string;
    type: string;
    confidence: number;
  }[];
}

export interface EntityExtractionResult {
  articleId: string;
  entities: ExtractedEntity[];
  extractedAt: Date;
  model: string;
}

// ─── Story Linking ────────────────────────────────────────────────────────────

export interface StoryLinkCandidate {
  articleId: string;
  semanticScore: number;
  entityScore: number;
  temporalScore: number;
  topicScore: number;
  compositeScore: number;
}

export interface ClassifiedStoryLink {
  sourceArticleId: string;
  targetArticleId: string;
  relationshipType: StoryRelationshipType;
  confidence: number;
  sharedEntityIds: string[];
  sharedTopics: string[];
  temporalDistanceDays: number;
  causalExplanation?: string;
  evidenceSnippets: Array<{
    fromSource: string;
    fromTarget: string;
  }>;
}

// ─── Question Generation ──────────────────────────────────────────────────────

export interface GeneratedQuestionRaw {
  text: string;
  priority: QuestionPriority;
  verificationRequired?: boolean;
  answer?: string;
  investigationHint?: string;
  searchTerms?: string[];
  entitiesToWatch?: string[];
  timeframe?: string;
}

export interface GeneratedQuestionSet {
  answered: GeneratedQuestionRaw[];
  open: GeneratedQuestionRaw[];
  historical: GeneratedQuestionRaw[];
  future: GeneratedQuestionRaw[];
}

// ─── Claim Extraction ─────────────────────────────────────────────────────────

export interface ExtractedClaim {
  text: string;
  claimType: ClaimType;
  subject?: string;
  predicate?: string;
  object?: string;
  confidence: number;
  flags: string[];
}

export interface Evidence {
  sourceId?: string;
  sourceUrl: string;
  sourceCredibility: number;
  snippet: string;
  supportType: 'confirms' | 'partially_confirms' | 'context';
  publishedAt?: Date;
}

export interface Contradiction {
  sourceId?: string;
  sourceUrl: string;
  sourceCredibility: number;
  snippet: string;
  contradictionType: 'direct' | 'partial' | 'contextual';
  publishedAt?: Date;
}

// ─── Research Dossier ─────────────────────────────────────────────────────────

export interface TimelineEvent {
  date: Date;
  title: string;
  description: string;
  articleId?: string;
  importance: 'low' | 'medium' | 'high' | 'critical';
}

export interface WatchItem {
  entity: string;
  description: string;
  triggerKeywords: string[];
  importance: 'high' | 'medium' | 'low';
}

export interface RiskFactor {
  description: string;
  likelihood: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high' | 'critical';
  entityIds: string[];
}

// ─── Prediction ───────────────────────────────────────────────────────────────

export interface WatchSignal {
  description: string;
  entityToMonitor: string;
  triggerKeywords: string[];
  importance: 'high' | 'medium' | 'low';
}

// ─── Embedding ───────────────────────────────────────────────────────────────

export type EmbeddingVector = number[];

export interface EmbeddingResult {
  id: string;
  vector: EmbeddingVector;
  model: string;
  dimensions: number;
}

export interface SemanticSearchResult {
  articleId: string;
  similarity: number;
}

// ─── Queue Events ─────────────────────────────────────────────────────────────

export type QueueEventType =
  | 'article.ingested'
  | 'entity.extracted'
  | 'story.linked'
  | 'question.generated'
  | 'claim.extracted'
  | 'verification.requested'
  | 'narrative.updated'
  | 'research.requested'
  | 'prediction.triggered'
  | 'graph.updated';

export interface QueueEvent<T = unknown> {
  id: string;
  type: QueueEventType;
  payload: T;
  articleId?: string;
  storyChainId?: string;
  createdAt: Date;
  priority: 'high' | 'standard' | 'low';
}

export interface ArticleIngestedPayload {
  articleId: string;
  headline: string;
  body: string;
  publishedAt: Date;
}

export interface EntityExtractedPayload {
  articleId: string;
  entityIds: string[];
}

export interface StoryLinkedPayload {
  articleId: string;
  storyChainId?: string;
  linkIds: string[];
}

export interface QuestionGeneratedPayload {
  articleId: string;
  questionIds: string[];
  storyChainId?: string;
}

export interface ClaimExtractedPayload {
  articleId: string;
  claimIds: string[];
}

export interface VerificationRequestedPayload {
  claimId: string;
  articleId: string;
  priority: 'high' | 'standard' | 'low';
}

export interface NarrativeUpdatedPayload {
  storyChainId: string;
  articleId: string;
  turningPointDetected: boolean;
}

export interface ResearchRequestedPayload {
  storyChainId: string;
  articleId: string;
  importanceScore: number;
}
