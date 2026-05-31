import Link from "next/link";
import { redirect } from "next/navigation";
import { contributorAuthFn } from "@/lib/contributor/auth";

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ verified?: string }>;
}) {
  const session = await contributorAuthFn();
  if (!session?.contributor) redirect("/contribute/login");

  const { verified } = await searchParams;

  return (
    <main className="mx-auto max-w-md px-6 py-24 text-center">
      {verified === "1" ? (
        <>
          <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-green-600">Verified</p>
          <h1 className="mt-4 font-serif text-3xl italic tracking-tight text-ink">
            Email confirmed.
          </h1>
          <p className="mt-4 text-[15px] text-ink-500">
            Your email address has been verified. You have full contributor access.
          </p>
          <Link
            href="/contribute"
            className="mt-8 inline-flex items-center rounded-full bg-ink text-paper px-6 py-2.5 text-sm font-medium hover:bg-ink-700 transition-colors"
          >
            Start contributing
          </Link>
        </>
      ) : (
        <>
          <h1 className="font-serif text-3xl italic tracking-tight text-ink">Verify your email</h1>
          <p className="mt-4 text-[15px] text-ink-500">
            Check your inbox for a verification link, or request a new one below.
          </p>
          <VerifyEmailButton />
        </>
      )}
    </main>
  );
}

function VerifyEmailButton() {
  return (
    <form
      action={async () => {
        "use server";
        // Trigger send-verification API via a server action proxy
        // (client fetches directly from the page via the button below)
      }}
    >
      <p className="mt-6 text-sm text-ink-400">
        Use the button in your contributor dashboard to resend the verification email,
        or{" "}
        <Link href="/contribute" className="text-ink hover:underline">
          go to your dashboard
        </Link>
        .
      </p>
    </form>
  );
}
