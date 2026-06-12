import { jsonOk } from "@/lib/admin/api";
import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { requireAdmin } from "@/lib/admin/authz";
import { prisma } from "@/lib/db/prisma";

export async function GET(request: NextRequest) {
  const access = await requireAdmin("content:read");
  if (!access.ok) return access.response;

  const folderId = request.nextUrl.searchParams.get("folderId");
  const q = request.nextUrl.searchParams.get("q");

  const where: Prisma.MediaAssetWhereInput = {};
  if (folderId) where.folderId = folderId;
  if (q) {
    where.OR = [
      { publicId: { contains: q, mode: "insensitive" } },
      { altText: { contains: q, mode: "insensitive" } },
    ];
  }

  const [assets, folders, totalSize] = await Promise.all([
    prisma.mediaAsset.findMany({
      where,
      include: {
        folder: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.mediaFolder.findMany({
      where: { parentId: folderId ?? null },
      include: { _count: { select: { assets: true } } },
      orderBy: { name: "asc" },
    }),
    prisma.mediaAsset.aggregate({ _sum: { bytes: true } }),
  ]);

  const mappedAssets = assets.map((a) => ({
    id: a.id,
    publicId: a.publicId,
    url: a.url,
    width: a.width,
    height: a.height,
    bytes: a.bytes,
    altText: a.altText,
    folder: a.folder?.name ?? null,
    folderId: a.folderId,
    createdAt: a.createdAt.toISOString(),
  }));

  const mappedFolders = folders.map((f) => ({
    id: f.id,
    name: f.name,
    assetCount: f._count.assets,
    parentId: f.parentId,
  }));

  return jsonOk({
    assets: mappedAssets,
    folders: mappedFolders,
    total: mappedAssets.length,
    totalBytes: totalSize._sum.bytes ?? 0,
  });
}
