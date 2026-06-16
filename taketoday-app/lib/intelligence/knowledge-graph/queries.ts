import 'server-only';
import { prisma } from '@/lib/db/prisma';

// ─── Result Types ──────────────────────────────────────────────────────────────

export interface EntityNode {
  id: string;
  canonicalName: string;
  entityType: string;
  importanceScore: number;
  mentionCount: number;
}

export interface EntityEdge {
  fromEntityId: string;
  toEntityId: string;
  sharedArticles: number;
}

export interface ArticleNode {
  id: string;
  headline: string;
  publishedAt: Date | null;
  importanceScore: number;
  storyChainId: string | null;
}

export interface StoryEdge {
  id: string;
  sourceArticleId: string;
  targetArticleId: string;
  relationshipType: string;
  confidence: number;
}

export interface EntityPathStep {
  entityId: string;
  entityName: string;
  viaArticleId: string;
  viaArticleHeadline: string;
}

// ─── Query 1: Entity Co-occurrence Neighborhood ────────────────────────────────
// Returns entities that share articles with the given entity, with edge weights.
export async function queryEntityNeighbors(
  entityId: string,
  limit = 25,
): Promise<{ entity: EntityNode; sharedArticles: number }[]> {
  const rows = await prisma.$queryRawUnsafe<
    {
      id: string;
      canonicalName: string;
      entityType: string;
      importanceScore: number;
      mentionCount: number;
      shared_articles: bigint;
    }[]
  >(
    `
    SELECT
      e.id,
      e."canonicalName",
      e."entityType",
      e."importanceScore",
      e."mentionCount",
      COUNT(DISTINCT em1."articleId") AS shared_articles
    FROM entity_mentions em1
    JOIN entity_mentions em2 ON em1."articleId" = em2."articleId"
    JOIN entities e ON e.id = em2."entityId"
    WHERE em1."entityId" = $1
      AND em2."entityId" != $1
    GROUP BY e.id
    ORDER BY shared_articles DESC, e."importanceScore" DESC
    LIMIT $2
    `,
    entityId,
    limit,
  );

  return rows.map((r) => ({
    entity: {
      id: r.id,
      canonicalName: r.canonicalName,
      entityType: r.entityType,
      importanceScore: r.importanceScore,
      mentionCount: r.mentionCount,
    },
    sharedArticles: Number(r.shared_articles),
  }));
}

// ─── Query 2: Story Chain Article Graph ────────────────────────────────────────
// Returns article nodes in a story chain + story_links between them as edges.
export async function queryStoryChainGraph(storyChainId: string): Promise<{
  articles: ArticleNode[];
  links: StoryEdge[];
}> {
  const articles = await prisma.$queryRawUnsafe<
    {
      id: string;
      headline: string;
      publishedAt: Date | null;
      importanceScore: number;
      storyChainId: string | null;
    }[]
  >(
    `
    SELECT a.id, a.headline, a."publishedAt", a."importanceScore", a."storyChainId"
    FROM "Article" a
    WHERE a."storyChainId" = $1
    ORDER BY a."publishedAt" ASC NULLS LAST
    `,
    storyChainId,
  );

  const articleIds = articles.map((a) => a.id);
  if (articleIds.length === 0) return { articles, links: [] };

  // Links where either side is an article in this chain
  const links = await prisma.$queryRawUnsafe<
    {
      id: string;
      sourceArticleId: string;
      targetArticleId: string;
      relationshipType: string;
      confidence: number;
    }[]
  >(
    `
    SELECT sl.id, sl."sourceArticleId", sl."targetArticleId",
           sl."relationshipType", sl.confidence
    FROM story_links sl
    WHERE sl."sourceArticleId" = ANY($1::text[])
       OR sl."targetArticleId" = ANY($1::text[])
    ORDER BY sl.confidence DESC
    `,
    articleIds,
  );

  return { articles, links };
}

// ─── Query 3: Story Chain Entity Profile ──────────────────────────────────────
// Entities ranked by prominence (focal mentions weighted 3×) across a story chain.
export async function queryStoryChainEntities(
  storyChainId: string,
  limit = 30,
): Promise<{ entity: EntityNode; articleCount: number; prominenceScore: number }[]> {
  const rows = await prisma.$queryRawUnsafe<
    {
      id: string;
      canonicalName: string;
      entityType: string;
      importanceScore: number;
      mentionCount: number;
      article_count: bigint;
      prominence_score: bigint;
    }[]
  >(
    `
    SELECT
      e.id,
      e."canonicalName",
      e."entityType",
      e."importanceScore",
      e."mentionCount",
      COUNT(DISTINCT em."articleId") AS article_count,
      SUM(CASE WHEN em."isFocal" THEN 3 ELSE 1 END) AS prominence_score
    FROM entities e
    JOIN entity_mentions em ON em."entityId" = e.id
    JOIN "Article" a ON a.id = em."articleId"
    WHERE a."storyChainId" = $1
    GROUP BY e.id
    ORDER BY prominence_score DESC, article_count DESC
    LIMIT $2
    `,
    storyChainId,
    limit,
  );

  return rows.map((r) => ({
    entity: {
      id: r.id,
      canonicalName: r.canonicalName,
      entityType: r.entityType,
      importanceScore: r.importanceScore,
      mentionCount: r.mentionCount,
    },
    articleCount: Number(r.article_count),
    prominenceScore: Number(r.prominence_score),
  }));
}

