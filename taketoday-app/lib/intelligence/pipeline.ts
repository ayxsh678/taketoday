import 'server-only';
import { generateAndStoreArticleEmbedding } from '@/lib/ai/embeddings';
import { extractAndStoreEntities } from './entity-extraction/extractor';
import { linkArticleToStories } from './story-linking';
import { generateAndStoreQuestions } from './question-generation';
import { extractAndStoreClaims } from './claim-extraction';
import { verifyClaims } from './verification';
import { updateNarrative } from './narrative';
import { runResearchAgent, hasFreshDossier } from './research';
import { runPredictionEngine } from './prediction';
import { events } from '@/lib/queue';
import type { ClassifiedStoryLink } from './types';

export interface PipelineInput {
  articleId: string;
  headline: string;
  excerpt?: string | null;
  body?: string | null;
  publishedAt: Date;
}

export interface PipelineResult {
  articleId: string;
  embeddingStored: boolean;
  entityIds: string[];
  storyLinksCreated: number;
  questionsGenerated: number;
  claimsExtracted: number;
  claimsVerified: number;
  storyChainId: string | null;
  questionsResolved: number;
  dossierId: string | null;
  predictionsCreated: number;
  errors: string[];
}

// Run all intelligence pipeline stages sequentially for a single article.
// Designed to run inside Next.js after() — non-blocking relative to the HTTP response.
// Each stage is independent; failures are captured but do not abort subsequent stages.
export async function runIntelligencePipeline(input: PipelineInput): Promise<PipelineResult> {
  const { articleId, headline, excerpt, body, publishedAt } = input;
  const errors: string[] = [];
  let embeddingStored = false;
  let entityIds: string[] = [];
  let storyLinks: ClassifiedStoryLink[] = [];
  let storyLinksCreated = 0;
  let questionsGenerated = 0;
  let claimsExtracted = 0;
  let claimsVerified = 0;
  let storyChainId: string | null = null;
  let questionsResolved = 0;
  let dossierId: string | null = null;
  let predictionsCreated = 0;

  // Stage 1: Generate + store article embedding
  try {
    await generateAndStoreArticleEmbedding(articleId, headline, excerpt, body);
    embeddingStored = true;
  } catch (err) {
    errors.push(`embedding: ${err instanceof Error ? err.message : String(err)}`);
    // Embedding failure is recoverable — story linking falls back to entity/category signals only
  }

  // Stage 2: Entity extraction
  try {
    entityIds = await extractAndStoreEntities(articleId, headline, body ?? '');
    await events.entityExtracted({ articleId, entityIds });
  } catch (err) {
    errors.push(`entity-extraction: ${err instanceof Error ? err.message : String(err)}`);
  }

  // Stage 3: Story linking (requires embedding + entities for full signal, degrades gracefully)
  try {
    storyLinks = await linkArticleToStories(articleId);
    storyLinksCreated = storyLinks.length;
    await events.storyLinked({ articleId, linkIds: [] });
  } catch (err) {
    errors.push(`story-linking: ${err instanceof Error ? err.message : String(err)}`);
  }

  // Stage 4: Question generation (uses entities + story links as context)
  try {
    const result = await generateAndStoreQuestions(articleId);
    questionsGenerated = result.questionIds.length;
    await events.questionGenerated({ articleId, questionIds: result.questionIds });
  } catch (err) {
    errors.push(`question-generation: ${err instanceof Error ? err.message : String(err)}`);
  }

  // Stage 5: Claim extraction + auto-verification
  try {
    const claimResult = await extractAndStoreClaims(articleId, headline, body ?? '');
    claimsExtracted = claimResult.claims.length;
    await events.claimExtracted({ articleId, claimIds: claimResult.claims.map((c) => c.id) });

    // Verify high-priority claims (QUANTITATIVE + CAUSAL only, max 5)
    const verifyResult = await verifyClaims(articleId);
    claimsVerified = verifyResult.verified;
    if (verifyResult.errors.length > 0) {
      errors.push(...verifyResult.errors.map((e) => `verification: ${e}`));
    }
  } catch (err) {
    errors.push(`claim-extraction: ${err instanceof Error ? err.message : String(err)}`);
  }

  // Stage 6: Narrative engine — chain assignment, narrative synthesis, question lifecycle
  try {
    const narrativeResult = await updateNarrative({
      articleId,
      headline,
      body: body ?? null,
      links: storyLinks,
      entityIds,
    });
    storyChainId = narrativeResult.storyChainId;
    questionsResolved = narrativeResult.questionsResolved;
    if (storyChainId) {
      await events.narrativeUpdated({
        articleId,
        storyChainId,
        turningPointDetected: narrativeResult.turningPointDetected,
      });
    }
  } catch (err) {
    errors.push(`narrative: ${err instanceof Error ? err.message : String(err)}`);
  }

  // Stage 7: Research agent — triggers only when chain is assigned and no fresh dossier exists
  if (storyChainId) {
    try {
      const fresh = await hasFreshDossier(storyChainId);
      if (!fresh) {
        const researchResult = await runResearchAgent(storyChainId);
        dossierId = researchResult.dossierId;
        if (researchResult.ran) {
          await events.researchRequested({
            articleId,
            storyChainId,
            importanceScore: 70,
          });
        }
      }
    } catch (err) {
      errors.push(`research: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  // Stage 8: Prediction engine — signal detection + prediction generation + outcome tracking
  if (storyChainId) {
    try {
      const predResult = await runPredictionEngine(
        storyChainId,
        articleId,
        headline,
        body ?? '',
      );
      predictionsCreated = predResult.predictionsCreated;
    } catch (err) {
      errors.push(`prediction: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  if (errors.length > 0) {
    console.error(`[pipeline] Article ${articleId} pipeline errors:`, errors);
  }

  return {
    articleId,
    embeddingStored,
    entityIds,
    storyLinksCreated,
    questionsGenerated,
    claimsExtracted,
    claimsVerified,
    storyChainId,
    questionsResolved,
    dossierId,
    predictionsCreated,
    errors,
  };
}
