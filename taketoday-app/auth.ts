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
      twoFaVerified?: boolean;
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
  session: { strategy: "jwt" },
  pages: {
    signIn: "/admin/login",
  },
  callbacks: {
    async jwt({ token }) {
      const email = token.email;
      const adminToken = token as typeof token & { role?: AdminRole; isAdmin?: boolean; twoFaVerified?: boolean };
      adminToken.role = roleFromEmail(email);
      adminToken.isAdmin = isAdminEmail(email);
      adminToken.twoFaVerified = adminToken.twoFaVerified ?? false;
      return adminToken;
    },
    async session({ session, token }) {
      const adminToken = token as typeof token & { role?: AdminRole; isAdmin?: boolean; twoFaVerified?: boolean };
      session.user.id = token.sub ?? "";
      session.user.role = adminToken.role ?? "Analyst";
      session.user.isAdmin = Boolean(adminToken.isAdmin);
      session.user.twoFaVerified = adminToken.twoFaVerified ?? false;
      return session;
    },
  },
});
