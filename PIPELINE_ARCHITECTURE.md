# TakeToday: Research + Verification Pipeline
## Production Architecture for a Living News Intelligence System

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [System Architecture Overview](#system-architecture-overview)
3. [Data Flow Diagram](#data-flow-diagram)
4. [Stage 1 — Ingestion Layer](#stage-1--ingestion-layer)
5. [Stage 2 — Entity Extraction Engine](#stage-2--entity-extraction-engine)
6. [Stage 3 — Story Linking Engine](#stage-3--story-linking-engine)
7. [Stage 4 — Question Generation Engine](#stage-4--question-generation-engine)
8. [Stage 5 — Verification Pipeline](#stage-5--verification-pipeline)
9. [Stage 6 — Research Agent](#stage-6--research-agent)
10. [Stage 7 — Knowledge Graph](#stage-7--knowledge-graph)
11. [Stage 8 — Narrative Construction](#stage-8--narrative-construction)
12. [Stage 9 — Prediction Layer](#stage-9--prediction-layer)
13. [Database Schemas](#database-schemas)
14. [Knowledge Graph Schema](#knowledge-graph-schema)
15. [Queue Architecture](#queue-architecture)
16. [Agent Orchestration Design](#agent-orchestration-design)
17. [LLM Prompt Strategies](#llm-prompt-strategies)
18. [Verification Methodology](#verification-methodology)
19. [Ranking Algorithms](#ranking-algorithms)
20. [Source Credibility Scoring](#source-credibility-scoring)
21. [Event Linking Algorithms](#event-linking-algorithms)
22. [Question Generation Algorithms](#question-generation-algorithms)
23. [Timeline Construction Algorithms](#timeline-construction-algorithms)
24. [Tech Stack](#tech-stack)
25. [Scalability Strategy](#scalability-strategy)
26. [Implementation Roadmap](#implementation-roadmap)

---

## Executive Summary

TakeToday is not a news aggregator. It is a **continuously evolving research intelligence system** where every incoming article is:

1. Normalized and fingerprinted
2. Stripped of entities and claims
3. Linked causally to historical events
4. Cross-examined against prior reporting
5. Expanded into open investigative questions
6. Verified at the claim level with evidence chains
7. Embedded into a growing knowledge graph
8. Woven into living story narratives
9. Used to generate forward-looking predictions

The result: instead of 100 separate news articles about AI, TakeToday produces a single living dossier titled **"The AI Power Shift (2023–present)"** that self-updates as new events arrive.

---

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         INTAKE LAYER                                │
│  RSS  │  NewsAPI  │  Twitter/X  │  Press Releases  │  Gov Docs     │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                    ┌────────▼────────┐
                    │  Ingestion      │ ◄── Dedup, Normalize, Fingerprint
                    │  Service        │
                    └────────┬────────┘
                             │
              ┌──────────────▼──────────────────┐
              │         Message Queue (Kafka)    │
              │  ingestion → extraction →        │
              │  linking → questions →           │
              │  verification → graph            │
              └──────────────┬──────────────────┘
                             │
        ┌────────────────────▼────────────────────────┐
        │              Processing Pipeline             │
        │                                             │
        │  ┌──────────┐   ┌──────────┐   ┌────────┐  │
        │  │ Entity   │   │  Story   │   │  QGen  │  │
        │  │Extraction│──►│ Linking  │──►│ Engine │  │
        │  └──────────┘   └──────────┘   └────────┘  │
        │        │               │             │      │
        │        ▼               ▼             ▼      │
        │  ┌──────────┐   ┌──────────┐   ┌────────┐  │
        │  │Verifica- │   │ Research │   │Predict-│  │
        │  │tion Agent│   │  Agent   │   │  ion   │  │
        │  └──────────┘   └──────────┘   └────────┘  │
        └────────────────────┬────────────────────────┘
                             │
              ┌──────────────▼──────────────────┐
              │        Knowledge Graph           │
              │    Neo4j + pgvector + Redis      │
              └──────────────┬──────────────────┘
                             │
              ┌──────────────▼──────────────────┐
              │      Narrative + Prediction      │
              │         Construction             │
              └──────────────┬──────────────────┘
                             │
              ┌──────────────▼──────────────────┐
              │       Next.js Frontend           │
              │  Story Chains │ Dossiers │ Graph │
              └─────────────────────────────────┘
```

---

## Data Flow Diagram

```
Raw Article
    │
    ▼
[INGESTION]
│  • URL canonicalization
│  • Deduplication (SimHash + semantic hash)
│  • Paywall bypass (Diffbot/Jina)
│  • Language detection + translation
│  • Metadata extraction
    │
    ▼
NormalizedArticle { id, url, title, content, publishedAt, sourceId, lang }
    │
    ├──────────────────────────────────────────────────────────┐
    ▼                                                          ▼
[ENTITY EXTRACTION]                                    [CLAIM EXTRACTION]
│  • NER (spaCy + GPT-4o)                             │  • Statement detection
│  • Coreference resolution                            │  • Quantitative claims
│  • Entity disambiguation (Wikidata)                  │  • Attribution tagging
│  • Relationship extraction                           │  • Hedging detection
    │                                                          │
    ▼                                                          ▼
EntityMentions[]                                       ClaimList[]
    │                                                          │
    └────────────────────┬─────────────────────────────────────┘
                         ▼
                  [STORY LINKING]
                  │  • Semantic similarity search (pgvector)
                  │  • Entity overlap scoring
                  │  • Temporal proximity weighting
                  │  • Causal chain detection
                  │  • Contradiction detection
                         │
                         ▼
                  RelatedStories[] + RelationshipTypes[]
                         │
                         ▼
                  [QUESTION GENERATION]
                  │  • Answered questions
                  │  • Open questions
                  │  • Historical questions
                  │  • Forward predictions
                         │
                         ▼
                  QuestionSet { answered[], open[], historical[], future[] }
                         │
              ┌──────────┴──────────┐
              ▼                     ▼
     [VERIFICATION]         [RESEARCH AGENT]
     │  • Claim scoring      │  • Web search
     │  • Source triangul.   │  • EDGAR filings
     │  • Contradiction det.  │  • Wikidata lookup
     │  • Confidence calc.   │  • Timeline fetch
              │                     │
              ▼                     ▼
     VerifiedClaims[]       ResearchDossier{}
              │                     │
              └──────────┬──────────┘
                         ▼
                  [KNOWLEDGE GRAPH UPDATE]
                  │  • Upsert entities
                  │  • Create/strengthen edges
                  │  • Update story chains
                  │  • Propagate importance scores
                         │
                         ▼
                  [NARRATIVE + PREDICTION]
                  │  • Story chain update
                  │  • Living narrative refresh
                  │  • Next-event prediction
                  │  • Watch-list update
```

---

## Stage 1 — Ingestion Layer

### Input Sources

| Source Type        | Protocol        | Polling        | Library                  |
|--------------------|-----------------|----------------|--------------------------|
| RSS / Atom feeds   | HTTP GET        | Every 5 min    | rss-parser (Node)        |
| NewsAPI            | REST API        | Every 15 min   | newsapi-node             |
| GDELT              | HTTP bulk       | Hourly         | Custom fetcher           |
| Twitter/X          | Filtered stream | Real-time      | twitter-api-v2           |
| Press releases     | HTML scraping   | Every 30 min   | Playwright + Readability |
| Research papers    | arXiv API       | Daily          | arxiv-api                |
| Government docs    | RSS + scraping  | Daily          | Playwright               |
| Reddit             | Reddit API      | Every 30 min   | snoowrap                 |

### Normalized Article Object

```typescript
interface NormalizedArticle {
  id: string;                     // SHA-256 of canonical URL
  canonicalUrl: string;
  title: string;
  content: string;                // Full text, Readability-extracted
  summary: string;                // First 500 chars or meta description
  publishedAt: Date;
  fetchedAt: Date;
  sourceId: string;               // FK to sources table
  sourceName: string;
  authors: string[];
  language: string;               // ISO 639-1
  originalLanguage?: string;
  contentHash: string;            // SimHash for dedup
  embeddingId?: string;           // FK to embeddings store
  wordCount: number;
  mediaUrls: string[];
  externalLinks: string[];
  ingestionSource: IngestionSourceType;
  rawHtml?: string;               // Preserved for re-processing
  metadata: Record<string, unknown>;
}

type IngestionSourceType =
  | 'rss'
  | 'newsapi'
  | 'gdelt'
  | 'twitter'
  | 'scraper'
  | 'arxiv'
  | 'government'
  | 'manual';
```

### Deduplication Strategy

```
1. URL canonicalization (strip UTM params, normalize trailing slashes)
2. Exact hash check (SHA-256 of canonical URL) → reject if exists
3. SimHash of content (128-bit) → reject if Hamming distance < 8
4. Semantic similarity (cosine similarity of embeddings) → flag if > 0.92
   (same story from different sources = syndicated, mark as duplicate cluster)
```

### Ingestion Service (TypeScript)

```typescript
// apps/ingestion/src/pipeline.ts
class IngestionPipeline {
  async process(rawItem: RawIngestionItem): Promise<NormalizedArticle | null> {
    // 1. Canonicalize URL
    const canonicalUrl = canonicalizeUrl(rawItem.url);

    // 2. Check exact duplicate
    const existingId = await this.db.articles.findByUrl(canonicalUrl);
    if (existingId) return null;

    // 3. Fetch full content (bypass paywall via Diffbot if needed)
    const content = await this.contentFetcher.fetch(canonicalUrl);

    // 4. Check content-level duplicate via SimHash
    const simhash = computeSimHash(content.text);
    const nearDup = await this.deduper.findNearest(simhash, threshold: 8);
    if (nearDup) {
      await this.db.articles.markAsSyndicated(nearDup.id, canonicalUrl);
      return null;
    }

    // 5. Build normalized article
    const article = buildNormalizedArticle(rawItem, content);

    // 6. Generate and store embedding
    const embedding = await this.embedder.embed(article.title + ' ' + article.summary);
    article.embeddingId = await this.vectorStore.upsert(article.id, embedding);

    // 7. Check semantic near-duplicate
    const semanticNearDup = await this.vectorStore.findSimilar(embedding, threshold: 0.92);
    if (semanticNearDup.length > 0) {
      article.duplicateClusterId = semanticNearDup[0].id;
    }

    // 8. Persist + emit to queue
    await this.db.articles.create(article);
    await this.queue.emit('article.ingested', article);

    return article;
  }
}
```

---

## Stage 2 — Entity Extraction Engine

### Entity Types

```typescript
type EntityType =
  | 'PERSON'
  | 'ORGANIZATION'
  | 'COMPANY'
  | 'COUNTRY'
  | 'CITY'
  | 'PRODUCT'
  | 'TECHNOLOGY'
  | 'EVENT'
  | 'LEGISLATION'
  | 'FINANCIAL_INSTRUMENT'
  | 'CONCEPT';

interface ExtractedEntity {
  id: string;                      // Wikidata QID when available
  surfaceForm: string;             // As it appears in text
  canonicalName: string;           // Normalized (e.g. "Elon Musk")
  type: EntityType;
  wikidataId?: string;             // Q76 for Barack Obama
  aliases: string[];               // ["SpaceX", "Space Exploration Technologies"]
  confidence: number;              // 0-1
  mentionOffsets: [number, number][]; // Character positions in article
  attributes: Record<string, string>; // role, nationality, ticker, etc.
  relatedEntities: {
    entityId: string;
    relationshipType: string;
    confidence: number;
  }[];
}
```

### Extraction Pipeline

```
Article Content
      │
      ▼
  [spaCy NER]  ──────── Fast pass, identifies spans
      │
      ▼
  [Coreference Resolution]  ──── "He" → "Sam Altman"
      │
      ▼
  [LLM Entity Enrichment]  ──── GPT-4o or Claude for disambiguation
      │
      ▼
  [Wikidata Reconciliation]  ── Link to canonical Wikidata entity
      │
      ▼
  [Relationship Extraction]  ── "CEO of", "acquired", "partnered with"
      │
      ▼
  EntityMentions[] + EntityRelationships[]
```

### LLM Entity Enrichment Prompt

```
SYSTEM:
You are an expert entity extractor for a news intelligence system.
Your job is to extract structured entities from news articles with high precision.

For each entity:
- Assign the most specific type
- Resolve ambiguous references using context (e.g., "the company" → OpenAI)
- Extract relationships between entities
- Assign confidence scores

USER:
Article title: {{title}}
Article content: {{content}}

Return a JSON object with this exact shape:
{
  "entities": [
    {
      "surfaceForm": "string (exact text from article)",
      "canonicalName": "string (official/full name)",
      "type": "PERSON | ORGANIZATION | COMPANY | COUNTRY | PRODUCT | TECHNOLOGY | EVENT | LEGISLATION | FINANCIAL_INSTRUMENT | CONCEPT",
      "confidence": 0.0-1.0,
      "attributes": { "role": "string", "nationality": "string", ... },
      "relationships": [
        { "targetEntity": "string", "type": "CEO_OF | ACQUIRED | PARTNERED_WITH | FOUNDED | INVESTED_IN | ...", "confidence": 0.0-1.0 }
      ]
    }
  ]
}

Rules:
- Resolve pronouns and abbreviations before listing
- Do NOT invent entities not in the text
- Assign confidence < 0.7 for ambiguous references
- For companies, always use official legal name in canonicalName
```

---

## Stage 3 — Story Linking Engine

### Relationship Types

```typescript
type StoryRelationshipType =
  | 'caused_by'        // This event was directly caused by the prior event
  | 'follow_up'        // Continuation or update of prior event
  | 'contradiction'    // This contradicts prior reporting
  | 'confirmation'     // This confirms prior reporting
  | 'escalation'       // Intensification of a prior trend
  | 'background'       // Provides historical context
  | 'effect_of'        // Is a downstream consequence
  | 'parallel'         // Happening simultaneously and thematically linked
  | 'refutation';      // Directly disproves a prior claim

interface StoryLink {
  sourceArticleId: string;
  targetArticleId: string;
  relationshipType: StoryRelationshipType;
  confidence: number;              // 0-1
  sharedEntities: string[];        // Entity IDs in common
  sharedTopics: string[];
  temporalDistance: number;        // Days between events
  causalChainExplanation?: string; // LLM-generated rationale
  evidenceSnippets: {
    fromSource: string;
    fromTarget: string;
  }[];
}
```

### Linking Algorithm

```
For each new article A:

STEP 1 — CANDIDATE RETRIEVAL (recall phase)
  a. Vector similarity search: top-50 by cosine similarity in pgvector
  b. Entity overlap search: articles sharing ≥ 2 entities in last 90 days
  c. Topic overlap: BM25 keyword match in Elasticsearch (top-20)
  d. Union all candidates, deduplicate → candidate pool of ~100 articles

STEP 2 — SCORING (precision phase)
  For each candidate B, compute composite score:

  S_total = (
    0.35 × S_semantic     +   // cosine similarity of embeddings
    0.25 × S_entity       +   // Jaccard overlap of entities
    0.20 × S_temporal     +   // exponential decay on time gap
    0.20 × S_topic            // shared topic/category score
  )

  S_temporal = exp(-λ × days_apart)  where λ = 0.02 (90-day half-life)

STEP 3 — RELATIONSHIP CLASSIFICATION (LLM)
  For top-15 candidates (S_total > 0.40):
    - Send (A, B) pair to LLM relationship classifier
    - Extract relationship type + causal chain explanation
    - Discard if confidence < 0.60

STEP 4 — CONTRADICTION DETECTION
  For all verified claims in A:
    - Search for semantically opposite claims in candidate pool
    - Use NLI (Natural Language Inference) model for entailment/contradiction
    - Flag contradictions for verification pipeline

STEP 5 — PERSIST
  Store StoryLinks in both PostgreSQL (for queries) and Neo4j (for graph traversal)
```

### Linking Algorithm Implementation

```typescript
class StoryLinkingEngine {
  async linkArticle(article: NormalizedArticle): Promise<StoryLink[]> {
    // Phase 1: Candidate retrieval
    const [semanticCandidates, entityCandidates, topicCandidates] =
      await Promise.all([
        this.vectorStore.findSimilar(article.embeddingId, { topK: 50 }),
        this.db.findByEntityOverlap(article.entityIds, { minShared: 2, dayRange: 90 }),
        this.search.bm25Query(article.title + ' ' + article.summary, { topK: 20 }),
      ]);

    const candidatePool = deduplicateById([
      ...semanticCandidates,
      ...entityCandidates,
      ...topicCandidates,
    ]);

    // Phase 2: Score candidates
    const scored = candidatePool.map((candidate) => ({
      ...candidate,
      score: this.computeCompositeScore(article, candidate),
    }));

    const topCandidates = scored
      .filter((c) => c.score > 0.40)
      .sort((a, b) => b.score - a.score)
      .slice(0, 15);

    // Phase 3: LLM relationship classification
    const links = await Promise.all(
      topCandidates.map((candidate) =>
        this.classifyRelationship(article, candidate)
      )
    );

    return links.filter((l): l is StoryLink => l !== null && l.confidence >= 0.60);
  }

  private computeCompositeScore(a: NormalizedArticle, b: NormalizedArticle) {
    const semanticScore = a.embeddingScore ?? 0;
    const entityScore = jaccardSimilarity(a.entityIds, b.entityIds);
    const daysDiff = Math.abs(a.publishedAt.getTime() - b.publishedAt.getTime()) / 86400000;
    const temporalScore = Math.exp(-0.02 * daysDiff);
    const topicScore = jaccardSimilarity(a.topicIds, b.topicIds);

    return (
      0.35 * semanticScore +
      0.25 * entityScore +
      0.20 * temporalScore +
      0.20 * topicScore
    );
  }
}
```

---

## Stage 4 — Question Generation Engine

The most intellectually critical component. Every article generates four classes of questions that transform isolated news into an investigation.

### Question Schema

```typescript
type QuestionType = 'answered' | 'open' | 'historical' | 'future';
type QuestionPriority = 'critical' | 'high' | 'medium' | 'low';

interface GeneratedQuestion {
  id: string;
  articleId: string;
  text: string;
  type: QuestionType;
  priority: QuestionPriority;
  status: 'open' | 'answered' | 'partially_answered' | 'unanswerable';
  answer?: string;
  answerArticleId?: string;        // Article that answered this question
  investigationNotes?: string;     // Research agent findings
  relatedEntityIds: string[];
  relatedQuestionIds: string[];    // Questions this spawned or relates to
  importanceScore: number;         // 0-100
  verificationRequired: boolean;
  createdAt: Date;
  resolvedAt?: Date;
}
```

### Question Generation LLM Prompt

```
SYSTEM:
You are an investigative journalist and research analyst. Your role is to
generate precise, investigable questions from news articles that connect
to the broader information landscape.

You generate four types of questions:

1. ANSWERED: Questions this article itself directly answers
   Focus: What factual claims does this article make? What causation does it explain?

2. OPEN: Questions this article raises but does NOT answer
   Focus: What is still unexplained? What information is missing? What is assumed?

3. HISTORICAL: Questions linking this event to past events
   Focus: What precedents exist? What led here? Has this pattern occurred before?

4. FUTURE: Forward-looking investigative questions
   Focus: What should we monitor next? What is the likely next development?
          What early warning signals should we watch?

Rules:
- Questions must be SPECIFIC and ANSWERABLE (no vague generalities)
- Each question should name entities when possible
- Priority = CRITICAL if the question is the central unresolved thread of the story
- Flag verificationRequired = true if the article makes a claim that needs sourcing

USER:
Article title: {{title}}
Published: {{publishedAt}}
Source: {{sourceName}}
Content: {{content}}

Known related articles:
{{relatedArticlesSummaries}}

Known entities in this article:
{{entityList}}

Return JSON:
{
  "answered": [{ "text": "...", "answer": "...", "priority": "...", "verificationRequired": bool }],
  "open": [{ "text": "...", "priority": "...", "verificationRequired": bool, "investigationHint": "..." }],
  "historical": [{ "text": "...", "priority": "...", "searchTerms": ["..."] }],
  "future": [{ "text": "...", "priority": "...", "entitiesToWatch": ["..."], "timeframe": "..." }]
}

Generate 3-5 questions per category. Prioritize depth over breadth.
```

### Question Deduplication + Merging

```typescript
// Before inserting questions, check for semantic duplicates in the question DB
async function mergeQuestions(
  newQuestions: GeneratedQuestion[],
  articleId: string,
  db: Database,
  vectorStore: VectorStore,
): Promise<void> {
  for (const q of newQuestions) {
    const embedding = await embed(q.text);

    // Find semantically similar existing questions
    const similar = await vectorStore.findSimilarQuestions(embedding, {
      threshold: 0.88,
      topK: 5,
    });

    if (similar.length === 0) {
      // New question — insert
      await db.questions.create({ ...q, articleId });
    } else {
      // Merge: link the articles as co-raisers of the same question
      const existingQuestion = similar[0];
      await db.questions.addRelatedArticle(existingQuestion.id, articleId);
      await db.questions.incrementImportance(existingQuestion.id, 15);
      // A question raised by N articles gets proportionally higher importance
    }
  }
}
```

---

## Stage 5 — Verification Pipeline

Every factual claim in every article passes through systematic verification before the platform presents it as knowledge.

### Claim Schema

```typescript
type VerificationStatus =
  | 'verified'
  | 'partially_verified'
  | 'disputed'
  | 'unverified'
  | 'false'
  | 'misleading';

type ClaimType =
  | 'quantitative'    // "revenue grew 45%"
  | 'causal'          // "X happened because of Y"
  | 'attributional'   // "CEO said..."
  | 'predictive'      // "expects to reach..."
  | 'historical'      // "in 2019, they..."
  | 'comparative';    // "largest ever..."

interface VerifiedClaim {
  id: string;
  articleId: string;
  text: string;                     // The claim as stated
  claimType: ClaimType;
  subject: string;                  // Entity making/being claimed about
  predicate: string;                // The assertion
  object: string;                   // The object of assertion
  confidence: number;               // 0-100
  verificationStatus: VerificationStatus;
  evidence: Evidence[];
  contradictions: Contradiction[];
  primarySourceUrl?: string;
  primarySourceQuote?: string;
  verifiedAt: Date;
  verifiedBy: 'automated' | 'agent' | 'human';
  flags: ClaimFlag[];
}

interface Evidence {
  sourceId: string;
  sourceUrl: string;
  sourceCredibility: number;
  snippet: string;
  supportType: 'confirms' | 'partially_confirms' | 'context';
  publishedAt: Date;
}

interface Contradiction {
  sourceId: string;
  sourceUrl: string;
  sourceCredibility: number;
  snippet: string;
  contradictionType: 'direct' | 'partial' | 'contextual';
  publishedAt: Date;
}

type ClaimFlag =
  | 'hedged_language'        // "reportedly", "allegedly"
  | 'single_source'          // Only one source makes this claim
  | 'unattributed'           // No attribution provided
  | 'extraordinary_claim'    // High-impact, needs extra verification
  | 'politically_charged'
  | 'conflict_of_interest';  // Source has stake in the outcome
```

### Verification Workflow

```
Claim Text: "Nvidia Q3 revenue increased 122% year-over-year to $18.1B"

STEP 1 — CLAIM EXTRACTION
  LLM extracts structured claim:
  { subject: "Nvidia", predicate: "revenue_growth", object: "122% YoY to $18.1B", period: "Q3 2024" }
  type = "quantitative"

STEP 2 — SOURCE IDENTIFICATION
  a. Who is the article attributing this to?
     → Nvidia investor relations / earnings call
  b. Is the source primary (company) or secondary (journalist)?
  c. Flag if unattributed

STEP 3 — PRIMARY SOURCE LOOKUP
  Search priority:
  1. SEC EDGAR filings (for public companies)
  2. Official press releases
  3. Earnings call transcripts
  4. Government databases
  5. Academic papers
  → Find Nvidia 10-Q or earnings press release
  → Extract exact figure for comparison

STEP 4 — CORROBORATING SOURCES
  Vector search for articles making the same claim
  Require ≥ 2 corroborating sources from credibility tier A/B
  → Reuters: "Nvidia revenue surges 122%..." ✓
  → Bloomberg: "Nvidia Q3 earnings beat..." ✓

STEP 5 — CONTRADICTION SEARCH
  Semantic search for contradictory claims
  NLI model: does any source assert the OPPOSITE?
  → No contradictions found

STEP 6 — CONFIDENCE CALCULATION
  confidence = (
    primarySourceFound × 40      +  // 0 or 40
    corroboratingSourceCount × 10 +  // up to 30
    sourceCredibilityAvg × 0.2   +  // 0-20
    hedgingPenalty               +  // -0-20
    contradictionPenalty            // -0-40
  ).clamp(0, 100)

  → confidence = 40 + 20 + 16 + 0 - 0 = 76
  → status = "verified"
```

### Verification Engine Implementation

```typescript
class VerificationEngine {
  async verifyClaim(claim: ExtractedClaim): Promise<VerifiedClaim> {
    const [primarySource, corroborating, contradictions] = await Promise.all([
      this.findPrimarySource(claim),
      this.findCorroboratingSources(claim),
      this.findContradictions(claim),
    ]);

    const confidence = this.calculateConfidence({
      hasPrimarySource: !!primarySource,
      corroboratingCount: corroborating.length,
      avgCredibility: avgCredibility(corroborating),
      isHedged: detectHedging(claim.text),
      contradictionCount: contradictions.length,
      contradictionStrength: maxCredibility(contradictions),
    });

    const status = this.classifyStatus(confidence, contradictions);

    return {
      ...claim,
      confidence,
      verificationStatus: status,
      evidence: corroborating,
      contradictions,
      primarySourceUrl: primarySource?.url,
      primarySourceQuote: primarySource?.relevantQuote,
      verifiedAt: new Date(),
      verifiedBy: 'automated',
      flags: detectClaimFlags(claim, corroborating),
    };
  }

  private calculateConfidence(params: ConfidenceParams): number {
    let score = 0;
    if (params.hasPrimarySource) score += 40;
    score += Math.min(params.corroboratingCount * 10, 30);
    score += params.avgCredibility * 0.2;
    if (params.isHedged) score -= 15;
    score -= params.contradictionCount * 15;
    score -= params.contradictionStrength * 0.25;
    return Math.max(0, Math.min(100, score));
  }
}
```

---

## Stage 6 — Research Agent

An autonomous LLM agent that investigates high-importance stories, producing a structured dossier.

### Research Dossier Schema

```typescript
interface ResearchDossier {
  id: string;
  storyId: string;
  title: string;
  generatedAt: Date;
  lastUpdatedAt: Date;

  // Core content
  executiveSummary: string;
  keyFindings: string[];
  timeline: TimelineEvent[];
  entities: EntityProfile[];
  claims: VerifiedClaim[];
  openQuestions: GeneratedQuestion[];
  verificationSummary: VerificationSummary;

  // Research depth
  sourcesConsulted: SourceRecord[];
  primarySources: SourceRecord[];
  filingsCited: Filing[];
  academicReferencesCited: AcademicReference[];
  regulatoryActionsCited: RegulatoryAction[];

  // Intelligence
  historicalPrecedents: HistoricalPrecedent[];
  executiveStatements: ExecutiveStatement[];
  competitorPositions: CompetitorPosition[];

  // Forward-looking
  watchList: WatchItem[];
  riskFactors: RiskFactor[];
  predictions: Prediction[];

  importanceScore: number;
  confidenceScore: number;
}
```

### Research Agent Orchestration

```typescript
class ResearchAgent {
  private tools = {
    webSearch: new WebSearchTool(),           // Serper / Brave API
    secEdgar: new EDGARTool(),               // SEC filing lookup
    wikidata: new WikidataQueryTool(),       // Entity fact lookup
    newsHistory: new HistoricalNewsTool(),   // Search ingested articles
    arxiv: new ArxivTool(),                  // Academic papers
    regulations: new RegulatorySearchTool(), // PACER, EUR-Lex, etc.
    financials: new FinancialDataTool(),     // Polygon.io / Alpha Vantage
  };

  async investigate(article: NormalizedArticle, entities: ExtractedEntity[]): Promise<ResearchDossier> {
    const plan = await this.planResearch(article, entities);

    // Execute research plan using ReAct (Reason + Act) loop
    const context: ResearchContext = { article, entities, findings: [] };

    for (const step of plan.steps) {
      const toolResult = await this.executeTool(step.tool, step.params, context);
      context.findings.push({ step, result: toolResult });

      // After each step, re-evaluate plan
      const refinedPlan = await this.refinePlan(plan, context);
      plan.steps = refinedPlan.remainingSteps;
    }

    return this.synthesizeDossier(context);
  }

  private async planResearch(article: NormalizedArticle, entities: ExtractedEntity[]) {
    // LLM generates a research plan as structured JSON
    return await this.llm.complete({
      system: RESEARCH_PLANNER_PROMPT,
      user: `Article: ${article.title}\nEntities: ${JSON.stringify(entities)}\n\nPlan a research investigation.`,
      responseFormat: ResearchPlanSchema,
    });
  }
}
```

### Research Agent Prompt (ReAct Pattern)

```
SYSTEM:
You are an investigative research agent for TakeToday news intelligence.
You have access to the following tools:
- web_search(query: string): Search the web for current information
- sec_edgar(company: string, filingType: string): Find SEC regulatory filings
- wikidata_lookup(entity: string): Get structured facts about an entity
- news_history(query: string, dateRange: string): Search past ingested articles
- arxiv_search(query: string): Find academic papers
- regulatory_search(jurisdiction: string, query: string): Find regulatory actions

RESEARCH APPROACH:
1. Start with the article's central claim
2. Find the primary source of every factual assertion
3. Build a timeline of how this story developed
4. Find all relevant executive statements or official positions
5. Identify what questions remain open
6. Generate a watch-list of what to monitor

FORMAT: For each research step, output:
THOUGHT: [What I need to find and why]
ACTION: [tool_name(params)]
OBSERVATION: [Tool result]
...repeat...
SYNTHESIS: [Final structured dossier]

USER:
Investigate: {{articleTitle}}
Key entities: {{entityList}}
Open questions: {{openQuestions}}
Begin investigation.
```

---

## Stage 7 — Knowledge Graph

### Neo4j Node Schemas

```cypher
// Article node
CREATE (:Article {
  id: "art_abc123",
  url: "https://...",
  title: "...",
  publishedAt: datetime("2024-11-01"),
  sourceId: "src_nyt",
  credibilityScore: 87,
  importanceScore: 72,
  embeddingId: "emb_xyz"
})

// Entity node
CREATE (:Entity {
  id: "ent_openai",
  canonicalName: "OpenAI",
  type: "COMPANY",
  wikidataId: "Q21708376",
  aliases: ["Open AI", "OpenAI LP"],
  importanceScore: 95,
  lastMentioned: datetime("2024-11-01"),
  mentionCount: 1842
})

// Event node
CREATE (:Event {
  id: "evt_gpt6_launch",
  title: "OpenAI releases GPT-6",
  description: "...",
  date: datetime("2024-11-01"),
  importanceScore: 91,
  verificationStatus: "verified",
  storyChainId: "chain_openai_evolution"
})

// Question node
CREATE (:Question {
  id: "q_compute_demand",
  text: "What compute infrastructure does GPT-6 require?",
  type: "open",
  priority: "high",
  status: "open",
  importanceScore: 78,
  raisedCount: 4    // how many articles raised this same question
})

// Claim node
CREATE (:Claim {
  id: "clm_gpt6_perf",
  text: "GPT-6 achieves human-level performance on 87% of reasoning benchmarks",
  confidence: 62,
  verificationStatus: "partially_verified",
  claimType: "quantitative"
})

// Source node
CREATE (:Source {
  id: "src_nyt",
  name: "The New York Times",
  domain: "nytimes.com",
  credibilityScore: 88,
  biasRating: "center-left",
  type: "mainstream_media",
  country: "US"
})

// Story Chain node
CREATE (:StoryChain {
  id: "chain_openai_ms",
  title: "The OpenAI–Microsoft Partnership Evolution",
  description: "...",
  startDate: datetime("2019-07-22"),
  isActive: true,
  importanceScore: 94
})
```

### Neo4j Relationship Schemas

```cypher
// Event causality
(e1:Event)-[:CAUSED_BY { confidence: 0.82, explanation: "..." }]->(e2:Event)
(e1:Event)-[:LED_TO { confidence: 0.75 }]->(e2:Event)

// Article relationships
(a:Article)-[:DESCRIBES { isPrimary: true }]->(e:Event)
(a:Article)-[:MENTIONS { mentionCount: 3, isFocal: true }]->(ent:Entity)
(a:Article)-[:PUBLISHED_BY]->(s:Source)
(a:Article)-[:MAKES_CLAIM]->(c:Claim)
(a:Article)-[:LINKED_TO { relationshipType: "confirmation", confidence: 0.79 }]->(a2:Article)

// Question relationships
(e:Event)-[:RAISES]->(q:Question)
(q:Question)-[:ANSWERED_BY]->(a:Article)
(q:Question)-[:SPAWNED { reason: "..." }]->(q2:Question)
(q:Question)-[:ABOUT]->(ent:Entity)

// Claim relationships
(c:Claim)-[:VERIFIED_BY { snippet: "..." }]->(a:Article)
(c:Claim)-[:CONTRADICTED_BY { snippet: "...", strength: 0.9 }]->(a:Article)
(c:Claim)-[:MADE_BY]->(ent:Entity)

// Entity relationships
(ent1:Entity)-[:WORKS_FOR { startDate: ..., role: "CEO" }]->(ent2:Entity)
(ent1:Entity)-[:ACQUIRED { date: ..., value: "$X" }]->(ent2:Entity)
(ent1:Entity)-[:COMPETES_WITH]->(ent2:Entity)
(ent1:Entity)-[:INVESTED_IN { amount: "$X", date: ... }]->(ent2:Entity)
(ent1:Entity)-[:INVOLVED_IN]->(e:Event)

// Story chain membership
(e:Event)-[:PART_OF { sequenceIndex: 1, importance: 0.9 }]->(sc:StoryChain)
(sc:StoryChain)-[:INVOLVES]->(ent:Entity)
```

### Graph Query Examples

```cypher
// Trace the causal chain from GPT-6 launch to Microsoft partnership
MATCH path = (e1:Event {title: "OpenAI releases GPT-6"})-[:LED_TO*1..5]->(e2:Event)
RETURN path, length(path) as chainLength
ORDER BY chainLength ASC

// Find all unanswered questions about an entity
MATCH (ent:Entity {canonicalName: "OpenAI"})<-[:ABOUT]-(q:Question {status: "open"})
RETURN q.text, q.priority, q.importanceScore
ORDER BY q.importanceScore DESC

// Find contradictions in claims about a topic
MATCH (c1:Claim)-[:CONTRADICTED_BY]->(a:Article)-[:PUBLISHED_BY]->(s:Source)
WHERE c1.text CONTAINS "OpenAI" AND c1.confidence < 70
RETURN c1.text, s.name, c1.verificationStatus

// Get full story chain with all articles and questions
MATCH (sc:StoryChain {id: "chain_openai_ms"})
MATCH (e:Event)-[:PART_OF]->(sc)
MATCH (a:Article)-[:DESCRIBES]->(e)
MATCH (e)-[:RAISES]->(q:Question)
RETURN sc, collect(DISTINCT e), collect(DISTINCT a), collect(DISTINCT q)
```

---

## Stage 8 — Narrative Construction

### Story Chain Schema

```typescript
interface StoryChain {
  id: string;
  title: string;
  slug: string;
  description: string;
  startDate: Date;
  lastUpdated: Date;
  isActive: boolean;
  importance: number;

  // Narrative structure
  chapters: StoryChapter[];
  livingNarrative: string;         // LLM-generated evolving summary
  keyTurningPoints: TurningPoint[];
  centralEntities: string[];
  centralQuestions: string[];
  unresolvedThreads: string[];

  // Metadata
  totalArticles: number;
  totalQuestions: number;
  totalVerifiedClaims: number;
  totalOpenQuestions: number;
  averageCredibility: number;
  tags: string[];
}

interface StoryChapter {
  id: string;
  title: string;
  sequenceIndex: number;
  dateRange: { start: Date; end?: Date };
  events: Event[];
  keyArticles: Article[];
  summary: string;
  questionsRaised: Question[];
  questionsAnswered: Question[];
  claimsVerified: VerifiedClaim[];
  nextChapterTransition?: string;  // What triggered the next chapter
}

interface TurningPoint {
  eventId: string;
  description: string;
  date: Date;
  impact: 'minor' | 'moderate' | 'major' | 'critical';
  explanation: string;             // Why this was a pivot
}
```

### Narrative Update Algorithm

```
When a new article arrives with high importance (score > 70):

1. STORY CHAIN ASSIGNMENT
   - Check if article matches an existing story chain
     (via entity overlap + semantic similarity to chain description)
   - If match score > 0.65 → assign to existing chain
   - If 0.40 < match < 0.65 → create potential new chapter in existing chain
   - If match < 0.40 → spawn new story chain

2. CHAPTER DETECTION
   - Check if this event represents a meaningful narrative shift:
     a. New major entity enters the story
     b. A previously open question is answered
     c. A contradiction to prior reporting emerges
     d. The story escalates in a new dimension
   - If yes → create new chapter

3. LIVING NARRATIVE UPDATE (LLM)
   Prompt: "The following story chain has a new development.
   Update the living narrative to integrate this new event.
   Preserve the historical arc, add the new development,
   and identify what new threads this opens."

4. TURNING POINT DETECTION
   If the event fundamentally changes the direction of the story,
   mark it as a turning point with impact classification.

5. QUESTION LIFECYCLE UPDATE
   - Mark previously open questions as answered if new article resolves them
   - Add new questions raised by this article to the chain
   - Update "unresolvedThreads" list
```

### Narrative Construction Prompt

```
SYSTEM:
You are the narrative editor for TakeToday intelligence system.
You maintain living story chains — evolving narratives where each new event
is woven into a continuous investigative arc rather than treated as standalone news.

A good narrative:
- Has a clear beginning (what triggered the story)
- Tracks cause-effect relationships explicitly
- Names the central questions that drove investigation
- Records what was confirmed, contradicted, or discovered
- Always ends with what remains unresolved
- Uses active, journalistic prose (not passive voice)
- Is written as if by an investigative editor, not a summarizer

USER:
Story chain title: {{storyTitle}}
Current narrative: {{currentNarrative}}

New event: {{newArticleTitle}}
Published: {{publishedAt}}
Key facts: {{keyFacts}}
Relationship to existing story: {{relationshipType}}
Questions this answers: {{answeredQuestions}}
Questions this raises: {{newQuestions}}

Rewrite the living narrative to incorporate this new development.
Keep the total length under 800 words.
End with a "WHAT TO WATCH" section listing the top 3 unresolved threads.
```

---

## Stage 9 — Prediction Layer

### Prediction Schema

```typescript
interface Prediction {
  id: string;
  storyChainId: string;
  text: string;                    // "Microsoft will announce compute expansion within 60 days"
  type: PredictionType;
  confidence: number;              // 0-100
  timeframe: PredictionTimeframe;
  targetDate?: Date;               // Expected date range
  entities: string[];              // Entities to monitor
  signals: WatchSignal[];          // What to watch for to confirm/deny
  basis: string;                   // Reasoning
  historicalPatterns: string[];    // Prior events that inform this
  status: PredictionStatus;
  resolvedAt?: Date;
  outcome?: 'correct' | 'incorrect' | 'partially_correct';
  createdAt: Date;
}

type PredictionType =
  | 'next_event'         // What happens next
  | 'emerging_risk'      // Risk that may materialize
  | 'entity_action'      // What an entity will do
  | 'market_move'        // Financial implications
  | 'regulatory_action'  // Government/regulatory response
  | 'escalation';        // Story will intensify

interface WatchSignal {
  description: string;
  entityToMonitor: string;
  triggerKeywords: string[];
  importance: 'high' | 'medium' | 'low';
}
```

### Prediction Algorithm

```
STEP 1 — PATTERN EXTRACTION
  For a story chain, retrieve all completed historical chains with:
  - Overlapping entities
  - Similar event sequence structure
  - Same industry/sector

STEP 2 — HISTORICAL ANALOGY
  Example:
  Pattern: "Company releases major product → competitor responds → partnership forms"
  Historical match: AWS launch → Azure response → Google Cloud partnerships
  Current story: GPT-6 release → ?

STEP 3 — SIGNAL DETECTION
  Current observable signals:
  - Hiring patterns (LinkedIn job postings from entities)
  - Patent filings
  - Regulatory filings
  - Executive statements
  - Supply chain signals

STEP 4 — LLM PREDICTION GENERATION
  Feed historical patterns + current signals → LLM generates
  structured predictions with confidence bands

STEP 5 — WATCH LIST GENERATION
  For each prediction, generate:
  - Specific entities to monitor
  - Keywords that signal the event is happening
  - RSS/news source queries to run
  - Time window for the event

STEP 6 — PREDICTION TRACKING
  Set up automated monitoring jobs that:
  - Run daily searches on watch signals
  - Alert when a prediction trigger fires
  - Auto-resolve predictions when confirmed or falsified
  - Feed outcomes back to improve future predictions
```

---

## Database Schemas

### PostgreSQL Schema

```sql
-- Core tables

CREATE TABLE sources (
  id            VARCHAR(64) PRIMARY KEY,
  name          VARCHAR(255) NOT NULL,
  domain        VARCHAR(255) UNIQUE NOT NULL,
  credibility_score  INTEGER CHECK (credibility_score BETWEEN 0 AND 100),
  bias_rating   VARCHAR(50),
  source_type   VARCHAR(50) NOT NULL,
  country       CHAR(2),
  is_active     BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE articles (
  id            VARCHAR(64) PRIMARY KEY,    -- SHA-256 of canonical URL
  canonical_url TEXT UNIQUE NOT NULL,
  title         TEXT NOT NULL,
  content       TEXT,
  summary       TEXT,
  published_at  TIMESTAMPTZ NOT NULL,
  fetched_at    TIMESTAMPTZ NOT NULL,
  source_id     VARCHAR(64) REFERENCES sources(id),
  language      CHAR(5) DEFAULT 'en',
  content_hash  VARCHAR(32) NOT NULL,       -- SimHash
  word_count    INTEGER,
  importance_score INTEGER DEFAULT 50,
  credibility_score INTEGER,
  ingestion_source VARCHAR(50),
  duplicate_cluster_id VARCHAR(64),
  embedding_id  VARCHAR(128),
  story_chain_id VARCHAR(64),
  metadata      JSONB DEFAULT '{}',
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX ON articles USING GIN (metadata);
CREATE INDEX ON articles (published_at DESC);
CREATE INDEX ON articles (source_id);
CREATE INDEX ON articles (story_chain_id);

CREATE TABLE entities (
  id            VARCHAR(64) PRIMARY KEY,
  canonical_name VARCHAR(255) NOT NULL,
  entity_type   VARCHAR(50) NOT NULL,
  wikidata_id   VARCHAR(20),
  aliases       TEXT[] DEFAULT '{}',
  description   TEXT,
  importance_score INTEGER DEFAULT 50,
  mention_count INTEGER DEFAULT 0,
  last_mentioned TIMESTAMPTZ,
  attributes    JSONB DEFAULT '{}',
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX ON entities (entity_type);
CREATE INDEX ON entities USING GIN (aliases);

CREATE TABLE entity_mentions (
  id            BIGSERIAL PRIMARY KEY,
  article_id    VARCHAR(64) REFERENCES articles(id),
  entity_id     VARCHAR(64) REFERENCES entities(id),
  surface_form  TEXT NOT NULL,
  confidence    NUMERIC(4,3),
  is_focal      BOOLEAN DEFAULT false,
  mention_offsets INT4RANGE[],
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX ON entity_mentions (article_id);
CREATE INDEX ON entity_mentions (entity_id);

CREATE TABLE events (
  id            VARCHAR(64) PRIMARY KEY,
  title         TEXT NOT NULL,
  description   TEXT,
  event_date    TIMESTAMPTZ,
  importance_score INTEGER DEFAULT 50,
  verification_status VARCHAR(30),
  story_chain_id VARCHAR(64),
  primary_article_id VARCHAR(64) REFERENCES articles(id),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE questions (
  id            VARCHAR(64) PRIMARY KEY,
  text          TEXT NOT NULL,
  question_type VARCHAR(20) NOT NULL,      -- answered/open/historical/future
  priority      VARCHAR(20) DEFAULT 'medium',
  status        VARCHAR(30) DEFAULT 'open',
  answer        TEXT,
  answer_article_id VARCHAR(64) REFERENCES articles(id),
  importance_score INTEGER DEFAULT 50,
  raised_count  INTEGER DEFAULT 1,
  verification_required BOOLEAN DEFAULT false,
  embedding_id  VARCHAR(128),
  related_entity_ids TEXT[] DEFAULT '{}',
  story_chain_id VARCHAR(64),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  resolved_at   TIMESTAMPTZ
);
CREATE INDEX ON questions (question_type, status);
CREATE INDEX ON questions (story_chain_id);

CREATE TABLE claims (
  id            VARCHAR(64) PRIMARY KEY,
  article_id    VARCHAR(64) REFERENCES articles(id),
  text          TEXT NOT NULL,
  claim_type    VARCHAR(30) NOT NULL,
  subject       TEXT,
  predicate     TEXT,
  object        TEXT,
  confidence    INTEGER CHECK (confidence BETWEEN 0 AND 100),
  verification_status VARCHAR(30) DEFAULT 'unverified',
  primary_source_url TEXT,
  primary_source_quote TEXT,
  evidence      JSONB DEFAULT '[]',
  contradictions JSONB DEFAULT '[]',
  flags         TEXT[] DEFAULT '{}',
  verified_at   TIMESTAMPTZ,
  verified_by   VARCHAR(20),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX ON claims (article_id);
CREATE INDEX ON claims (verification_status);

CREATE TABLE story_chains (
  id            VARCHAR(64) PRIMARY KEY,
  title         TEXT NOT NULL,
  slug          VARCHAR(255) UNIQUE,
  description   TEXT,
  living_narrative TEXT,
  start_date    TIMESTAMPTZ NOT NULL,
  last_updated  TIMESTAMPTZ DEFAULT NOW(),
  is_active     BOOLEAN DEFAULT true,
  importance_score INTEGER DEFAULT 50,
  total_articles INTEGER DEFAULT 0,
  total_questions INTEGER DEFAULT 0,
  unresolved_threads TEXT[] DEFAULT '{}',
  central_entity_ids TEXT[] DEFAULT '{}',
  tags          TEXT[] DEFAULT '{}',
  metadata      JSONB DEFAULT '{}',
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE story_links (
  id            BIGSERIAL PRIMARY KEY,
  source_article_id VARCHAR(64) REFERENCES articles(id),
  target_article_id VARCHAR(64) REFERENCES articles(id),
  relationship_type VARCHAR(30) NOT NULL,
  confidence    NUMERIC(4,3) NOT NULL,
  shared_entity_ids TEXT[] DEFAULT '{}',
  shared_topics TEXT[] DEFAULT '{}',
  temporal_distance_days INTEGER,
  causal_explanation TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX ON story_links (source_article_id);
CREATE INDEX ON story_links (target_article_id);

CREATE TABLE predictions (
  id            VARCHAR(64) PRIMARY KEY,
  story_chain_id VARCHAR(64) REFERENCES story_chains(id),
  text          TEXT NOT NULL,
  prediction_type VARCHAR(30) NOT NULL,
  confidence    INTEGER CHECK (confidence BETWEEN 0 AND 100),
  timeframe     VARCHAR(50),
  target_date   TIMESTAMPTZ,
  entity_ids    TEXT[] DEFAULT '{}',
  signals       JSONB DEFAULT '[]',
  basis         TEXT,
  historical_patterns TEXT[],
  status        VARCHAR(20) DEFAULT 'active',
  resolved_at   TIMESTAMPTZ,
  outcome       VARCHAR(30),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- pgvector for semantic search
CREATE EXTENSION IF NOT EXISTS vector;
CREATE TABLE embeddings (
  id            VARCHAR(128) PRIMARY KEY,
  entity_type   VARCHAR(30) NOT NULL,  -- 'article', 'question', 'claim', 'entity'
  entity_id     VARCHAR(64) NOT NULL,
  embedding     vector(1536),          -- OpenAI text-embedding-3-large
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX ON embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 200);
```

---

## Queue Architecture

### Kafka Topic Design

```
┌─────────────────────────────────────────────────────────────┐
│                    KAFKA TOPIC MAP                          │
├─────────────────────────┬──────────────┬────────────────────┤
│ Topic                   │ Partitions   │ Retention          │
├─────────────────────────┼──────────────┼────────────────────┤
│ news.ingested           │ 12           │ 7 days             │
│ news.entity-extracted   │ 12           │ 3 days             │
│ news.story-linked       │ 6            │ 3 days             │
│ news.questions-generated│ 6            │ 3 days             │
│ news.claims-extracted   │ 12           │ 3 days             │
│ news.verification-queue │ 6            │ 7 days             │
│ news.research-requested │ 3            │ 7 days             │
│ news.graph-update       │ 12           │ 1 day              │
│ news.narrative-update   │ 3            │ 3 days             │
│ news.prediction-trigger │ 3            │ 7 days             │
│ alerts.high-importance  │ 6            │ 30 days            │
│ dlq.failed-jobs         │ 6            │ 30 days            │
└─────────────────────────┴──────────────┴────────────────────┘
```

### Job Priority Queue (BullMQ / Redis)

```typescript
// For time-sensitive vs background processing
const queues = {
  // HIGH PRIORITY — user-facing latency sensitive
  realtime: new Queue('realtime', { redis, defaultJobOptions: { priority: 1 } }),

  // STANDARD — pipeline processing
  ingestion: new Queue('ingestion', { redis }),
  extraction: new Queue('extraction', { redis }),
  linking: new Queue('linking', { redis }),

  // LOW PRIORITY — background enrichment
  verification: new Queue('verification', { redis, defaultJobOptions: { priority: 10 } }),
  research: new Queue('research', { redis, defaultJobOptions: { priority: 20 } }),
  prediction: new Queue('prediction', { redis, defaultJobOptions: { priority: 30 } }),

  // BATCH — graph maintenance
  graphMaintenance: new Queue('graph-maintenance', { redis, defaultJobOptions: { priority: 50 } }),
};

// Concurrency settings per worker
const workerConfigs = {
  ingestion: { concurrency: 20 },    // Fast, mostly I/O
  extraction: { concurrency: 10 },   // LLM calls, rate-limited
  linking: { concurrency: 5 },       // Heavy vector search
  verification: { concurrency: 8 },  // Multiple web fetches per claim
  research: { concurrency: 2 },      // Expensive multi-step agent
  prediction: { concurrency: 2 },    // Batch, can be slow
};
```

### Dead Letter Queue + Retry Strategy

```typescript
const retryOptions = {
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 2000,   // 2s, 4s, 8s
  },
  removeOnComplete: { age: 3600 },
  removeOnFail: false,  // Keep for DLQ inspection
};

// Failed jobs → alerting → manual review dashboard
jobQueue.on('failed', async (job, error) => {
  await dlqQueue.add('failed-job', { job: job.data, error: error.message, stage: job.name });
  if (job.attemptsMade >= 3) {
    await alerting.notify({ severity: 'warning', message: `Job permanently failed: ${job.name}` });
  }
});
```

---

## Agent Orchestration Design

### Multi-Agent Architecture

```
                    ┌──────────────────────┐
                    │   Orchestrator Agent  │
                    │  (Pipeline Manager)   │
                    └────────┬─────────────┘
                             │ spawns & coordinates
         ┌───────────────────┼───────────────────┐
         ▼                   ▼                   ▼
  ┌─────────────┐   ┌─────────────┐   ┌──────────────┐
  │  Extraction │   │   Linking   │   │  Verification│
  │    Agent    │   │    Agent    │   │    Agent     │
  └─────────────┘   └─────────────┘   └──────────────┘
         │                   │                   │
         └───────────────────┼───────────────────┘
                             │ feeds results to
                    ┌────────▼─────────────┐
                    │   Research Agent      │
                    │  (deep investigation) │
                    └────────┬─────────────┘
                             │
                    ┌────────▼─────────────┐
                    │  Narrative Agent      │
                    │  (story construction) │
                    └────────┬─────────────┘
                             │
                    ┌────────▼─────────────┐
                    │  Prediction Agent     │
                    │  (forward signals)    │
                    └──────────────────────┘
```

### Agent Communication Protocol

```typescript
interface AgentMessage {
  id: string;
  fromAgent: string;
  toAgent: string;
  type: 'task' | 'result' | 'error' | 'query' | 'status';
  payload: unknown;
  correlationId: string;  // Ties request/response
  timestamp: Date;
  priority: number;
}

// Each agent exposes a standard interface
interface IAgent {
  name: string;
  capabilities: string[];
  process(input: AgentMessage): Promise<AgentMessage>;
  status(): AgentStatus;
  abort(correlationId: string): Promise<void>;
}
```

---

## LLM Prompt Strategies

### Strategy 1: Chain-of-Thought for Causal Linking

```
For complex relationship classification, use CoT before final answer:

"Before classifying the relationship between these two articles,
reason step by step:
1. What is the core claim of Article A?
2. What is the core claim of Article B?
3. What entities appear in both?
4. What is the temporal order?
5. Could A have caused, predicted, or created the conditions for B?
6. Now classify the relationship."
```

### Strategy 2: Few-Shot Examples for Question Generation

```
Include 3 high-quality examples in the prompt:

Example 1:
Article: "Fed raises interest rates by 50bps"
Answered: "Why did the Fed raise rates?" → "To combat 8.3% inflation"
Open: "How will mortgage holders respond to rate increases?"
Historical: "When did the Fed last raise rates this aggressively?"
Future: "Will another raise occur at the December 2024 meeting?"

Example 2:
Article: "Apple acquires AI startup for $1.2B"
...

Now generate for: {{currentArticle}}
```

### Strategy 3: Structured Output with JSON Schema Enforcement

```typescript
// Always use responseFormat/tools to guarantee valid JSON
const result = await anthropic.messages.create({
  model: 'claude-opus-4-8',
  max_tokens: 2000,
  tools: [{
    name: 'generate_questions',
    description: 'Generate investigative questions from a news article',
    input_schema: QuestionGenerationSchema,  // Strict JSON schema
  }],
  tool_choice: { type: 'tool', name: 'generate_questions' },
  messages: [{ role: 'user', content: prompt }],
});
```

### Strategy 4: Confidence Calibration via Self-Critique

```
After generating a classification, ask the model to self-critique:

"You classified this relationship as 'caused_by' with 85% confidence.
Now argue the strongest case AGAINST this classification.
After considering this counterargument, revise your confidence score."
```

### Strategy 5: Verification-Focused Skeptical Prompting

```
SYSTEM: You are a fact-checker, not a summarizer.
Your default assumption is that every claim requires evidence.
When a claim cannot be verified, say so explicitly.
Never extrapolate beyond what the evidence supports.
Rate confidence conservatively — if you're uncertain, err toward lower scores.
```

---

## Verification Methodology

### Source Tier System

```
TIER 1 — PRIMARY SOURCES (weight: 1.0)
  SEC/EDGAR filings, court documents, government publications,
  official company press releases, academic peer-reviewed papers,
  central bank communications, regulatory agency releases

TIER 2 — TIER-A JOURNALISM (weight: 0.85)
  Reuters, AP, Bloomberg, WSJ, NYT, Financial Times, BBC, The Economist
  (must have byline, editorial standards, correction policy)

TIER 3 — TIER-B JOURNALISM (weight: 0.65)
  Major national outlets, regional papers of record, established
  industry publications (TechCrunch, Wired, The Verge)

TIER 4 — AGGREGATED/OPINION (weight: 0.35)
  News aggregators, opinion sites, niche blogs, substacks

TIER 5 — SOCIAL/UNVERIFIED (weight: 0.15)
  Twitter/X, Reddit, unverified sources — corroboration only
```

### Claim Confidence Formula

```
confidence = clamp(
  primarySourceWeight(P) +
  corroborationScore(C) +
  credibilityBonus(A) -
  hedgingPenalty(H) -
  contradictionPenalty(X) -
  agePenalty(D),
  0, 100
)

Where:
P = 40 if Tier 1 primary source found, 20 if Tier 2, 0 otherwise
C = min(sum(tier_weight_i × 10 for each corroborating source), 30)
A = (avgSourceCredibility - 50) × 0.4
H = 15 if hedging words detected ("allegedly", "reportedly", "may")
X = 20 × contradictionStrength (0-1) × max_contradicting_source_weight
D = max(0, (daysSincePublication - 365) × 0.05)
```

---

## Ranking Algorithms

### Article Importance Score

```typescript
function calculateImportanceScore(article: NormalizedArticle): number {
  const weights = {
    sourceCredibility: 0.20,
    entityImportance: 0.20,
    storyLinkCount: 0.15,
    questionCount: 0.15,
    claimCount: 0.10,
    socialSignals: 0.10,
    recency: 0.10,
  };

  const scores = {
    sourceCredibility: article.source.credibilityScore,
    entityImportance: avgImportance(article.entities),
    storyLinkCount: Math.min(article.storyLinks.length * 10, 100),
    questionCount: Math.min(article.openQuestions.length * 8, 100),
    claimCount: Math.min(article.claims.length * 5, 100),
    socialSignals: normalizeShares(article.socialData),
    recency: recencyScore(article.publishedAt),
  };

  return Object.entries(weights).reduce(
    (total, [key, weight]) => total + scores[key] * weight,
    0
  );
}

function recencyScore(publishedAt: Date): number {
  const hoursAgo = (Date.now() - publishedAt.getTime()) / 3600000;
  // Exponential decay: full score at 0h, half at 24h, quarter at 48h
  return 100 * Math.exp(-0.029 * hoursAgo);
}
```

### Story Chain Importance

```typescript
function calculateChainImportance(chain: StoryChain): number {
  return (
    0.30 * maxEntityImportance(chain.entities) +
    0.20 * Math.min(chain.totalArticles * 2, 100) +
    0.20 * chain.averageArticleImportance +
    0.15 * chain.unresolvedQuestions.length * 5 +
    0.15 * recencyBonus(chain.lastUpdated)
  );
}
```

---

## Source Credibility Scoring

### Credibility Dimensions

```typescript
interface SourceCredibilityProfile {
  domain: string;

  // Factual accuracy (0-100)
  factualAccuracy: number;        // Based on MBFC, NewsGuard, AllSides data
  correctionRate: number;         // How often they issue corrections
  retractionRate: number;         // How often stories are retracted

  // Editorial standards (0-100)
  bylinePolicy: number;           // Always/sometimes/never has bylines
  editorialTransparency: number;  // Publishes editorial guidelines?
  ownershipTransparency: number;  // Clear ownership disclosure?

  // Bias indicators (0-100 where 50 = center)
  politicalBias: number;          // Left-leaning → 0, Right-leaning → 100
  commercialBias: number;         // How much do advertisers influence content?

  // Reliability signals (0-100)
  primarySourceUsage: number;     // % of claims with primary source links
  expertSourceUsage: number;      // % citing domain experts
  hedgingAccuracy: number;        // Are hedges warranted?

  // Computed composite
  overallCredibility: number;     // Weighted composite
}

function computeOverallCredibility(profile: SourceCredibilityProfile): number {
  return (
    0.35 * profile.factualAccuracy +
    0.25 * profile.editorialTransparency +
    0.20 * profile.primarySourceUsage +
    0.10 * (100 - profile.commercialBias) +
    0.10 * profile.correctionRate
  );
}
```

---

## Event Linking Algorithms

### Temporal Weighting

```
Events within the same story are weighted by temporal proximity:

weight(A, B) = exp(-λ × |t_A - t_B| / τ)

Where:
λ = 0.693 (natural log of 2 — 50% decay at half-life)
τ = story-specific half-life (default 30 days for fast-moving stories,
    365 days for slow-burn geopolitical stories)

This ensures recent developments in a story get higher weight than
events from 18 months ago, while still preserving the historical chain.
```

### Entity Co-occurrence Strength

```
entityLinkStrength(E1, E2) = PMI_smoothed(E1, E2)

PMI = log( P(E1 ∩ E2) / (P(E1) × P(E2)) )

Where counts are taken over a rolling 90-day window.
High PMI = entities frequently appear together → likely related.
```

---

## Question Generation Algorithms

### Question Priority Scoring

```typescript
function scoreQuestion(question: GeneratedQuestion): number {
  let score = 0;

  // Type weights
  const typeWeights = { future: 35, open: 30, historical: 20, answered: 15 };
  score += typeWeights[question.type];

  // Entity importance boost
  const entityAvgImportance = avgImportance(question.relatedEntities);
  score += entityAvgImportance * 0.3;

  // Raised-by-multiple-articles boost (same question appearing = importance signal)
  score += Math.min(question.raisedCount * 8, 25);

  // Verification required boost
  if (question.verificationRequired) score += 10;

  return Math.min(score, 100);
}
```

### Question Deduplication via Semantic Clustering

```
1. Embed all questions using text-embedding-3-large
2. Apply HDBSCAN clustering with min_cluster_size=2, epsilon=0.12
3. For each cluster:
   a. Select the highest-importance question as the canonical question
   b. Link all other questions as "variants" pointing to canonical
   c. Merge raisedCount across all variants
4. Update importance scores based on merged raisedCount
```

---

## Timeline Construction Algorithms

### Event Sequencing

```typescript
interface TimelineConstructor {
  buildTimeline(storyChainId: string): TimelineEvent[] {
    // 1. Fetch all events linked to story chain from Neo4j
    const events = await neo4j.query(`
      MATCH (e:Event)-[:PART_OF]->(sc:StoryChain {id: $id})
      RETURN e ORDER BY e.date ASC
    `, { id: storyChainId });

    // 2. Insert causal connectors between events
    const annotatedEvents = events.map((event, i) => ({
      ...event,
      causedBy: events.slice(0, i).filter(e =>
        graphHasRelationship(e.id, event.id, 'LED_TO')
      ),
      questions: getQuestionsRaisedBy(event.id),
      answers: getQuestionsAnsweredBy(event.id),
    }));

    // 3. Detect narrative gaps (events inferred but not yet reported)
    const gaps = detectNarrativeGaps(annotatedEvents);

    // 4. Return fully annotated timeline
    return buildAnnotatedTimeline(annotatedEvents, gaps);
  }
}
```

### Narrative Gap Detection

```
A narrative gap exists when:
- Event A raised question Q
- No article has answered Q
- But Event B implies Q was answered (it depends on Q being true)

Flag this gap as: "Missing intermediate event between A and B"
This drives the Research Agent to investigate what happened between them.
```

---

## Tech Stack

### Core Framework

| Layer              | Technology                        | Reason                                          |
|--------------------|-----------------------------------|-------------------------------------------------|
| Frontend           | Next.js 15 (App Router)           | RSC, streaming, file-system routing             |
| API Layer          | tRPC + Next.js Route Handlers     | End-to-end type safety                          |
| Language           | TypeScript 5.5                    | Type safety across monorepo                     |
| Monorepo           | Turborepo                         | Shared packages, caching                        |
| Auth               | Clerk or NextAuth.js v5           | Enterprise SSO + social auth                    |

### Data Layer

| Component          | Technology                        | Reason                                          |
|--------------------|-----------------------------------|-------------------------------------------------|
| Primary DB         | PostgreSQL 16 + pgvector           | ACID, vector similarity, JSON support           |
| Graph DB           | Neo4j 5 (Aura)                    | Native graph traversal for knowledge graph      |
| Vector Store       | pgvector (primary) + Pinecone     | pgvector for < 10M vectors, Pinecone beyond     |
| Cache              | Redis 7 (Upstash)                  | Session, rate limiting, job queues              |
| Full-text search   | Elasticsearch 8 / OpenSearch      | BM25 article search, entity autocomplete        |
| ORM                | Drizzle ORM                        | Type-safe, lightweight, migrations              |
| Time-series        | TimescaleDB (Postgres extension)   | Trending metrics, volume analytics              |

### Processing

| Component          | Technology                        | Reason                                          |
|--------------------|-----------------------------------|-------------------------------------------------|
| Message Queue      | Apache Kafka (Confluent Cloud)    | High-throughput, durable, ordered processing    |
| Job Queue          | BullMQ + Redis                    | Priority queues, retries, rate limiting         |
| Background Jobs    | Inngest                           | Serverless workflows, fan-out                   |
| Scheduler          | Inngest Cron / Trigger.dev        | RSS polling, prediction monitoring              |
| Entity NER         | spaCy 3 + HuggingFace            | Fast local NER before LLM enrichment           |

### AI / LLM

| Component          | Technology                        | Reason                                          |
|--------------------|-----------------------------------|-------------------------------------------------|
| Primary LLM        | Anthropic Claude claude-opus-4-8        | Complex reasoning, long context                 |
| Fast LLM           | Claude claude-haiku-4-5-20251001              | High-volume extraction, classification          |
| Embeddings         | OpenAI text-embedding-3-large     | 1536-dim, best semantic similarity              |
| NLI Model          | cross-encoder/nli-deberta-v3      | Contradiction detection (fast, local)           |
| Agent Framework    | LangChain.js / custom ReAct       | Tool-use orchestration                          |

### Infrastructure

| Component          | Technology                        | Reason                                          |
|--------------------|-----------------------------------|-------------------------------------------------|
| Deployment         | Vercel (frontend) + Railway/Fly.io (workers) | Optimized Next.js + long-running jobs |
| Container          | Docker + docker-compose           | Local dev parity                                |
| Secrets            | Doppler / Vercel Env Vars         | Centralized secret management                   |
| Monitoring         | Datadog + Sentry                  | APM + error tracking                            |
| Logging            | Pino + Axiom                      | Structured logs, searchable                     |
| CI/CD              | GitHub Actions                    | Lint, test, deploy pipeline                     |

---

## Scalability Strategy

### Throughput Targets

| Stage              | Volume Target        | Latency Target      |
|--------------------|----------------------|---------------------|
| Ingestion          | 50,000 articles/day  | < 30s from publish  |
| Entity Extraction  | 50,000/day           | < 2min per article  |
| Story Linking      | 50,000/day           | < 5min per article  |
| Verification       | 200,000 claims/day   | < 10min per claim   |
| Research Dossier   | 500/day (top stories)| < 20min per dossier |
| Graph Update       | Real-time            | < 30s lag           |

### Horizontal Scaling Points

```
1. INGESTION WORKERS — Stateless, scale by adding workers
   - Each worker claims from Kafka partition
   - No shared state → linear scaling

2. LLM API RATE LIMITS — The primary bottleneck
   - Use multiple API keys with fair rotation
   - Batch requests where possible (embeddings)
   - Cache LLM outputs for identical inputs
   - Use faster/cheaper models for bulk ops (Haiku)
   - Implement exponential backoff + jitter

3. VECTOR SEARCH — Scales with pgvector IVFFlat index
   - Up to ~5M vectors: pgvector on read replica
   - 5M–50M: Pinecone or Weaviate
   - > 50M: Qdrant distributed or Pinecone enterprise

4. NEO4J GRAPH — Scale via sharding by story domain
   - Partition: [US Politics] [Tech] [Finance] [International]
   - Cross-partition queries remain possible via federation

5. POSTGRES — Read replicas for analytics queries
   - Primary: writes only
   - Read replicas ×3: article fetches, entity lookups
   - Analytical queries: Postgres + TimescaleDB + connection pooling (PgBouncer)
```

### Caching Strategy

```
L1 — In-process cache (LRU, 1000 items per worker)
  Entity lookups, source credibility scores

L2 — Redis (5-minute TTL)
  Recent article lookups, entity importance scores,
  story chain summaries

L3 — CDN (Cloudflare) (15-minute TTL)
  Story chain pages, narrative summaries (public content)

L4 — Database (persistent)
  All canonical data
```

---

## Implementation Roadmap

### Phase 1 — Foundation (Weeks 1–4)
- [ ] PostgreSQL schema + migrations (Drizzle)
- [ ] RSS/NewsAPI ingestion with deduplication
- [ ] Basic entity extraction (spaCy NER only)
- [ ] pgvector embeddings for articles
- [ ] BullMQ job queue setup
- [ ] Basic Next.js frontend: article list + detail view

### Phase 2 — Intelligence (Weeks 5–8)
- [ ] LLM entity enrichment + Wikidata reconciliation
- [ ] Semantic story linking engine
- [ ] Question generation engine
- [ ] Story chain creation and assignment
- [ ] Frontend: story chain view, question display

### Phase 3 — Verification (Weeks 9–12)
- [ ] Claim extraction pipeline
- [ ] Automated verification workflow
- [ ] Source credibility database
- [ ] Contradiction detection (NLI model)
- [ ] Frontend: verification badges, evidence display

### Phase 4 — Graph + Narrative (Weeks 13–16)
- [ ] Neo4j integration + graph population
- [ ] Living narrative generation
- [ ] Research agent (basic web search + EDGAR)
- [ ] Timeline construction
- [ ] Frontend: knowledge graph visualization (D3.js or Cytoscape.js)

### Phase 5 — Prediction + Scale (Weeks 17–20)
- [ ] Prediction engine with historical pattern matching
- [ ] Watch-list monitoring automation
- [ ] Kafka migration for high-volume ingestion
- [ ] Read replicas + connection pooling
- [ ] Advanced research agent (multi-tool ReAct)
- [ ] Frontend: prediction dashboard, watch-list alerts

---

*Architecture document for TakeToday v1.0 — Living Research Intelligence Platform*
*Last generated: June 2026*