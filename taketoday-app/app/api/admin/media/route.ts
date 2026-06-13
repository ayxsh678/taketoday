import { captureApiError, jsonError, jsonOk } from "@/lib/admin/api";
import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { requireAdmin } from "@/lib/admin/authz";
import { prisma } from "@/lib/db/prisma";
import { uploadBuffer } from "@/lib/cloudinary";

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

export async function POST(request: NextRequest) {
  const access = await requireAdmin("media:write");
  if (!access.ok) return access.response;

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return jsonError("Expected multipart/form-data", 400);
  }

  const file = formData.get("file");
  if (!(file instanceof File)) return jsonError("No file provided", 400);

  if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
    return jsonError("Only image and video files are supported", 415);
  }

  const MAX_BYTES = 50 * 1024 * 1024; // 50 MB
  if (file.size > MAX_BYTES) return jsonError("File exceeds 50 MB limit", 413);

  const folderId = formData.get("folderId");
  const altText = formData.get("altText");

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await uploadBuffer(buffer, { folder: "taketoday" });

    const asset = await prisma.mediaAsset.create({
      data: {
        url: result.secure_url,
        publicId: result.public_id,
        bytes: result.bytes,
        width: result.width,
        height: result.height,
        altText: typeof altText === "string" && altText ? altText : null,
        folderId: typeof folderId === "string" && folderId ? folderId : null,
      },
    });

    return jsonOk({
      id: asset.id,
      url: asset.url,
      publicId: asset.publicId,
      width: asset.width,
      height: asset.height,
      bytes: asset.bytes,
      altText: asset.altText,
      createdAt: asset.createdAt.toISOString(),
    }, { status: 201 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Upload failed";
    if (msg.includes("not configured")) return jsonError(msg, 503);
    return captureApiError(error);
  }
}
