# TakeToday — Research + Verification Pipeline: Gap Analysis

**Date:** 2026-06-16  
**Analyst:** Senior Staff Engineer  
**Source of truth:** `PIPELINE_ARCHITECTURE.md`  
**Codebase root:** `taketoday-app/` (Next.js 15) + `python-service/` (FastAPI)

---

## 1. Current State

### What Exists

#### Core Platform

| Layer | Technology | Status |
|---|---|---|
| Frontend | Next.js 15 + React 19 + App Router | ✅ Fully implemented |
| Auth | NextAuth 5 + Google OAuth + RBAC | ✅ Fully implemented |
| CMS | Admin UI + article CRUD API | ✅ Fully implemented |
| Database | PostgreSQL + Prisma v6 | ✅ Fully implemented |
| Media | Cloudinary + MediaAsset table | ✅ Fully implemented |
| Email | Resend + Buttondown newsletter | ✅ Fully implemented |
| Rate limiting | Upstash Redis | ✅ Fully implemented |
| Error tracking | Sentry | ✅ Fully implemented |
| Social posting | Python FastAPI + Tweepy + platform APIs | ✅ Fully implemented |
| Scheduling | APScheduler (60s) + Vercel cron | ✅ Fully implemented |

#### AI Pipelines

| Pipeline | Model | Status |
|---|---|---|
| Article generation | GPT-4o-mini | ✅ `lib/ai/generate.ts` |
| Fact-checking (article-level) | GPT-4o-mini | ✅ `lib/ai/verify-article.ts` |
| Social content generation | Gemini-2.0-flash → GPT-4o-mini fallback | ✅ `lib/ai/studio-generate.ts` |

#### Database Schema (Current — 12 Models)

```
AdminUser       → editorial team users
Article         → manually-created CMS articles (slug, body, status workflow)
ArticleVerification → AI fact-check scores + editorial review (JSON blob claims)
ArticleSource   → editor-added citation links per article
Category        → article categories
Tag             → article tags (M2M via ArticleTag)
MediaAsset      → Cloudinary images
MediaFolder     → image folder hierarchy
AuditLog        → admin action trail
ContentDraft    → social media carousel/reel drafts
ScheduledPost   → social platform post queue
```

#### Current Search

Client-side text scoring in `lib/content/search.ts`:
- Weights: title (10) > deck (6) > quickTake (4) > category (3) > body (2)
- No server-side full-text search
- No vector/semantic search

---

## 2. Missing Components

Everything below is required by the architecture document but does not exist.

### 2.1 Database Tables (All Missing)

| Required Table | Purpose | Architecture Reference |
|---|---|---|
| `entities` | Canonical entities (persons, orgs, places, products) | Stage 2 |
| `entity_mentions` | Entity→Article join with offsets + confidence | Stage 2 |
| `events` | Discrete events extracted from articles | Stage 7 |
| `sources` | Publisher credibility profiles (Reuters, BBC, etc.) | Stage 5 + Verification Methodology |
| `story_chains` | Living narrative containers | Stage 8 |
| `story_links` | Article→Article causal relationships with type+confidence | Stage 3 |
| `questions` | Generated investigative questions with status lifecycle | Stage 4 |
| `claims` | Structured claim objects (subject/predicate/object) | Stage 5 |
| `predictions` | Forward-looking predictions with outcome tracking | Stage 9 |
| `research_dossiers` | Aggregated investigation outputs per story chain | Stage 6 |
| `embeddings` | pgvector store for article/question/entity embeddings | Stage 3 |

**Critical schema conflict:** Architecture defines a `sources` table for news publishers (Reuters, BBC — with credibility scores, bias ratings). Current `ArticleSource` is editor-added citation links. These are different concepts occupying a similar namespace. Both must coexist.

**Critical model divergence:** Architecture `articles` table has `canonical_url`, `content_hash`, `importance_score`, `story_chain_id`, `source_id` (FK to publishers). Current `Article` model has `slug`, `body`, `status` enum (editorial workflow), no publisher FK. The two article concepts serve different purposes:
- **Current:** CMS article authored by editors
- **Architecture:** Ingested article from external sources

This is the most significant structural tension in the implementation.

### 2.2 Vector Infrastructure (Missing)

- `pgvector` extension not enabled
- No embeddings generated or stored
- No semantic similarity search
- Required for: story linking, question deduplication, claim verification

### 2.3 Queue System (Missing)

Architecture specifies Kafka (12 topics). Current system uses APScheduler polling + Vercel cron. No event-driven pipeline exists.

