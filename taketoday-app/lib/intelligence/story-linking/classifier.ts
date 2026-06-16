import 'server-only';
import { callLLMWithTool } from '@/lib/ai/llm';
import type { StoryRelationshipType } from '@prisma/client';
import type { ClassifiedStoryLink } from '@/lib/intelligence/types';

const RELATIONSHIP_TYPES: StoryRelationshipType[] = [
  'CAUSED_BY', 'FOLLOW_UP', 'CONTRADICTION', 'CONFIRMATION',
  'ESCALATION', 'BACKGROUND', 'EFFECT_OF', 'PARALLEL', 'REFUTATION',
];

const SYSTEM_PROMPT = `You are an investigative journalist classifying the relationship between two news articles.

Relationship types:
- CAUSED_BY: Article A was directly caused by the event in Article B
- FOLLOW_UP: Article A continues or updates Article B
- CONTRADICTION: Article A directly contradicts claims in Article B
- CONFIRMATION: Article A confirms or corroborates Article B
- ESCALATION: Article A shows intensification of the trend in Article B
- BACKGROUND: Article B provides historical context for Article A
- EFFECT_OF: Article A is a downstream consequence of Article B's event
- PARALLEL: Same timeframe, thematically linked but not causally
- REFUTATION: Article A directly disproves a claim in Article B

Use chain-of-thought before classifying:
1. What is the core claim of Article A?
2. What is the core claim of Article B?
3. What entities appear in both?
4. What is the temporal order?
5. Could A have caused, confirmed, contradicted, or escalated B?

Set confidence < 0.6 if relationship is ambiguous. Return null if no meaningful relationship.`;

const CLASSIFICATION_SCHEMA = {
  type: 'object',
  properties: {
    hasRelationship: { type: 'boolean' },
    relationshipType: { type: 'string', enum: RELATIONSHIP_TYPES },
    confidence: { type: 'number', minimum: 0, maximum: 1 },
    causalExplanation: { type: 'string', description: '1-2 sentence explanation of how A relates to B' },
    evidenceFromA: { type: 'string', description: 'Key phrase from Article A supporting this classification' },
    evidenceFromB: { type: 'string', description: 'Key phrase from Article B supporting this classification' },
  },
  required: ['hasRelationship'],
};

interface ClassificationResult {
  hasRelationship: boolean;
  relationshipType?: string;
  confidence?: number;
  causalExplanation?: string;
  evidenceFromA?: string;
  evidenceFromB?: string;
}

// Classify the relationship between article A (new) and article B (candidate)
export async function classifyRelationship(
  articleA: { id: string; headline: string; excerpt?: string | null },
  articleB: { id: string; headline: string },
  sharedEntityIds: string[],
  sharedTopics: string[],
  temporalDistanceDays: number,
): Promise<ClassifiedStoryLink | null> {
  const userPrompt = `Article A (new): "${articleA.headline}"
${articleA.excerpt ? `Summary A: ${articleA.excerpt}` : ''}

Article B (older): "${articleB.headline}"

Shared entities: ${sharedEntityIds.length} in common
Days apart: ${temporalDistanceDays}

Classify the relationship between A and B.`;

  const result = await callLLMWithTool<ClassificationResult>({
    system: SYSTEM_PROMPT,
    user: userPrompt,
    toolName: 'classify_relationship',
    toolDescription: 'Classify the narrative relationship between two news articles',
    schema: CLASSIFICATION_SCHEMA,
    maxTokens: 500,
    temperature: 0.2,
  });

  if (!result.hasRelationship || !result.relationshipType || !result.confidence) return null;
  if (result.confidence < 0.6) return null;

  const relType = result.relationshipType as StoryRelationshipType;
  if (!RELATIONSHIP_TYPES.includes(relType)) return null;

  return {
    sourceArticleId: articleA.id,
    targetArticleId: articleB.id,
    relationshipType: relType,
    confidence: result.confidence,
    sharedEntityIds,
    sharedTopics,
    temporalDistanceDays,
    causalExplanation: result.causalExplanation,
    evidenceSnippets: [
      {
        fromSource: result.evidenceFromA ?? '',
        fromTarget: result.evidenceFromB ?? '',
      },
    ],
  };
}
