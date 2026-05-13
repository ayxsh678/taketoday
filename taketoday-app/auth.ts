import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { FirestoreAdapter } from "@auth/firebase-adapter";
import { getDb } from "@/lib/firebase/admin";

/**
 * Lazily create the NextAuth instance so firebase-admin is never initialized
 * at module import time (which happens during Next.js build, before env vars
 * exist). The instance is created on the first actual auth call at runtime.
 */
let _nextAuth: ReturnType<typeof NextAuth> | undefined;

function getNextAuth() {
  return (_nextAuth ??= NextAuth({
    adapter: FirestoreAdapter(getDb()),
    providers: [Google],
    session: { strategy: "database" },
    callbacks: {
      session({ session, user }) {
        session.user.id = user.id;
        return session;
      },
    },
    pages: {
      signIn: "/auth/signin",
    },
  }));
}

// Export thin wrappers — each delegates to the lazy singleton on first call.
// The `as` casts preserve the original NextAuth overloaded types.
export const handlers: ReturnType<typeof NextAuth>["handlers"] = {
  GET: (...args: Parameters<ReturnType<typeof NextAuth>["handlers"]["GET"]>) =>
    getNextAuth().handlers.GET(...args),
  POST: (...args: Parameters<ReturnType<typeof NextAuth>["handlers"]["POST"]>) =>
    getNextAuth().handlers.POST(...args),
};

export const auth = ((...args: Parameters<ReturnType<typeof NextAuth>["auth"]>) =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (getNextAuth().auth as any)(...args)) as ReturnType<typeof NextAuth>["auth"];

export const signIn = ((...args: Parameters<ReturnType<typeof NextAuth>["signIn"]>) =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (getNextAuth().signIn as any)(...args)) as ReturnType<typeof NextAuth>["signIn"];

export const signOut = ((...args: Parameters<ReturnType<typeof NextAuth>["signOut"]>) =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (getNextAuth().signOut as any)(...args)) as ReturnType<typeof NextAuth>["signOut"];