Required topics (adapted to BullMQ — see §4):
- `article.ingested`
- `entity.extracted`
- `story.linked`
- `question.generated`
- `claim.extracted`
- `verification.requested`
- `graph.updated`
- `narrative.updated`
- `prediction.triggered`

### 2.4 Processing Pipeline Stages (All Missing)

| Stage | Description | Dependencies |
|---|---|---|
| Entity Extraction | NER, coreference, Wikidata linking | entities table, LLM, queue |
| Story Linking Engine | Semantic + entity + temporal scoring + LLM classification | embeddings, story_links, queue |
| Question Generation Engine | 4-category question generation per article | questions table, embeddings, queue |
| Claim Verification Pipeline | Structured claim extraction + multi-source verification | claims table, web search API |
| Research Agent | ReAct loop with web search + EDGAR + Wikidata tools | research_dossiers, tool APIs |
| Narrative Construction | Living narrative updates, chapter detection, turning points | story_chains, LLM |
| Prediction Engine | Pattern-based forward predictions with watch signals | predictions table, story_chains |
| Graph Sync Workers | Sync PostgreSQL state to Neo4j | Neo4j (or PostgreSQL substitute) |

### 2.5 Knowledge Graph (Missing)

Architecture specifies Neo4j. No graph database exists. No graph schema, no sync workers, no Cypher queries.

### 2.6 Ingestion Pipeline (Missing)

Architecture specifies 8 external sources (RSS, NewsAPI, GDELT, Twitter/X, Playwright scrapers, arXiv, government docs, Reddit). All articles currently created manually by editors.

This is an optional dependency for the intelligence layer — the pipeline can run on manually-created articles first.

### 2.7 Frontend Pages (Missing)

| Required Page | Description |
|---|---|
| Story Chain view | Narrative timeline, linked articles, unresolved questions, verified claims |
| Question Explorer | Open/answered/historical/future question browser |
| Verification View | Claims, evidence chains, contradictions, confidence scores |
| Research Dossier view | Timeline, findings, predictions, sources |
| Entity Profile | Entity mentions, relationships, story chain memberships |

### 2.8 API Routes (Missing)

All intelligence-layer APIs are missing:
- `GET/POST /api/story-chains`
- `GET /api/story-chains/[id]` (with questions, claims, predictions)
- `GET /api/questions?type=&status=`
- `GET /api/claims?articleId=&status=`
- `GET /api/entities/[id]`
- `GET /api/predictions?storyChainId=`
- `GET /api/dossiers/[storyChainId]`

---

## 3. Reusable Components

### 3.1 Directly Reusable (No Changes)

| Component | File | Reuse Path |
|---|---|---|
| Prisma client singleton | `lib/db/prisma.ts` | All new repos use same pattern |
| OpenAI client | `lib/ai/generate.ts` | New agents extend same client |
| Auth + RBAC | `lib/admin/authz.ts`, `lib/admin/rbac.ts` | New permissions added to existing map |
| Rate limiting | `lib/rate-limit.ts` | New AI pipeline endpoints inherit same guard |
| Zod env validation | `lib/config/env.ts` | New env vars added to existing schema |
| Upstash Redis | `lib/rate-limit.ts` | Same connection used for BullMQ queues |
| Response helpers | `lib/admin/api.ts` | All new API routes use same pattern |
| Sentry | `next.config.ts` | No changes needed |
| Python FastAPI service | `python-service/` | Extend with NLP/NER endpoints |

### 3.2 Extend (Minor Changes)

| Component | File | Extension |
|---|---|---|
| `verify-article.ts` | `lib/ai/verify-article.ts` | Replace JSON blob claims with structured Claim objects; add claim-level verification |
| `studio-generate.ts` | `lib/ai/studio-generate.ts` | Extract `generateJSON()` pattern into shared `lib/ai/llm.ts` used by all new agents |
| Article creation flow | `app/api/admin/articles/route.ts` | Emit `article.ingested` queue event after DB write — zero behavior change for editor |
| Admin RBAC | `lib/admin/rbac.ts` | Add permissions: `intelligence:read`, `intelligence:write` |
| Prisma schema | `prisma/schema.prisma` | Add 10+ new models via migrations |

### 3.3 Reuse Pattern (Architecture Reference)

The `studio-generate.ts` Gemini→OpenAI fallback pattern should be extracted as a shared `callLLM(prompt, schema)` utility used by all pipeline agents. Every agent currently reinvents provider selection.

---

## 4. Technical Risks

### Risk 1: Article Model Bifurcation (HIGH)

