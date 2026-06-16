import 'server-only';
import {
  queryEntityNeighbors,
  queryStoryChainGraph,
  queryStoryChainEntities,
  queryEntityPath,
  queryStoryPropagation,
  type EntityNode,
  type EntityPathStep,
} from './queries';

// ─── Graph Format (d3 / vis.js compatible) ────────────────────────────────────

export interface GraphNode {
  id: string;
  label: string;
  type: 'entity' | 'article' | 'story_chain';
  weight: number;
  metadata: Record<string, unknown>;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: string;
  weight: number;
  label?: string;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
  meta: Record<string, unknown>;
}

// ─── Entity Neighborhood Graph ─────────────────────────────────────────────────
// Focal entity at center, co-occurring entities as neighbors, edges = shared article count.
export async function getEntityGraph(entityId: string, limit = 25): Promise<GraphData> {
  const [focal, neighbors] = await Promise.all([
    import('@/lib/db/prisma').then(({ prisma }) =>
      prisma.entity.findUnique({ where: { id: entityId } }),
    ),
    queryEntityNeighbors(entityId, limit),
  ]);

  if (!focal) return { nodes: [], edges: [], meta: { entityId, error: 'not_found' } };

  const nodes: GraphNode[] = [
    {
      id: focal.id,
      label: focal.canonicalName,
      type: 'entity',
      weight: focal.importanceScore,
      metadata: { entityType: focal.entityType, mentionCount: focal.mentionCount, isFocal: true },
    },
    ...neighbors.map(({ entity, sharedArticles }) => ({
      id: entity.id,
      label: entity.canonicalName,
      type: 'entity' as const,
      weight: entity.importanceScore,
      metadata: { entityType: entity.entityType, mentionCount: entity.mentionCount, sharedArticles },
    })),
  ];

  const edges: GraphEdge[] = neighbors.map(({ entity, sharedArticles }) => ({
    id: `${entityId}__${entity.id}`,
    source: entityId,
    target: entity.id,
    type: 'co_occurs',
    weight: sharedArticles,
    label: `${sharedArticles} article${sharedArticles === 1 ? '' : 's'}`,
  }));

  return {
    nodes,
    edges,
    meta: { entityId, focalEntity: focal.canonicalName, neighborCount: neighbors.length },
  };
}

// ─── Story Chain Article Graph ─────────────────────────────────────────────────
// Articles in a chain as nodes, story_links as directed edges.
export async function getStoryGraph(storyChainId: string): Promise<GraphData> {
  const [chain, { articles, links }] = await Promise.all([
    import('@/lib/db/prisma').then(({ prisma }) =>
      prisma.storyChain.findUnique({ where: { id: storyChainId }, select: { title: true, totalArticles: true } }),
    ),
    queryStoryChainGraph(storyChainId),
  ]);

  const nodes: GraphNode[] = articles.map((a) => ({
    id: a.id,
    label: a.headline,
    type: 'article',
    weight: a.importanceScore,
    metadata: { publishedAt: a.publishedAt, storyChainId: a.storyChainId },
  }));

  const edges: GraphEdge[] = links.map((l) => ({
    id: l.id,
    source: l.sourceArticleId,
    target: l.targetArticleId,
    type: l.relationshipType,
    weight: Math.round(l.confidence * 100),
    label: l.relationshipType.replace(/_/g, ' ').toLowerCase(),
  }));

  return {
    nodes,
    edges,
    meta: {
      storyChainId,
      chainTitle: chain?.title,
      articleCount: articles.length,
      linkCount: links.length,
    },
  };
}

