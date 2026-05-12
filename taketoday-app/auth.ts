import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { FirestoreAdapter } from "@auth/firebase-adapter";
import { adminApp } from "@/lib/firebase/admin";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: FirestoreAdapter(adminApp),
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
});