**Problem:** Two different `Article` concepts must coexist:
1. **CMS Article** — manually authored by editors, has editorial workflow status, publishedAt lifecycle
2. **Ingested Article** — external source, has canonical_url, source credibility, importance score

**Options:**
- **A) Extend current Article model** — add optional intelligence fields (`importanceScore`, `storyChainId`, `embeddingId`, `contentHash`) as nullable columns. CMS articles use editorial fields; future ingested articles use intelligence fields. Same table, same Prisma model. **Recommended for Phase 1.**
- **B) Separate tables** — `cms_articles` (current) + `ingested_articles` (new). Clean separation but requires all intelligence queries to union or pick a table.
- **C) New unified model** — migrate everything. Maximally disruptive, breaks existing admin UI.

**Decision:** Option A. Add nullable intelligence columns to existing `Article` table. No migration of existing data required.

### Risk 2: Kafka is Overkill (HIGH)

**Problem:** Architecture specifies Kafka with 12 topics, partitions, and retention policies. This requires Kafka infrastructure (Confluent Cloud or self-hosted), separate consumer processes, offset management.

**Reality:** Current scale (manual article creation, no live ingestion) does not warrant Kafka.

**Recommendation:** Use **BullMQ** (Redis-based job queues) on the existing Upstash Redis instance. Same event-driven pattern, zero new infrastructure. Kafka-migrate later if ingestion volume demands it.

**Caveat:** Upstash Redis free tier has 10k commands/day. At scale, upgrade to paid tier or switch to self-hosted Redis.

### Risk 3: Neo4j is New Infrastructure (MEDIUM)

**Problem:** Architecture requires Neo4j for knowledge graph traversal. No Neo4j instance exists. Adding Neo4j means new Docker service, new credentials, new sync workers, new query language (Cypher).

**Recommendation:** Defer Neo4j to Phase 5+. Implement knowledge graph queries in PostgreSQL first using:
- Recursive CTEs for chain traversal
- Array columns for entity relationships
- JSON aggregations for graph-shaped responses

Migrate to Neo4j when graph queries exceed PostgreSQL capability.

### Risk 4: Entity Extraction Quality (MEDIUM)

**Problem:** Architecture calls for spaCy NER → LLM enrichment → Wikidata reconciliation. spaCy requires Python. Python service exists but is sized for social media posting (lightweight). Adding spaCy models (300MB+) changes resource requirements.

**Recommendation:** Skip spaCy for Phase 1-2. Use GPT-4o-mini directly for entity extraction (structured output with tool_use). Add spaCy to Python service in Phase 3+ when cost-optimization matters.

### Risk 5: pgvector Index Performance (LOW-MEDIUM)

**Problem:** Architecture specifies `ivfflat` index with `lists = 200`. This is appropriate for millions of vectors but requires `VACUUM ANALYZE` after bulk inserts and may not perform well on small datasets (< 10k vectors).

**Recommendation:** Use `ivfflat` from the start (correct call), but set `lists = 50` initially. Increase as corpus grows. Add `SET ivfflat.probes = 10` at query time for recall tuning.

### Risk 6: OpenAI Cost at Pipeline Scale (MEDIUM)

**Problem:** Each article triggers: entity extraction, question generation, claim extraction, narrative update — potentially 5-8 LLM calls per article. At $0.15/1M input tokens (GPT-4o-mini), manageable at low volume. At 1000 articles/day, costs multiply.

**Recommendation:**
- Use `gpt-4o-mini` for extraction tasks (cheap, fast)
- Use `claude-sonnet-4-6` for relationship classification + narrative construction (higher quality where it matters)
- Cache embeddings — never regenerate for the same content hash
- Batch question deduplication via vector search before calling LLM

### Risk 7: Existing Verification Data Migration (LOW)

**Problem:** `ArticleVerification.aiClaims` stores claims as a JSON blob (`{text, status, notes}[]`). New `claims` table requires structured objects with `subject`, `predicate`, `object`, `claimType`, `confidence`. Backfilling 0→N existing records is possible but requires LLM re-processing.

**Recommendation:** No backfill for Phase 1. New articles get structured claims. Old articles keep JSON blob. Add migration script in Phase 5 when claim verification pipeline is complete.

---

## 5. Implementation Order

### Phase 1 — Database Foundation (Week 1-2)

**Goal:** All tables exist. Zero behavior changes to existing features.

1. Enable pgvector extension in PostgreSQL
2. Prisma migrations for: `sources` (publishers), `entities`, `entity_mentions`, `story_chains`, `story_links`, `questions`, `claims`, `predictions`, `research_dossiers`, `embeddings`
3. Extend `Article` model with nullable intelligence columns: `importanceScore`, `storyChainId`, `embeddingId`, `contentHash`, `sourceId` (publisher FK)
4. Create repository classes for each new model
5. Write TypeScript types for all new schemas
6. Write tests for repository layer

