import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/rbac";

const logoSchema = z
  .string()
  .refine(
    (value) =>
      value === "" ||
      value.startsWith("http://") ||
      value.startsWith("https://") ||
      value.startsWith("data:image/"),
    "Invalid logo format",
  )
  .optional();

const createTeamSchema = z.object({
  name: z.string().min(2).max(80),
  logoUrl: logoSchema,
  players: z.array(
    z.object({
      name: z.string().min(1),
      jerseyNumber: z.number().int().positive().optional(),
    }),
  ),
});

export async function GET() {
  const authResult = await requireAuth();
  if ("error" in authResult) {
    return authResult.error;
  }

  const teams = await prisma.team.findMany({
    include: {
      players: true,
      owner: {
        select: { id: true, name: true, email: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ teams });
}

export async function POST(req: Request) {
  const authResult = await requireAuth();
  if ("error" in authResult) {
    return authResult.error;
  }

  try {
    const body = await req.json();
    const parsed = createTeamSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid team payload" }, { status: 400 });
    }

    const team = await prisma.team.create({
      data: {
        name: parsed.data.name,
        logoUrl: parsed.data.logoUrl || null,
        ownerId: authResult.session.user.id,
        players: {
          create: parsed.data.players,
        },
      },
      include: {
        players: true,
      },
    });

    return NextResponse.json({ team }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Could not create team" }, { status: 500 });
  }
}
