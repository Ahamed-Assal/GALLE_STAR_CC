import { ScoreEventType } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { getPracticeGuestUserId } from "@/lib/guest-user";
import { prisma } from "@/lib/prisma";
import { scoreDeltas } from "@/lib/score";

const eventSchema = z.object({
  eventType: z.enum([
    "dot_ball",
    "run_1",
    "run_2",
    "run_3",
    "run_4",
    "run_6",
    "wicket",
    "wide",
    "no_ball",
    "undo",
  ]),
  batterName: z.string().trim().min(1).max(80).optional(),
  nonStrikerName: z.string().trim().min(1).max(80).optional(),
  bowlerName: z.string().trim().min(1).max(80).optional(),
  dismissalType: z.enum(["run_out", "catch_out"]).optional(),
  dismissedBatterName: z.string().trim().min(1).max(80).optional(),
});

function oppositeSide(side: "A" | "B") {
  return side === "A" ? "B" : "A";
}

function teamNameForSide(match: { teamAName: string; teamBName: string }, side: "A" | "B") {
  return side === "A" ? match.teamAName : match.teamBName;
}

async function getInningsTotals(matchId: string, innings: number) {
  const events = await prisma.scoreEvent.findMany({
    where: { matchId, innings, eventType: { not: "undo" } },
    orderBy: { createdAt: "asc" },
  });

  return events.reduce(
    (acc, event) => {
      acc.runs += event.runsDelta;
      acc.wickets += event.wicketDelta;
      acc.balls += event.ballDelta;
      return acc;
    },
    { runs: 0, wickets: 0, balls: 0 },
  );
}

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const events = await prisma.scoreEvent.findMany({
    where: { matchId: id },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ events });
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();

  const { id } = await params;
  const match = await prisma.match.findUnique({
    where: { id },
    include: {
      teamA: { include: { players: { select: { name: true } } } },
      teamB: { include: { players: { select: { name: true } } } },
    },
  });
  if (!match) {
    return NextResponse.json({ error: "Match not found" }, { status: 404 });
  }

  const isPractice = match.mode === "practice";
  const userId = session?.user?.id ?? (isPractice ? await getPracticeGuestUserId() : "");
  let canScore = false;
  if (isPractice) {
    canScore = Boolean(userId);
  } else if (session?.user?.id) {
    const inningsLockEvent = await prisma.scoreEvent.findFirst({
      where: { matchId: id, innings: match.innings, eventType: { not: "undo" } },
      orderBy: { createdAt: "asc" },
      select: { userId: true },
    });
    canScore = inningsLockEvent
      ? inningsLockEvent.userId === session.user.id
      : session.user.id === match.createdById;
  }

  if (!canScore || !userId) {
    return NextResponse.json(
      {
        error: isPractice
          ? "Could not identify scorer"
          : "This innings is locked by another scorer. You can watch live updates only.",
      },
      { status: 403 },
    );
  }

  if (match.status === "completed") {
    return NextResponse.json({ error: "Match already completed" }, { status: 400 });
  }

  try {
    const body = await req.json();
    const parsed = eventSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid score action" }, { status: 400 });
    }

    if (parsed.data.eventType === "undo") {
      await prisma.$transaction(async (tx) => {
        const lastEvent = await tx.scoreEvent.findFirst({
          where: { matchId: id, innings: match.innings, eventType: { not: "undo" } },
          orderBy: { createdAt: "desc" },
        });

        if (!lastEvent) {
          throw new Error("No action to undo");
        }

        await tx.scoreEvent.delete({ where: { id: lastEvent.id } });
        await tx.scoreEvent.create({
          data: {
            matchId: id,
            userId,
            eventType: "undo",
            innings: match.innings,
            note: `Undo ${lastEvent.eventType}`,
          },
        });
      });
    } else {
      if (match.mode === "tournament") {
        const battingPlayers =
          (match.battingSide === "A" ? match.teamA?.players : match.teamB?.players) ?? [];
        const bowlingPlayers =
          (match.battingSide === "A" ? match.teamB?.players : match.teamA?.players) ?? [];
        const batterOptions = battingPlayers.map((player) => player.name);
        const bowlerOptions = bowlingPlayers.map((player) => player.name);

        if (parsed.data.batterName && !batterOptions.includes(parsed.data.batterName)) {
          return NextResponse.json(
            { error: "Batter must be selected from batting team members" },
            { status: 400 },
          );
        }
        if (parsed.data.nonStrikerName && !batterOptions.includes(parsed.data.nonStrikerName)) {
          return NextResponse.json(
            { error: "Non-striker must be selected from batting team members" },
            { status: 400 },
          );
        }
        if (
          parsed.data.batterName &&
          parsed.data.nonStrikerName &&
          parsed.data.batterName === parsed.data.nonStrikerName
        ) {
          return NextResponse.json(
            { error: "Striker and non-striker must be different" },
            { status: 400 },
          );
        }
        if (parsed.data.bowlerName && !bowlerOptions.includes(parsed.data.bowlerName)) {
          return NextResponse.json(
            { error: "Bowler must be selected from bowling team members" },
            { status: 400 },
          );
        }
        if (parsed.data.dismissedBatterName && !batterOptions.includes(parsed.data.dismissedBatterName)) {
          return NextResponse.json(
            { error: "Dismissed batsman must be from batting team members" },
            { status: 400 },
          );
        }
      }

      const delta = scoreDeltas[parsed.data.eventType as ScoreEventType];
      const noteParts = [];
      if (parsed.data.batterName) {
        noteParts.push(`Batter: ${parsed.data.batterName}`);
      }
      if (parsed.data.bowlerName) {
        noteParts.push(`Bowler: ${parsed.data.bowlerName}`);
      }
      if (parsed.data.dismissalType) {
        noteParts.push(
          `Dismissal: ${parsed.data.dismissalType === "run_out" ? "Run Out" : "Catch Out"}`,
        );
      }
      if (parsed.data.dismissedBatterName) {
        noteParts.push(`Out Batter: ${parsed.data.dismissedBatterName}`);
      }

      await prisma.scoreEvent.create({
        data: {
          matchId: id,
          userId,
          innings: match.innings,
          eventType: parsed.data.eventType,
          runsDelta: delta.runs,
          wicketDelta: delta.wickets,
          ballDelta: delta.balls,
          note: noteParts.length ? noteParts.join(" | ") : null,
        },
      });
    }

    const totals = await getInningsTotals(id, match.innings);
    const maxBalls = match.overs * match.ballsPerOver;
    const allOut = totals.wickets >= match.numberOfPlayers - 1;
    const allBallsUsed = totals.balls >= maxBalls;
    const inningsCompleted = allOut || allBallsUsed;

    if (match.innings === 1 && inningsCompleted) {
      const nextBattingSide = oppositeSide(match.battingSide);
      const switchedMatch = await prisma.match.update({
        where: { id },
        data: {
          firstInningsBattingSide: match.battingSide,
          firstInningsRuns: totals.runs,
          firstInningsWickets: totals.wickets,
          firstInningsBalls: totals.balls,
          targetRuns: totals.runs + 1,
          innings: 2,
          battingSide: nextBattingSide,
          currentRuns: 0,
          currentWickets: 0,
          currentBalls: 0,
          status: "live",
          completedAt: null,
        },
      });

      return NextResponse.json({
        success: true,
        inningsSwitched: true,
        message: "First innings completed. Batting and bowling sides switched.",
        match: switchedMatch,
      });
    }

    const target = match.targetRuns ?? (match.firstInningsRuns ? match.firstInningsRuns + 1 : null);
    const chaseCompleted = match.innings === 2 && target !== null && totals.runs >= target;
    const matchCompleted = match.innings === 2 && (inningsCompleted || chaseCompleted);

    if (matchCompleted) {
      const firstRuns = match.firstInningsRuns ?? 0;
      const secondRuns = totals.runs;
      const secondInningsTeam = teamNameForSide(match, match.battingSide);
      const firstInningsTeam = teamNameForSide(match, oppositeSide(match.battingSide));

      let winnerTeamName = "Draw";
      if (chaseCompleted || secondRuns > firstRuns) {
        winnerTeamName = secondInningsTeam;
      } else if (secondRuns < firstRuns) {
        winnerTeamName = firstInningsTeam;
      }

      const completedMatch = await prisma.match.update({
        where: { id },
        data: {
          currentRuns: totals.runs,
          currentWickets: totals.wickets,
          currentBalls: totals.balls,
          status: "completed",
          winnerTeamName,
          completedAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        matchCompleted: true,
        match: completedMatch,
        winnerTeamName,
      });
    }

    const updatedMatch = await prisma.match.update({
      where: { id },
      data: {
        currentRuns: totals.runs,
        currentWickets: totals.wickets,
        currentBalls: totals.balls,
        status: "live",
      },
    });

    return NextResponse.json({ success: true, match: updatedMatch });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not add score event";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
