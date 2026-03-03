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

const updateTeamSchema = z.object({
  name: z.string().min(2).max(80),
  logoUrl: logoSchema,
  players: z.array(
    z.object({
      name: z.string().min(1),
      jerseyNumber: z.number().int().positive().optional(),
    }),
  ),
});

async function canManageTeam(
  teamId: string,
  userId: string | undefined,
  userEmail: string | null | undefined,
) {
  const user =
    (userId
      ? await prisma.user.findUnique({
          where: { id: userId },
          select: { id: true, role: true },
        })
      : null) ??
    (userEmail
      ? await prisma.user.findUnique({
          where: { email: userEmail.toLowerCase() },
          select: { id: true, role: true },
        })
      : null);

  if (user?.role === "admin") {
    return true;
  }
  const team = await prisma.team.findUnique({ where: { id: teamId }, select: { ownerId: true } });
  return team?.ownerId === user?.id;
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireAuth();
  if ("error" in authResult) {
    return authResult.error;
  }

  const { id } = await params;
  const canManage = await canManageTeam(
    id,
    authResult.session.user.id,
    authResult.session.user.email,
  );
  if (!canManage) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const parsed = updateTeamSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid team payload" }, { status: 400 });
    }

    const team = await prisma.$transaction(async (tx) => {
      await tx.player.deleteMany({ where: { teamId: id } });
      return tx.team.update({
        where: { id },
        data: {
          name: parsed.data.name,
          logoUrl: parsed.data.logoUrl || null,
          players: {
            create: parsed.data.players,
          },
        },
        include: { players: true },
      });
    });

    return NextResponse.json({ team });
  } catch {
    return NextResponse.json({ error: "Could not update team" }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireAuth();
  if ("error" in authResult) {
    return authResult.error;
  }

  const { id } = await params;
  const canManage = await canManageTeam(
    id,
    authResult.session.user.id,
    authResult.session.user.email,
  );
  if (!canManage) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.team.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