// ─── Story Chain Entity Profile ────────────────────────────────────────────────
// Returns entities in a story chain as nodes, co-occurrence edges between them.
export async function getStoryEntityGraph(storyChainId: string, limit = 20): Promise<GraphData> {
  const ranked = await queryStoryChainEntities(storyChainId, limit);

  const nodes: GraphNode[] = ranked.map(({ entity, articleCount, prominenceScore }) => ({
    id: entity.id,
    label: entity.canonicalName,
    type: 'entity',
    weight: prominenceScore,
    metadata: { entityType: entity.entityType, articleCount, prominenceScore, mentionCount: entity.mentionCount },
  }));

  // Edges: co-occurrence between entities in this chain (shared articles)
  // Build from neighbor queries for each top entity (up to top 5 only to avoid N² queries)
  const topEntityIds = ranked.slice(0, 5).map((r) => r.entity.id);
  const edgeMap = new Map<string, GraphEdge>();

  await Promise.all(
    topEntityIds.map(async (eid) => {
      const neighbors = await queryEntityNeighbors(eid, 10);
      for (const { entity: neighbor, sharedArticles } of neighbors) {
        // Only include edges where both sides are in our node set
        if (!ranked.find((r) => r.entity.id === neighbor.id)) continue;
        const key = [eid, neighbor.id].sort().join('__');
        if (edgeMap.has(key)) continue;
        edgeMap.set(key, {
          id: key,
          source: eid,
          target: neighbor.id,
          type: 'co_occurs',
          weight: sharedArticles,
          label: `${sharedArticles} shared`,
        });
      }
    }),
  );

  return {
    nodes,
    edges: Array.from(edgeMap.values()),
    meta: { storyChainId, entityCount: ranked.length },
  };
}

// ─── Entity Path ───────────────────────────────────────────────────────────────
export interface EntityPathResult {
  found: boolean;
  hops: number;
  path: EntityPathStep[];
}

export async function findEntityConnectionPath(
  fromEntityId: string,
  toEntityId: string,
): Promise<EntityPathResult> {
  if (fromEntityId === toEntityId) {
    const entity = await import('@/lib/db/prisma').then(({ prisma }) =>
      prisma.entity.findUnique({ where: { id: fromEntityId }, select: { canonicalName: true } }),
    );
    const step: EntityPathStep = {
      entityId: fromEntityId,
      entityName: entity?.canonicalName ?? fromEntityId,
      viaArticleId: '',
      viaArticleHeadline: '',
    };
    return { found: true, hops: 0, path: [step] };
  }

  const path = await queryEntityPath(fromEntityId, toEntityId);
  if (!path) return { found: false, hops: -1, path: [] };

  return { found: true, hops: path.length - 1, path };
}

// ─── Story Propagation Tree ────────────────────────────────────────────────────
export async function getArticlePropagationGraph(
  rootArticleId: string,
  maxDepth = 3,
): Promise<GraphData> {
  const [root, propagated] = await Promise.all([
    import('@/lib/db/prisma').then(({ prisma }) =>
      prisma.article.findUnique({
        where: { id: rootArticleId },
        select: { headline: true, importanceScore: true },
      }),
    ),
    queryStoryPropagation(rootArticleId, maxDepth),
  ]);

  const nodes: GraphNode[] = [
    {
      id: rootArticleId,
      label: root?.headline ?? rootArticleId,
      type: 'article',
      weight: root?.importanceScore ?? 50,
      metadata: { isRoot: true, depth: 0 },
    },
    ...propagated.map((p) => ({
      id: p.articleId,
      label: p.headline,
      type: 'article' as const,
      weight: Math.round(p.confidence * 100),
      metadata: { depth: p.depth, relationshipType: p.relationshipType },
    })),
  ];

  // Deduplicate nodes (recursive CTE may surface same article via multiple paths)
  const seenIds = new Set<string>();
  const deduped = nodes.filter((n) => {
    if (seenIds.has(n.id)) return false;
    seenIds.add(n.id);
    return true;
  });

  const edges: GraphEdge[] = propagated.map((p) => ({
    id: `prop__${rootArticleId}__${p.articleId}__${p.depth}`,
    source: rootArticleId,
    target: p.articleId,
    type: p.relationshipType,
    weight: Math.round(p.confidence * 100),
    label: p.relationshipType.replace(/_/g, ' ').toLowerCase(),
  }));

  return {
    nodes: deduped,
    edges,
    meta: { rootArticleId, maxDepth, propagationCount: propagated.length },
  };
}
