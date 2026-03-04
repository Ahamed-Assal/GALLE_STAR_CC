import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function getHealth() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { ok: true, db: "connected" };
  } catch (e) {
    const err = e instanceof Error ? e : new Error(String(e));
    return {
      ok: false,
      db: "error",
      message: err.message,
      hint:
        err.message.includes("connect") || err.message.includes("timeout")
          ? "Check DATABASE_URL (port 6543 + ?pgbouncer=true) and DIRECT_URL"
          : err.message.includes("relation") || err.message.includes("does not exist")
            ? "Run: npx prisma migrate deploy"
            : undefined,
    };
  }
}

export default async function DebugDbPage() {
  const health = await getHealth();
  const hasDb = !!process.env.DATABASE_URL;
  const hasDirect = !!process.env.DIRECT_URL;
  const hasSecret = !!process.env.NEXTAUTH_SECRET;
  const hasUrl = !!process.env.NEXTAUTH_URL;

  return (
    <section className="mx-auto max-w-lg space-y-6 rounded-xl border bg-white p-6 dark:bg-slate-900">
      <h1 className="text-xl font-bold">Database & Auth Debug</h1>

      <div className="space-y-2 text-sm">
        <p>
          <span className="font-medium">DATABASE_URL:</span>{" "}
          {hasDb ? "✓ Set" : "✗ Missing"}
        </p>
        <p>
          <span className="font-medium">DIRECT_URL:</span>{" "}
          {hasDirect ? "✓ Set" : "✗ Missing"}
        </p>
        <p>
          <span className="font-medium">NEXTAUTH_SECRET:</span>{" "}
          {hasSecret ? "✓ Set" : "✗ Missing"}
        </p>
        <p>
          <span className="font-medium">NEXTAUTH_URL:</span>{" "}
          {hasUrl ? "✓ Set" : "✗ Missing"}
        </p>
      </div>

      <div className="rounded-lg border p-4">
        <h2 className="font-semibold">Health check</h2>
        <pre className="mt-2 overflow-auto text-xs">
          {JSON.stringify(health, null, 2)}
        </pre>
      </div>

      {!health.ok && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm dark:border-amber-700 dark:bg-amber-950/30">
          <p className="font-medium text-amber-800 dark:text-amber-200">
            {health.hint || "Check Vercel env vars and Supabase connection."}
          </p>
          <p className="mt-2 text-xs text-amber-700 dark:text-amber-300">
            Supabase: DATABASE_URL = port 6543 + ?pgbouncer=true, DIRECT_URL =
            port 5432
          </p>
        </div>
      )}

      <Link
        href="/"
        className="block text-sm text-primary hover:underline"
      >
        ← Back to home
      </Link>
    </section>
  );
}
