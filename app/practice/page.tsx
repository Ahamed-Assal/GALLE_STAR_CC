import { PracticeMatchCreator } from "@/components/practice-match-creator";
import { auth } from "@/auth";
import { FinishedPracticeMatches } from "@/components/finished-practice-matches";
import { prisma } from "@/lib/prisma";

export default async function PracticePage() {
  const session = await auth();
  const [completedPracticeMatches, currentUser] = await Promise.all([
    prisma.match.findMany({
      where: {
        mode: "practice",
        status: "completed",
      },
      orderBy: { completedAt: "desc" },
      take: 20,
    }),
    session?.user?.id || session?.user?.email
      ? prisma.user.findFirst({
          where: {
            OR: [
              session?.user?.id ? { id: session.user.id } : undefined,
              session?.user?.email ? { email: session.user.email } : undefined,
            ].filter(Boolean) as Array<{ id?: string; email?: string }>,
          },
          select: { role: true },
        })
      : Promise.resolve(null),
  ]);
  const isAdmin = currentUser?.role === "admin";

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold">Practice Mode</h1>
      <p className="text-sm text-gray-500">
        Create practice matches and keep completed scorecards for later review.
      </p>
      <PracticeMatchCreator />
      <section className="rounded-xl border bg-white p-5 shadow-sm dark:bg-slate-900">
        <h2 className="text-lg font-semibold">Finished Practice Matches</h2>
        <p className="mt-1 text-sm text-slate-500">
          Click any match to open full score details (same as live scoring view).
        </p>
        <FinishedPracticeMatches
          matches={completedPracticeMatches.map((match) => ({
            id: match.id,
            teamAName: match.teamAName,
            teamBName: match.teamBName,
            currentRuns: match.currentRuns,
            currentWickets: match.currentWickets,
            currentBalls: match.currentBalls,
            ballsPerOver: match.ballsPerOver,
            winnerTeamName: match.winnerTeamName,
            completedAt: match.completedAt ? match.completedAt.toISOString() : null,
            createdAt: match.createdAt.toISOString(),
          }))}
          isAdmin={isAdmin}
        />
      </section>
    </section>
  );
}
