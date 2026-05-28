"use client";

import { useEffect, useRef, useState } from "react";

interface Presence {
  userId: string;
  username: string;
  displayName: string;
  cursor: string;
  ts: number;
}

export function usePresence(roomId: string | null, cursor?: string) {
  const [active, setActive] = useState<Presence[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!roomId) return;

    async function heartbeat() {
      try {
        const res = await fetch("/api/presence", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roomId, cursor }),
        });
        const data = (await res.json()) as { data?: { active: Presence[] } };
        if (data.data?.active) setActive(data.data.active);
      } catch { /* silent */ }
    }

    void heartbeat();
    intervalRef.current = setInterval(heartbeat, 10_000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      void fetch(`/api/presence?roomId=${encodeURIComponent(roomId)}`, { method: "DELETE" }).catch(() => {});
    };
  }, [roomId, cursor]);

  return active;
}
