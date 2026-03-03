import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRoles } from "@/lib/rbac";

export async function GET() {
  const authResult = await requireRoles(["admin"]);
  if ("error" in authResult) {
    return authResult.error;
  }

  const [users, matches, teams, scoreEvents] = await Promise.all([
    prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.match.findMany({
      select: {
        id: true,
        mode: true,
        status: true,
        teamAName: true,
        teamBName: true,
        currentRuns: true,
        currentWickets: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.team.count(),
    prisma.scoreEvent.count(),
  ]);

  return NextResponse.json({
    stats: {
      users: users.length,
      teams,
      matches: matches.length,
      scoreEvents,
    },
    users,
    matches,
  });
}
