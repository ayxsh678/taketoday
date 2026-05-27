import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";

// ─── Admin SSE stream ─────────────────────────────────────────────────────────
// Pushes notification events to connected admin clients.
// Polls DB every 10s and emits new unread notifications.
//
// Usage:
//   const es = new EventSource("/api/admin/stream");
//   es.addEventListener("notification", (e) => { ... });
//   es.addEventListener("ping", () => {});

const POLL_INTERVAL_MS = 10_000;
const KEEP_ALIVE_MS = 25_000; // < Vercel's 30s timeout

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.isAdmin) {
    return new Response("Unauthorized", { status: 401 });
  }

  const encoder = new TextEncoder();
  let closed = false;

  // Track newest notification ID seen at connection time
  let lastSeenId: string | null = null;

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        if (closed) return;
        try {
          controller.enqueue(
            encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`),
          );
        } catch {
          closed = true;
        }
      };

      // Send initial ping so client knows connection is live
      send("ping", { ts: new Date().toISOString() });

      // Seed lastSeenId with the most recent existing notification
      try {
        const latest = await prisma.notification.findFirst({
          orderBy: { createdAt: "desc" },
          select: { id: true },
        });
        lastSeenId = latest?.id ?? null;
      } catch {
        /* ignore — will pick up on first poll */
      }

      // Poll loop
      const pollInterval = setInterval(async () => {
        if (closed) {
          clearInterval(pollInterval);
          return;
        }

        try {
          const where = lastSeenId
            ? {
                read: false,
                createdAt: {
                  gt: (
                    await prisma.notification.findUnique({
                      where: { id: lastSeenId },
                      select: { createdAt: true },
                    })
                  )?.createdAt ?? new Date(0),
                },
              }
            : { read: false };

          const newNotifications = await prisma.notification.findMany({
            where,
            orderBy: { createdAt: "asc" },
            take: 10,
            select: { id: true, title: true, message: true, kind: true, createdAt: true },
          });

          if (newNotifications.length > 0) {
            for (const n of newNotifications) {
              send("notification", n);
            }
            lastSeenId = newNotifications[newNotifications.length - 1].id;
          }
        } catch {
          /* ignore transient DB errors */
        }
      }, POLL_INTERVAL_MS);

      // Keep-alive ping to prevent proxy timeouts
      const keepAlive = setInterval(() => {
        send("ping", { ts: new Date().toISOString() });
      }, KEEP_ALIVE_MS);

      // Cleanup when client disconnects
      request.signal.addEventListener("abort", () => {
        closed = true;
        clearInterval(pollInterval);
        clearInterval(keepAlive);
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no", // disable nginx buffering
    },
  });
}
