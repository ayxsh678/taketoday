import 'server-only';
import { prisma } from '@/lib/db/prisma';
import { Prisma } from '@prisma/client';
import type { Entity, EntityMention, EntityType } from '@prisma/client';

export type EntityWithMentionCount = Entity & { _count: { mentions: number } };

export async function findEntityById(id: string): Promise<Entity | null> {
  return prisma.entity.findUnique({ where: { id } });
}

export async function findEntityByCanonicalName(
  canonicalName: string,
  entityType: EntityType,
): Promise<Entity | null> {
  return prisma.entity.findUnique({ where: { canonicalName_entityType: { canonicalName, entityType } } });
}

export async function findEntitiesByIds(ids: string[]): Promise<Entity[]> {
  return prisma.entity.findMany({ where: { id: { in: ids } } });
}

export async function findTopEntities(limit = 20): Promise<EntityWithMentionCount[]> {
  return prisma.entity.findMany({
    orderBy: { importanceScore: 'desc' },
    take: limit,
    include: { _count: { select: { mentions: true } } },
  });
}

// Upsert entity — deduplicates by canonicalName + entityType
export async function upsertEntity(data: {
  canonicalName: string;
  entityType: EntityType;
  wikidataId?: string;
  aliases?: string[];
  description?: string;
  attributes?: Record<string, string>;
}): Promise<Entity> {
  return prisma.entity.upsert({
    where: { canonicalName_entityType: { canonicalName: data.canonicalName, entityType: data.entityType } },
    update: {
      mentionCount: { increment: 1 },
      lastMentioned: new Date(),
      ...(data.wikidataId ? { wikidataId: data.wikidataId } : {}),
    },
    create: {
      canonicalName: data.canonicalName,
      entityType: data.entityType,
      wikidataId: data.wikidataId,
      aliases: data.aliases ?? [],
      description: data.description,
      attributes: data.attributes ?? {},
      mentionCount: 1,
      lastMentioned: new Date(),
    },
  });
}

export async function createEntityMention(data: {
  articleId: string;
  entityId: string;
  surfaceForm: string;
  confidence?: number;
  isFocal?: boolean;
}): Promise<EntityMention> {
  return prisma.entityMention.create({
    data: {
      articleId: data.articleId,
      entityId: data.entityId,
      surfaceForm: data.surfaceForm,
      confidence: data.confidence ?? 1.0,
      isFocal: data.isFocal ?? false,
    },
  });
}

export async function findEntityMentionsByArticle(articleId: string): Promise<(EntityMention & { entity: Entity })[]> {
  return prisma.entityMention.findMany({
    where: { articleId },
    include: { entity: true },
    orderBy: { confidence: 'desc' },
  });
}

// Find articles that share ≥ minShared entities with the given entity IDs, within dayRange days
export async function findArticlesByEntityOverlap(
  entityIds: string[],
  opts: { minShared?: number; dayRange?: number; excludeArticleId?: string } = {},
): Promise<{ articleId: string; sharedCount: number }[]> {
  const { minShared = 2, dayRange = 90, excludeArticleId } = opts;
  const since = new Date(Date.now() - dayRange * 86400000);

  const results = await prisma.$queryRaw<{ article_id: string; shared_count: bigint }[]>`
    SELECT em.article_id, COUNT(DISTINCT em.entity_id)::int AS shared_count
    FROM entity_mentions em
    JOIN "Article" a ON a.id = em.article_id
    WHERE em.entity_id = ANY(${entityIds}::text[])
      AND a."createdAt" >= ${since}
      ${excludeArticleId ? Prisma.sql`AND em.article_id != ${excludeArticleId}` : Prisma.empty}
    GROUP BY em.article_id
    HAVING COUNT(DISTINCT em.entity_id) >= ${minShared}
    ORDER BY shared_count DESC
    LIMIT 50
  `;

  return results.map((r) => ({ articleId: r.article_id, sharedCount: Number(r.shared_count) }));
}
