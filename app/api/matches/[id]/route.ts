import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { requireAuth } from "@/lib/rbac";

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireAuth();
  if ("error" in authResult) {
    return authResult.error;
  }

  const { id } = await params;
  const match = await prisma.match.findUnique({
    where: { id },
    select: { id: true, createdById: true },
  });

  if (!match) {
    return NextResponse.json({ error: "Match not found" }, { status: 404 });
  }

  const currentUser = await prisma.user.findFirst({
    where: {
      OR: [
        authResult.session.user.id ? { id: authResult.session.user.id } : undefined,
        authResult.session.user.email ? { email: authResult.session.user.email } : undefined,
      ].filter(Boolean) as Array<{ id?: string; email?: string }>,
    },
    select: { role: true },
  });
  const isAdmin = currentUser?.role === "admin";
  if (!isAdmin) {
    return NextResponse.json(
      { error: "Only admin can delete this match" },
      { status: 403 },
    );
  }

  await prisma.match.delete({ where: { id } });
  return NextResponse.json({ success: true });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const payload = (await req.json().catch(() => null)) as { winnerTeamName?: string } | null;

  const match = await prisma.match.findUnique({
    where: { id },
    select: {
      id: true,
      mode: true,
      status: true,
      teamAName: true,
      teamBName: true,
      scorer1Id: true,
      scorer2Id: true,
      createdById: true,
    },
  });

  if (!match) {
    return NextResponse.json({ error: "Match not found" }, { status: 404 });
  }

  const session = await auth();
  const isPractice = match.mode === "practice";
  const userId = session?.user?.id;
  const isAdmin = session?.user?.role === "admin";
  const isAllowedAuthenticatedUser = Boolean(
    userId &&
      (isAdmin || userId === match.createdById || userId === match.scorer1Id || userId === match.scorer2Id),
  );

  if (!isPractice && !isAllowedAuthenticatedUser) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (isPractice && session?.user?.id && !isAllowedAuthenticatedUser) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const winnerTeamName = payload?.winnerTeamName?.trim();
  if (!winnerTeamName) {
    return NextResponse.json({ error: "Winner team is required" }, { status: 400 });
  }

  const validWinner =
    winnerTeamName.toLowerCase() === match.teamAName.toLowerCase()
      ? match.teamAName
      : winnerTeamName.toLowerCase() === match.teamBName.toLowerCase()
        ? match.teamBName
        : null;

  if (!validWinner) {
    return NextResponse.json(
      { error: `Winner must be either "${match.teamAName}" or "${match.teamBName}"` },
      { status: 400 },
    );
  }

  if (match.status === "completed") {
    return NextResponse.json({ success: true, alreadyCompleted: true, winnerTeamName: validWinner });
  }

  const updated = await prisma.match.update({
    where: { id: match.id },
    data: {
      status: "completed",
      winnerTeamName: validWinner,
    },
  });

  return NextResponse.json({ success: true, match: updated });
}
