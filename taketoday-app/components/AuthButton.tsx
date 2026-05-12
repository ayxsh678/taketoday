"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import Image from "next/image";

export function AuthButton() {
  const { data: session, status } = useSession();

  if (status === "loading") return <div className="w-7 h-7" />;

  if (session?.user) {
    return (
      <div className="flex items-center gap-2">
        {session.user.image && (
          <Image
            src={session.user.image}
            alt={session.user.name ?? "User"}
            width={28}
            height={28}
            className="rounded-full border border-ink-200"
          />
        )}
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="text-[11px] font-mono text-ink-500 hover:text-ink transition-colors"
        >
          Sign out
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => signIn("google")}
      className="text-[12px] font-medium text-ink-700 hover:text-ink transition-colors"
    >
      Sign in
    </button>
  );
}