**Output:** Schema ready. No new behavior yet.

---

### Phase 2 — Vector Infrastructure (Week 2-3)

**Goal:** Embeddings generated for articles. Semantic search works.

1. `lib/ai/embeddings.ts` — wrapper for `text-embedding-3-small` (1536-dim)
2. `lib/ai/llm.ts` — shared `callLLM(prompt, schema)` replacing per-file client instantiation
3. Embedding generation on article save (background, non-blocking)
4. `lib/search/semantic.ts` — cosine similarity queries via pgvector
5. Admin API: `GET /api/admin/articles/[id]/similar` — semantic similarity endpoint
6. Tests for embedding generation + retrieval

**Output:** Every new article gets an embedding. Semantic search works.

---

### Phase 3 — Queue Infrastructure (Week 3)

**Goal:** Event-driven pipeline backbone.

1. Install BullMQ + `@types/bullmq`
2. `lib/queue/` — queue definitions, worker registry, job types
3. Events: `article.ingested`, `entity.extracted`, `story.linked`, `question.generated`, `claim.extracted`, `verification.requested`, `narrative.updated`
4. Emit `article.ingested` from article creation endpoint (non-blocking)
5. DLQ + retry config (3 attempts, exponential backoff)
6. Admin health endpoint showing queue depths

**Output:** Events flow through BullMQ on article creation. Workers not yet consuming.

---

### Phase 4 — Entity Extraction Engine (Week 4-5)

**Goal:** Every article has extracted entities stored in DB.

1. `services/entity-extraction/` — GPT-4o-mini with structured output (tool_use)
2. Entity types: PERSON, ORGANIZATION, COMPANY, COUNTRY, CITY, PRODUCT, TECHNOLOGY, EVENT, LEGISLATION, CONCEPT
3. Wikidata lookup for canonical ID (best-effort, no hard dependency)
4. Entity deduplication: match by canonicalName + type before inserting
5. Worker consuming `article.ingested` → emitting `entity.extracted`
6. Admin API: `GET /api/admin/articles/[id]/entities`

**Output:** Entity extraction runs automatically after each article save.

---

### Phase 5 — Story Linking Engine (Week 5-6)

**Goal:** Articles linked causally to related articles.

1. `services/story-linking/` — retrieval + scoring + LLM relationship classification
2. Candidate retrieval: vector similarity (top-50) + entity overlap (min 2 shared) + category match
3. Composite scoring: 0.35 semantic + 0.25 entity + 0.20 temporal + 0.20 topic
4. LLM relationship classifier: caused_by / follow_up / contradiction / confirmation / escalation / background / effect_of
5. Store top-15 links (confidence ≥ 0.60) in `story_links`
6. Worker consuming `entity.extracted` → emitting `story.linked`
7. Admin API: `GET /api/admin/articles/[id]/links`

**Output:** Story links generated. Articles connected.

---

### Phase 6 — Question Generation Engine (Week 6-7)

**Goal:** Every article generates investigative questions.

1. `services/question-generation/` — 4-category question generator
2. Categories: answered, open, historical, future (3-5 questions each)
3. Semantic deduplication: check existing questions before inserting (threshold 0.88)
4. Link questions to: article, entities, story chain
5. Worker consuming `story.linked` → emitting `question.generated`
6. Public API: `GET /api/questions?type=open&storyChainId=`

**Output:** Question bank grows with every article.

---

### Phase 7 — Claim Extraction + Verification Pipeline (Week 7-9)

**Goal:** Claims structured and verified against multiple sources.

1. `services/claim-extraction/` — GPT-4o-mini structured claim extraction (subject/predicate/object/type)
2. Claim types: quantitative, causal, attributional, predictive, historical, comparative
3. `services/verification/` — multi-source verification engine
4. Source identification → web search (Serper API) → corroboration → contradiction detection
5. Confidence scoring formula from architecture doc
6. Status: verified / partially_verified / disputed / unverified
7. Extend existing `verify-article.ts` to call structured pipeline
8. Worker consuming `claim.extracted` → emitting `verification.requested`
9. Admin API: `GET /api/admin/articles/[id]/claims`

**Output:** Structured, verified claims per article.

---

### Phase 8 — Story Chain + Narrative Engine (Week 9-10)

**Goal:** Story chains self-organize and narrative updates automatically.

