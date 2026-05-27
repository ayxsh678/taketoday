"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error, {
      tags: { section: "admin" },
      extra: { digest: error.digest },
    });
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-400/10">
        <AlertTriangle className="h-8 w-8 text-red-400" />
      </div>
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-white">Something went wrong</h2>
        <p className="max-w-sm text-sm text-zinc-400">
          {error.message ?? "An unexpected error occurred in the admin panel."}
        </p>
        {error.digest && (
          <p className="font-mono text-xs text-zinc-600">Error ID: {error.digest}</p>
        )}
      </div>
      <div className="flex gap-3">
        <Button variant="primary" onClick={reset}>
          Try again
        </Button>
        <Button variant="secondary" onClick={() => window.location.replace("/admin")}>
          Back to dashboard
        </Button>
      </div>
    </div>
  );
}
