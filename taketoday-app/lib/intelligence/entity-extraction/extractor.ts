import 'server-only';
import { callLLMWithTool } from '@/lib/ai/llm';
import { upsertEntity, createEntityMention } from '@/lib/intelligence/repositories/entity';
import type { EntityType } from '@prisma/client';
import type { ExtractedEntity } from '@/lib/intelligence/types';

const ENTITY_TYPES: EntityType[] = [
  'PERSON', 'ORGANIZATION', 'COMPANY', 'COUNTRY', 'CITY',
  'PRODUCT', 'TECHNOLOGY', 'EVENT', 'LEGISLATION', 'FINANCIAL_INSTRUMENT', 'CONCEPT',
];

const SYSTEM_PROMPT = `You are an expert entity extractor for a news intelligence system.
Extract named entities from news articles with high precision.

For each entity:
- Assign the most specific type
- Resolve ambiguous references using context ("the company" → OpenAI)
- Extract the canonical (official/full) name
- Mark isFocal=true for the 1-3 central subjects of the article
- Confidence 0.0-1.0 (< 0.7 for ambiguous references)

Do NOT invent entities not present in the text.
For companies, always use official legal name in canonicalName.
Resolve pronouns before listing.`;

const EXTRACTION_SCHEMA = {
  type: 'object',
  properties: {
    entities: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          surfaceForm: { type: 'string', description: 'Exact text from article' },
          canonicalName: { type: 'string', description: 'Official/full name' },
          type: { type: 'string', enum: ENTITY_TYPES },
          confidence: { type: 'number', minimum: 0, maximum: 1 },
          isFocal: { type: 'boolean' },
          attributes: {
            type: 'object',
            additionalProperties: { type: 'string' },
          },
        },
        required: ['surfaceForm', 'canonicalName', 'type', 'confidence', 'isFocal'],
      },
    },
  },
  required: ['entities'],
};

interface RawExtractionResult {
  entities: Array<{
    surfaceForm: string;
    canonicalName: string;
    type: string;
    confidence: number;
    isFocal: boolean;
    attributes?: Record<string, string>;
  }>;
}

// Extract entities from article text and persist them
// Returns the list of entity IDs created/updated
export async function extractAndStoreEntities(
  articleId: string,
  headline: string,
  body: string,
): Promise<string[]> {
  const text = `${headline}\n\n${body.replace(/<[^>]+>/g, '').slice(0, 4000)}`;

  const result = await callLLMWithTool<RawExtractionResult>({
    system: SYSTEM_PROMPT,
    user: `Extract entities from this article:\n\n${text}`,
    toolName: 'extract_entities',
    toolDescription: 'Extract named entities from a news article',
    schema: EXTRACTION_SCHEMA,
    maxTokens: 1500,
    temperature: 0.1,
  });

  const entityIds: string[] = [];

  for (const raw of result.entities) {
    // Skip low-confidence or invalid type
    if (raw.confidence < 0.5) continue;
    const entityType = raw.type as EntityType;
    if (!ENTITY_TYPES.includes(entityType)) continue;

    const entity = await upsertEntity({
      canonicalName: raw.canonicalName,
      entityType,
      attributes: raw.attributes ?? {},
    });

    await createEntityMention({
      articleId,
      entityId: entity.id,
      surfaceForm: raw.surfaceForm,
      confidence: raw.confidence,
      isFocal: raw.isFocal,
    });

    entityIds.push(entity.id);
  }

  return entityIds;
}

export type { ExtractedEntity };
