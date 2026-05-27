import Link from "next/link";

export default function AdminNotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 text-center">
      <div className="space-y-2">
        <p className="font-mono text-5xl font-bold text-zinc-700">404</p>
        <h2 className="text-lg font-semibold text-white">Page not found</h2>
        <p className="text-sm text-zinc-400">
          This admin page doesn&apos;t exist or was moved.
        </p>
      </div>
      <Link
        href="/admin"
        className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-200 hover:bg-white/10"
      >
        Back to dashboard
      </Link>
    </div>
  );
}
