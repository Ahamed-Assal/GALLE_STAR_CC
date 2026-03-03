import { MatchMode } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { getPracticeGuestUserId } from "@/lib/guest-user";
import { prisma } from "@/lib/prisma";
import { requireRoles } from "@/lib/rbac";

const practiceSchema = z.object({
  mode: z.literal("practice"),
  teamAName: z.string().min(2),
  teamBName: z.string().min(2),
  battingSide: z.enum(["A", "B"]),
  overs: z.number().int().positive(),
  ballsPerOver: z.number().int().positive(),
  numberOfPlayers: z.number().int().min(2),
  batterName: z.string().min(1).optional(),
  nonStrikerName: z.string().min(1).optional(),
  bowlerName: z.string().min(1).optional(),
});

const tournamentSchema = z.object({
  mode: z.literal("tournament"),
  teamAId: z.string().uuid(),
  teamBId: z.string().uuid(),
  battingSide: z.enum(["A", "B"]),
  overs: z.number().int().positive(),
  ballsPerOver: z.number().int().positive(),
  numberOfPlayers: z.number().int().min(2),
});

export async function GET() {
  const matches = await prisma.match.findMany({
    include: {
      scorer1: { select: { id: true, name: true, email: true } },
      scorer2: { select: { id: true, name: true, email: true } },
      teamA: { select: { id: true, name: true } },
      teamB: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ matches });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (body.mode === MatchMode.practice) {
      const parsed = practiceSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: "Invalid practice match payload" }, { status: 400 });
      }

      const session = await auth();
      const scorerId = session?.user?.id ?? (await getPracticeGuestUserId());

      const match = await prisma.match.create({
        data: {
          mode: "practice",
          teamAName: parsed.data.teamAName,
          teamBName: parsed.data.teamBName,
          battingSide: parsed.data.battingSide,
          firstInningsBattingSide: parsed.data.battingSide,
          overs: parsed.data.overs,
          ballsPerOver: parsed.data.ballsPerOver,
          numberOfPlayers: parsed.data.numberOfPlayers,
          scorer1Id: scorerId,
          scorer2Id: scorerId,
          createdById: scorerId,
          isEphemeral: true,
        },
      });

      return NextResponse.json(
        {
          match,
          defaults: {
            batterName: parsed.data.batterName ?? "",
            nonStrikerName: parsed.data.nonStrikerName ?? "",
            bowlerName: parsed.data.bowlerName ?? "",
          },
        },
        { status: 201 },
      );
    }

    const authResult = await requireRoles(["admin", "team_owner", "scorer", "public"]);
    if ("error" in authResult) {
      return authResult.error;
    }

    const parsedTournament = tournamentSchema.safeParse(body);
    if (!parsedTournament.success) {
      return NextResponse.json({ error: "Invalid tournament match payload" }, { status: 400 });
    }

    if (parsedTournament.data.teamAId === parsedTournament.data.teamBId) {
      return NextResponse.json({ error: "Team A and Team B must differ" }, { status: 400 });
    }

    const [teamA, teamB] = await Promise.all([
      prisma.team.findUnique({ where: { id: parsedTournament.data.teamAId } }),
      prisma.team.findUnique({ where: { id: parsedTournament.data.teamBId } }),
    ]);

    if (!teamA || !teamB) {
      return NextResponse.json({ error: "Invalid team selection" }, { status: 400 });
    }

    const match = await prisma.match.create({
      data: {
        mode: "tournament",
        teamAId: teamA.id,
        teamBId: teamB.id,
        teamAName: teamA.name,
        teamBName: teamB.name,
        battingSide: parsedTournament.data.battingSide,
        firstInningsBattingSide: parsedTournament.data.battingSide,
        overs: parsedTournament.data.overs,
        ballsPerOver: parsedTournament.data.ballsPerOver,
        numberOfPlayers: parsedTournament.data.numberOfPlayers,
        scorer1Id: authResult.session.user.id,
        scorer2Id: authResult.session.user.id,
        createdById: authResult.session.user.id,
        isEphemeral: false,
      },
    });

    return NextResponse.json({ match }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Could not create match" }, { status: 500 });
  }
}
