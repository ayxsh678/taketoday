import NextAuth, { type DefaultSession } from "next-auth";
import Google from "next-auth/providers/google";
import { isAdminEmail, roleFromEmail } from "@/lib/admin/rbac";
import type { AdminRole } from "@/lib/admin/types";
import { appConfig } from "@/lib/config/app";

declare module "next-auth" {
  interface Session {
    user: {
      id?: string;
      role: AdminRole;
      isAdmin: boolean;
    } & DefaultSession["user"];
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: appConfig.authGoogleId,
      clientSecret: appConfig.authGoogleSecret,
    }),
  ],
  secret: appConfig.nextauthSecret,
  // 8-hour TTL: cap the window where a revoked admin retains access via stale JWT
  session: { strategy: "jwt", maxAge: 8 * 60 * 60 },
  pages: {
    signIn: "/admin/login",
  },
  callbacks: {
    async jwt({ token }) {
      const adminToken = token as typeof token & { role?: AdminRole; isAdmin?: boolean };
      adminToken.role = roleFromEmail(token.email);
      adminToken.isAdmin = isAdminEmail(token.email);
      return adminToken;
    },
    async session({ session, token }) {
      const adminToken = token as typeof token & { role?: AdminRole; isAdmin?: boolean };
      session.user.id = token.sub ?? "";
      session.user.role = adminToken.role ?? "Analyst";
      session.user.isAdmin = Boolean(adminToken.isAdmin);
      return session;
    },
  },
});
