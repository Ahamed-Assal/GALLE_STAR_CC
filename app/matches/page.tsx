import { auth } from "@/auth";
import { MatchCreator } from "@/components/match-creator";
import { MatchesList } from "@/components/matches-list";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function MatchesPage() {
  const session = await auth();
  const canCreateTournament = Boolean(session?.user);
  const currentUser = session?.user?.id || session?.user?.email
    ? await prisma.user.findFirst({
        where: {
          OR: [
            session?.user?.id ? { id: session.user.id } : undefined,
            session?.user?.email ? { email: session.user.email } : undefined,
          ].filter(Boolean) as Array<{ id?: string; email?: string }>,
        },
        select: { role: true },
      })
    : null;
  const isAdmin = currentUser?.role === "admin";

  const [teams, matches] = await Promise.all([
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
