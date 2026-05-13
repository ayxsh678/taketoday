// force-dynamic prevents Next.js from running this route at build time,
// which would trigger firebase-admin initialization before env vars exist.
export const dynamic = "force-dynamic";

import { handlers } from "@/auth";

export const { GET, POST } = handlers;
