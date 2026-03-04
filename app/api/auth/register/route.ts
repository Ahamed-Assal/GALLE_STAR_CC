import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const registerSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  email: z.string().email(),
  password: z.string().min(6),
});

export async function POST(req: Request) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      { error: "Server database is not configured. Please set DATABASE_URL." },
      { status: 500 },
    );
  }
  if (!process.env.DIRECT_URL) {
    return NextResponse.json(
      { error: "DIRECT_URL is not set. Add it in Vercel env vars (use port 5432 for Supabase)." },
      { status: 500 },
    );
  }

  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const email = parsed.data.email.toLowerCase();
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: "Email already in use" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(parsed.data.password, 12);

    await prisma.user.create({
      data: {
        name: parsed.data.name,
        email,
        passwordHash,
        role: "public",
      },
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("Registration failed:", error);
    const message = error instanceof Error ? error.message : "Registration failed";
    let userError = "Registration failed";

    if (message.includes("DATABASE_URL")) {
      userError = "Server database is not configured. Please set DATABASE_URL.";
    } else if (!process.env.DIRECT_URL) {
      userError = "DIRECT_URL is not set. Add it in Vercel (port 5432 for Supabase).";
    } else if (message.includes("connect") || message.includes("connection") || message.includes("timeout") || message.includes("ECONNREFUSED")) {
      userError = "Database connection failed. Check DATABASE_URL (port 6543 + ?pgbouncer=true) and DIRECT_URL on Vercel.";
    } else if (message.includes("relation") || message.includes("does not exist")) {
      userError = "Database tables missing. Run: npx prisma migrate deploy";
    } else if (message.includes("unique") || message.includes("duplicate")) {
      userError = "Email already in use.";
    } else if (process.env.NODE_ENV === "development") {
      userError = message;
    }

    return NextResponse.json({ error: userError }, { status: 500 });
  }
}
