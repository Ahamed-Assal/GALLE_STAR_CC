import { auth } from "@/auth";
import { AdminPanel } from "@/components/admin-panel";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await auth();

  if (session?.user.role !== "admin") {
    return <p className="text-red-500">Forbidden</p>;
  }

  const [users, matches, teamsCount, scoreEventsCount] = await Promise.all([
    prisma.user.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.match.findMany({ orderBy: { createdAt: "desc" }, take: 25 }),
    prisma.team.count(),
    prisma.scoreEvent.count(),
  ]);

  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border bg-white p-4 dark:bg-slate-900"><p className="text-xs">Users</p><p className="text-2xl font-black">{users.length}</p></div>
        <div className="rounded-xl border bg-white p-4 dark:bg-slate-900"><p className="text-xs">Teams</p><p className="text-2xl font-black">{teamsCount}</p></div>
        <div className="rounded-xl border bg-white p-4 dark:bg-slate-900"><p className="text-xs">Matches</p><p className="text-2xl font-black">{matches.length}</p></div>
        <div className="rounded-xl border bg-white p-4 dark:bg-slate-900"><p className="text-xs">Score Events</p><p className="text-2xl font-black">{scoreEventsCount}</p></div>
      </div>

      <AdminPanel users={users} matches={matches} />
    </section>
  );
}
