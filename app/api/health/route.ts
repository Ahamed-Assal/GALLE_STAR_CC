import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ ok: true, db: "connected" });
  } catch (e) {
    console.error("Health check failed:", e);
    return NextResponse.json(
      {
        ok: false,
        db: "error",
        message: process.env.NODE_ENV === "development" ? String(e) : "Database connection failed",
      },
      { status: 500 },
    );
  }
}
