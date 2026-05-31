import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { appConfig } from "@/lib/config/app";
import { createGoogleUser } from "./auth-helpers";
import type { ContributorRole, ReputationTier } from "./types";

declare module "next-auth" {
  interface Session {
    contributor?: {
      id: string;
      email: string;
      username: string;
      displayName: string;
      avatar?: string | null;
      role: ContributorRole;
      reputationTier: ReputationTier;
      reputationScore: number;
      isVerifiedJournalist: boolean;
      suspendedAt?: Date | null;
    };
  }
}

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const contributorAuth = NextAuth({
  providers: [
    Credentials({
      name: "Email & Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;

        const user = await prisma.publicUser.findUnique({
          where: { email: email.toLowerCase() },
          include: { reputation: true },
        });

        if (!user || !user.passwordHash) return null;
        if (user.suspendedAt) return null;

        // Dynamic import — bcryptjs only needed server-side
        const bcrypt = await import("bcryptjs");
        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.displayName,
          image: user.avatar,
        };
      },
    }),
    Google({
      clientId: appConfig.authGoogleId,
      clientSecret: appConfig.authGoogleSecret,
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
        };
      },
    }),
  ],
  secret: appConfig.nextauthSecret,
  // 24-hour TTL: cap the window where a suspended contributor retains access
  session: { strategy: "jwt", maxAge: 24 * 60 * 60 },
  pages: {
    signIn: "/contribute/login",
    newUser: "/contribute/onboarding",
  },
  callbacks: {
    async jwt({ token, user, account }) {
      if (user && account) {
        const email = token.email!;

        let existing = await prisma.publicUser.findUnique({
          where: { email },
          include: { reputation: true },
        });

        // Auto-create PublicUser on first Google sign-in.
        // Credentials sign-in requires explicit registration (/contribute/register).
        if (!existing && account.provider === "google") {
          existing = await createGoogleUser(
            email,
            token.name ?? "",
            token.picture ?? null,
          );
        }

        if (existing) {
          token.contributorId = existing.id;
          token.contributorRole = existing.role;
          token.contributorTier = existing.reputation?.tier ?? "NEWCOMER";
          token.contributorScore = existing.reputation?.overallScore ?? 0;
          token.username = existing.username;
          token.isVerifiedJournalist = existing.isVerifiedJournalist;
          token.suspendedAt = existing.suspendedAt;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token.contributorId) {
        session.contributor = {
          id: token.contributorId as string,
          email: token.email!,
          username: token.username as string,
          displayName: token.name ?? "",
          avatar: token.picture,
          role: token.contributorRole as ContributorRole,
          reputationTier: token.contributorTier as ReputationTier,
          reputationScore: token.contributorScore as number,
          isVerifiedJournalist: token.isVerifiedJournalist as boolean,
          suspendedAt: token.suspendedAt as Date | null,
        };
      }
      return session;
    },
  },
});

export const {
  handlers: contributorHandlers,
  auth: contributorAuthFn,
  signIn: contributorSignIn,
  signOut: contributorSignOut,
} = contributorAuth;
