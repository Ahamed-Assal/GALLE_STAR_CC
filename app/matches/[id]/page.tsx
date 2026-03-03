import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { LiveScoring } from "@/components/live-scoring";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function MatchDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ batter?: string; nonStriker?: string; bowler?: string }>;
}) {
  const session = await auth();
  const { id } = await params;
  const query = await searchParams;

  const match = await prisma.match.findUnique({
    where: { id },
    include: {
      teamA: { include: { players: { select: { name: true } } } },
      teamB: { include: { players: { select: { name: true } } } },
    },
  });
  if (!match) {
    notFound();
  }

  const events = await prisma.scoreEvent.findMany({
    where: { matchId: id },
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: "asc" },
  });

  const teamAPlayers = (match.teamA?.players ?? []).map((p) => p.name);
  const teamBPlayers = (match.teamB?.players ?? []).map((p) => p.name);

  return (
    <section className="space-y-4">
      <div className="rounded-xl border bg-white p-4 shadow-sm dark:bg-slate-900">
        <h1 className="text-2xl font-bold">{match.teamAName} vs {match.teamBName}</h1>
        <p className="text-sm text-gray-500">Mode: {match.mode}</p>
      </div>
      <LiveScoring
        match={match}
        initialEvents={events.map((event) => ({
          ...event,
          innings: event.innings,
          createdAt: event.createdAt.toISOString(),
          user: { id: event.user.id, name: event.user.name, email: event.user.email },
        }))}
        currentUserId={session?.user?.id ?? ""}
        teamAPlayers={teamAPlayers}
        teamBPlayers={teamBPlayers}
        initialBatterName={query.batter}
        initialNonStrikerName={query.nonStriker}
        initialBowlerName={query.bowler}
      />
    </section>
  );
}
