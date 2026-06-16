export type AITask =
  | 'category_classification'
  | 'topic_extraction'
  | 'tag_generation'
  | 'seo_metadata'
  | 'headline_generation'
  | 'summary_generation'
  | 'social_caption'
  | 'whatsapp_update'
  | 'twitter_post'
  | 'content_moderation'
  | 'duplicate_detection'
  | 'excerpt_generation'
  | 'article_generation'
  | 'article_rewriting'
  | 'editorial_enhancement'
  | 'carousel_generation'
  | 'claim_extraction'
  | 'entity_extraction'
  | 'story_classification'
  | 'question_generation'
  | 'prediction_generation'
  | 'research'
  | 'verification'
  | 'fact_check';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export type ProviderName = 'gemini-flash' | 'gemini-pro' | 'gpt-55';

export interface PromptInput {
  system: string;
  user: string;
  maxTokens?: number;
  temperature?: number;
  schema?: Record<string, unknown>;
  toolName?: string;
  toolDescription?: string;
}

export interface GenerationResult {
  text: string;
  parsed?: unknown;
  inputTokens: number;
  outputTokens: number;
  model: string;
  provider: ProviderName;
}

export interface AIProvider {
  readonly name: ProviderName;
  generate(input: PromptInput): Promise<GenerationResult>;
}