1. `services/narratives/` — story chain assignment + chapter detection + living narrative update
2. Story chain matching: entity overlap + semantic similarity to chain description
3. Match thresholds: > 0.65 → assign; 0.40-0.65 → new chapter; < 0.40 → new chain
4. LLM narrative update (< 800 words, ends with "WHAT TO WATCH" section)
5. Turning point detection
6. Question lifecycle: resolve open questions when new article answers them
7. Worker consuming `question.generated` → updating chain → emitting `narrative.updated`
8. Public API: `GET /api/story-chains`, `GET /api/story-chains/[id]`

**Output:** Living story chains update with each new article.

---

### Phase 9 — Research Agent (Week 10-12)

**Goal:** High-importance stories get deep automated investigation.

1. `services/research-agent/` — ReAct loop agent
2. Tools: web_search (Serper), wikidata_lookup, news_history (internal), financial_data (Polygon.io or Alpha Vantage)
3. Trigger condition: article importanceScore > 70
4. Output: structured ResearchDossier stored in `research_dossiers`
5. Worker consuming `narrative.updated` → triggering research for high-importance chains

**Output:** Research dossiers auto-generated for major stories.

---

### Phase 10 — Prediction Layer (Week 12-13)

**Goal:** Story chains generate forward-looking predictions.

1. `services/predictions/` — pattern extraction + historical analogy + signal detection
2. Prediction types: next_event, emerging_risk, entity_action, regulatory_action, escalation
3. Watch signals: specific entities + keywords to monitor
4. Automated monitoring: daily jobs resolve predictions against incoming articles
5. Outcome tracking: correct / incorrect / partially_correct
6. Public API: `GET /api/predictions?storyChainId=`

**Output:** Predictions generated and tracked over time.

---

### Phase 11 — Knowledge Graph (Week 13-15)

**Goal:** Graph queries over the full entity/event/claim network.

1. PostgreSQL-based graph using recursive CTEs (no Neo4j initially)
2. `lib/graph/` — graph query utilities
3. Key queries: causal chain traversal, entity relationship paths, open questions per entity
4. Public API: `GET /api/graph/entity/[id]`, `GET /api/graph/chain/[id]`
5. Neo4j migration plan: define node/relationship schemas, build sync worker — defer deployment

---

### Phase 12 — Frontend Intelligence Layer (Week 15-18)

**Goal:** Intelligence data surfaced to readers.

1. Story Chain page: `/story/[slug]` — timeline + articles + questions + claims
2. Question Explorer: `/questions` — filterable by type/status/entity
3. Verification view: per-article claim list with evidence + confidence
4. Research Dossier: `/dossier/[storyChainId]` — full investigation output
5. Entity profile: `/entity/[id]` — mentions, relationships, stories

---

## 6. Summary

### What To Build First

```
pgvector extension
  → 10 new Prisma models + migrations
    → Embedding generation on article save
      → BullMQ queue backbone
        → Entity extraction worker
          → Story linking worker
            → Question generation worker
              → Claim extraction + verification
                → Narrative construction
                  → Research agent
                    → Prediction engine
```

### Infrastructure Decisions

| Architecture Spec | Decision | Reason |
|---|---|---|
| Kafka | BullMQ on existing Upstash Redis | No new infra, same semantics, upgrade path clear |
| Neo4j | PostgreSQL recursive CTEs first | Defer until graph traversal exceeds SQL capability |
| spaCy NER | GPT-4o-mini structured output | Python service extension deferred; quality comparable at current scale |
| Elasticsearch (BM25) | PostgreSQL `tsvector` + `tsquery` | Already in stack, sufficient for candidate retrieval |
| External ingestion | Wrap existing manual articles | Build intelligence layer first; add ingestion in parallel |

### Capability Unlocked Per Phase

| After Phase | New Capability |
|---|---|
| 1 (DB) | Schema ready, zero feature change |
| 2 (Vectors) | Semantic article similarity |
| 3 (Queues) | Event-driven pipeline (workers idle but connected) |
| 4 (Entities) | "Who is in this article" knowledge |
| 5 (Linking) | "What else is related to this story" |
| 6 (Questions) | "What should we investigate next" |
| 7 (Claims) | "What does this article claim, and is it verified" |
| 8 (Narratives) | Living story chains with evolving summaries |
| 9 (Research) | Deep automated dossiers per major story |
| 10 (Predictions) | Forward-looking intelligence signals |
| 11 (Graph) | Full causal chain queries across the knowledge base |
| 12 (Frontend) | All intelligence surfaced to readers |

---

*Ready to begin Phase 1 implementation.*
