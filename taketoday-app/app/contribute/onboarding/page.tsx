import Link from "next/link";
import { redirect } from "next/navigation";
import { contributorAuthFn } from "@/lib/contributor/auth";

export default async function OnboardingPage() {
  const session = await contributorAuthFn();

  // If session doesn't exist yet, redirect to login
  if (!session?.contributor) {
    redirect("/contribute/login");
  }

  const { username, displayName } = session.contributor;

  return (
    <main className="mx-auto max-w-2xl px-6 py-24 text-center">
      <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-ink-500">
        Welcome to the Open Newsroom
      </p>
      <h1 className="mt-6 font-serif text-[56px] leading-none tracking-tight text-ink">
        Hi, <span className="italic">{displayName}</span>.
      </h1>
      <p className="mt-6 text-[17px] leading-relaxed text-ink-500 max-w-xl mx-auto">
        Your contributor account is ready. You can submit stories, fact-check claims, and join investigations — all under your byline.
      </p>

      <div className="mt-12 flex flex-col sm:flex-row gap-4 justify-center">
        <Link
          href="/contribute/new"
          className="inline-flex items-center justify-center rounded-full bg-ink text-paper px-7 py-3 text-[14px] font-medium tracking-wide hover:bg-ink-700 transition-colors"
        >
          Submit your first story
        </Link>
        <Link
          href={`/profile/${username}`}
          className="inline-flex items-center justify-center rounded-full border border-ink-300 text-ink px-7 py-3 text-[14px] font-medium tracking-wide hover:border-ink hover:bg-ink hover:text-paper transition-colors"
        >
          View your profile
        </Link>
      </div>

      <p className="mt-10 text-sm text-ink-400">
        Add a bio, location, and links from your{" "}
        <Link href={`/profile/${username}`} className="underline hover:text-ink">
          profile page
        </Link>
        .
      </p>
    </main>
  );
}