// ─── Query 4: Entity Connection Path (up to 2 hops) ──────────────────────────
// Finds the shortest path connecting two entities via shared articles.
// Returns null if no connection found within 2 hops.
export async function queryEntityPath(
  fromEntityId: string,
  toEntityId: string,
): Promise<EntityPathStep[] | null> {
  // Hop 1: direct co-occurrence in same article
  const directRows = await prisma.$queryRawUnsafe<
    { article_id: string; headline: string }[]
  >(
    `
    SELECT a.id AS article_id, a.headline
    FROM entity_mentions em1
    JOIN entity_mentions em2 ON em1."articleId" = em2."articleId"
    JOIN "Article" a ON a.id = em1."articleId"
    WHERE em1."entityId" = $1
      AND em2."entityId" = $2
    ORDER BY a."publishedAt" DESC NULLS LAST
    LIMIT 1
    `,
    fromEntityId,
    toEntityId,
  );

  if (directRows.length > 0) {
    const [from, to] = await Promise.all([
      prisma.entity.findUnique({ where: { id: fromEntityId }, select: { canonicalName: true } }),
      prisma.entity.findUnique({ where: { id: toEntityId }, select: { canonicalName: true } }),
    ]);
    const row = directRows[0];
    return [
      { entityId: fromEntityId, entityName: from?.canonicalName ?? fromEntityId, viaArticleId: row.article_id, viaArticleHeadline: row.headline },
      { entityId: toEntityId, entityName: to?.canonicalName ?? toEntityId, viaArticleId: row.article_id, viaArticleHeadline: row.headline },
    ];
  }

  // Hop 2: A → intermediary → B
  const hop2Rows = await prisma.$queryRawUnsafe<
    {
      mid_entity_id: string;
      mid_entity_name: string;
      article1_id: string;
      article1_headline: string;
      article2_id: string;
      article2_headline: string;
    }[]
  >(
    `
    SELECT
      e_mid.id AS mid_entity_id,
      e_mid."canonicalName" AS mid_entity_name,
      a1.id AS article1_id, a1.headline AS article1_headline,
      a2.id AS article2_id, a2.headline AS article2_headline,
      COUNT(DISTINCT em1."articleId") + COUNT(DISTINCT em2."articleId") AS connection_strength
    FROM entity_mentions em1
    JOIN entity_mentions em_mid1 ON em_mid1."articleId" = em1."articleId"
    JOIN entities e_mid ON e_mid.id = em_mid1."entityId"
    JOIN entity_mentions em_mid2 ON em_mid2."entityId" = e_mid.id
    JOIN entity_mentions em2 ON em2."articleId" = em_mid2."articleId"
    JOIN "Article" a1 ON a1.id = em1."articleId"
    JOIN "Article" a2 ON a2.id = em2."articleId"
    WHERE em1."entityId" = $1
      AND em2."entityId" = $2
      AND e_mid.id NOT IN ($1, $2)
    GROUP BY e_mid.id, a1.id, a1.headline, a2.id, a2.headline
    ORDER BY connection_strength DESC
    LIMIT 1
    `,
    fromEntityId,
    toEntityId,
  );

  if (hop2Rows.length === 0) return null;

  const [from, to] = await Promise.all([
    prisma.entity.findUnique({ where: { id: fromEntityId }, select: { canonicalName: true } }),
    prisma.entity.findUnique({ where: { id: toEntityId }, select: { canonicalName: true } }),
  ]);

  const r = hop2Rows[0];
  return [
    { entityId: fromEntityId, entityName: from?.canonicalName ?? fromEntityId, viaArticleId: r.article1_id, viaArticleHeadline: r.article1_headline },
    { entityId: r.mid_entity_id, entityName: r.mid_entity_name, viaArticleId: r.article2_id, viaArticleHeadline: r.article2_headline },
    { entityId: toEntityId, entityName: to?.canonicalName ?? toEntityId, viaArticleId: r.article2_id, viaArticleHeadline: r.article2_headline },
  ];
}

// ─── Query 5: Cross-chain Story Propagation (recursive CTE) ───────────────────
// Traces how a story spreads via story_links starting from an article.
// Uses PostgreSQL recursive CTE up to maxDepth hops.
export async function queryStoryPropagation(
  rootArticleId: string,
  maxDepth = 3,
): Promise<{ articleId: string; headline: string; depth: number; relationshipType: string; confidence: number }[]> {
  const rows = await prisma.$queryRawUnsafe<
    {
      article_id: string;
      headline: string;
      depth: number;
      relationship_type: string;
      confidence: number;
    }[]
  >(
    `
    WITH RECURSIVE propagation AS (
      -- Base: direct outgoing links from root article
      SELECT
        sl."targetArticleId" AS article_id,
        a.headline,
        1 AS depth,
        sl."relationshipType" AS relationship_type,
        sl.confidence
      FROM story_links sl
      JOIN "Article" a ON a.id = sl."targetArticleId"
      WHERE sl."sourceArticleId" = $1

      UNION

      -- Recurse: follow outgoing links from already-visited articles
      SELECT
        sl."targetArticleId",
        a.headline,
        p.depth + 1,
        sl."relationshipType",
        sl.confidence
      FROM propagation p
      JOIN story_links sl ON sl."sourceArticleId" = p.article_id
      JOIN "Article" a ON a.id = sl."targetArticleId"
      WHERE p.depth < $2
        AND sl."targetArticleId" != $1
    )
    SELECT DISTINCT ON (article_id) article_id, headline, depth, relationship_type, confidence
    FROM propagation
    ORDER BY article_id, depth ASC
    `,
    rootArticleId,
    maxDepth,
  );

  return rows.map((r) => ({
    articleId: r.article_id,
    headline: r.headline,
    depth: r.depth,
    relationshipType: r.relationship_type,
    confidence: r.confidence,
  }));
}
