"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error:", error.message, error.digest, error.stack);
  }, [error]);

  return (
    <div className="mx-auto max-w-md space-y-6 py-16 text-center">
      <h1 className="text-2xl font-bold text-red-600 dark:text-red-400">Something went wrong</h1>
      <p className="text-sm text-slate-600 dark:text-slate-400">
        {process.env.NODE_ENV === "development"
          ? error.message
          : "A server error occurred. Please try again."}
      </p>
      {process.env.NODE_ENV === "development" && error.digest && (
        <p className="text-xs text-slate-500">Digest: {error.digest}</p>
      )}
      <div className="flex justify-center gap-3">
        <button
          onClick={reset}
          className="rounded-md bg-primary px-4 py-2 font-semibold text-primary-foreground"
        >
          Try again
        </button>
        <Link
          href="/"
          className="rounded-md border px-4 py-2 font-semibold hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
