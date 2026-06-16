import 'server-only';
import OpenAI from 'openai';
import { appConfig } from '@/lib/config/app';
import { upsertArticleEmbeddingRecord, storeEmbeddingVector } from '@/lib/intelligence/repositories/embedding';

const EMBEDDING_MODEL = 'text-embedding-3-small';
const EMBEDDING_DIMENSIONS = 1536;

function getClient(): OpenAI {
  if (!appConfig.openaiApiKey) throw new Error('OPENAI_API_KEY not configured');
  return new OpenAI({ apiKey: appConfig.openaiApiKey });
}

// Generate embedding vector for arbitrary text
export async function embedText(text: string): Promise<number[]> {
  const client = getClient();
  const response = await client.embeddings.create({
    model: EMBEDDING_MODEL,
    input: text.slice(0, 8000), // token budget guard
    dimensions: EMBEDDING_DIMENSIONS,
  });
  return response.data[0].embedding;
}

// Build the text to embed for an article — title + excerpt drives most semantic signal
export function buildArticleEmbeddingInput(headline: string, excerpt?: string | null, body?: string | null): string {
  const parts = [headline];
  if (excerpt) parts.push(excerpt);
  // Add first 500 chars of body for extra signal if excerpt absent
  if (!excerpt && body) parts.push(body.replace(/<[^>]+>/g, '').slice(0, 500));
  return parts.join('\n');
}

// Generate and persist an article embedding (idempotent — safe to call multiple times)
export async function generateAndStoreArticleEmbedding(
  articleId: string,
  headline: string,
  excerpt?: string | null,
  body?: string | null,
): Promise<void> {
  const text = buildArticleEmbeddingInput(headline, excerpt, body);
  const vector = await embedText(text);

  const record = await upsertArticleEmbeddingRecord(articleId, EMBEDDING_MODEL);
  await storeEmbeddingVector(record.id, vector);
}

export { EMBEDDING_MODEL, EMBEDDING_DIMENSIONS };
