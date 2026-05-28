import { NextRequest } from "next/server";
import { jsonOk, jsonError } from "@/lib/admin/api";
import { requireContributor } from "@/lib/contributor/authz";

// In-memory presence store. Survives single-server deploys; on Vercel Edge or
// multi-instance set up a Redis store instead.
// Structure: roomId → Map<userId, { username, displayName, cursor: string, ts: number }>

interface PresenceEntry {
  username: string;
  displayName: string;
  cursor: string;
  ts: number;
}

const presenceStore = new Map<string, Map<string, PresenceEntry>>();
const STALE_AFTER_MS = 15_000; // 15 s — clients heartbeat every 10 s

function pruneRoom(roomId: string) {
  const room = presenceStore.get(roomId);
  if (!room) return;
  const now = Date.now();
  for (const [uid, entry] of room) {
    if (now - entry.ts > STALE_AFTER_MS) room.delete(uid);
  }
  if (room.size === 0) presenceStore.delete(roomId);
}

export async function POST(req: NextRequest) {
  const access = await requireContributor();
  if (!access.ok) return access.response;

  const body = (await req.json().catch(() => null)) as { roomId?: string; cursor?: string } | null;
  const roomId = body?.roomId;
  if (!roomId) return jsonError("roomId required", 422);

  let room = presenceStore.get(roomId);
  if (!room) { room = new Map(); presenceStore.set(roomId, room); }

  room.set(access.session.id, {
    username: access.session.username,
    displayName: access.session.displayName,
    cursor: body?.cursor ?? "",
    ts: Date.now(),
  });

  pruneRoom(roomId);

  const active = Array.from(room.entries()).map(([uid, e]) => ({ userId: uid, ...e }));
  return jsonOk({ active });
}

export async function GET(req: NextRequest) {
  const access = await requireContributor();
  if (!access.ok) return access.response;

  const roomId = new URL(req.url).searchParams.get("roomId");
  if (!roomId) return jsonError("roomId required", 422);

  pruneRoom(roomId);
  const room = presenceStore.get(roomId);
  const active = room ? Array.from(room.entries()).map(([uid, e]) => ({ userId: uid, ...e })) : [];

  return jsonOk({ active });
}

export async function DELETE(req: NextRequest) {
  const access = await requireContributor();
  if (!access.ok) return access.response;

  const roomId = new URL(req.url).searchParams.get("roomId");
  if (!roomId) return jsonError("roomId required", 422);

  const room = presenceStore.get(roomId);
  if (room) {
    room.delete(access.session.id);
    if (room.size === 0) presenceStore.delete(roomId);
  }

  return jsonOk({ message: "Left" });
}
