import { auth } from "@/auth";
import { MatchCreator } from "@/components/match-creator";
import { MatchesList } from "@/components/matches-list";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function MatchesPage() {
  const session = await auth();
  const canCreateTournament = Boolean(session?.user);
  const currentUser =
    session?.user?.id || session?.user?.email
      ? await prisma.user
          .findFirst({
            where: session.user.id
              ? { id: session.user.id }
              : { email: session.user.email!.toLowerCase() },
            select: { role: true },
          })
          .catch(() => null)
      : null;
  const isAdmin = currentUser?.role === "admin";

  let teams: Array<{ id: string; name: string; players: Array<{ name: string }> }> = [];
  let matches: Array<{
    id: string;
    teamAName: string;
    teamBName: string;
    createdById: string;
    status: string;
    currentRuns: number;
    currentWickets: number;
    currentBalls: number;
    ballsPerOver: number;
  }> = [];

  try {
    [teams, matches] = await Promise.all([
    prisma.team.findMany({
      select: { id: true, name: true, players: { select: { name: true } } },
      orderBy: { name: "asc" },
    }),
    prisma.match.findMany({
      where: {
        mode: "tournament",
        status: { in: ["live", "completed"] },
      },
      orderBy: { updatedAt: "desc" },
      take: 20,
    }),
  ]);
  } catch (e) {
    console.error("Matches page Prisma failed:", e);
  }

  return (
    <section className="space-y-5">
      <h1 className="text-2xl font-bold">Tournament Matches</h1>
      {canCreateTournament ? (
        <MatchCreator teams={teams} />
      ) : (
        <div className="rounded-xl border bg-white p-4 text-sm text-slate-600 dark:bg-slate-900 dark:text-slate-300">
          Login to create tournament matches. You can still view recent live matches and detailed scores.
        </div>
      )}
      <MatchesList
        matches={matches}
        canDelete={isAdmin}
      />
    </section>
  );
}
