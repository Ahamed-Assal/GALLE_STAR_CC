import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const verbose = url.searchParams.get("verbose") === "1";

  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ ok: true, db: "connected" });
  } catch (e) {
    console.error("Health check failed:", e);
    const errMsg = e instanceof Error ? e.message : String(e);
    const errStack = e instanceof Error ? e.stack : undefined;
    return NextResponse.json(
      {
        ok: false,
        db: "error",
        message: "Database connection failed",
        ...(verbose && {
          detail: errMsg,
          hint: errMsg.includes("connect") || errMsg.includes("timeout")
            ? "Check DATABASE_URL (port 6543 + ?pgbouncer=true) and DIRECT_URL on Vercel"
            : errMsg.includes("relation") || errMsg.includes("does not exist")
              ? "Run: npx prisma migrate deploy"
              : undefined,
        }),
        ...(verbose && errStack && { stack: errStack }),
      },
      { status: 500 },
    );
  }
}
