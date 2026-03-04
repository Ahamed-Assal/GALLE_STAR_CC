import { auth } from "@/auth";
import { AdminPanel } from "@/components/admin-panel";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await auth();

  if (session?.user.role !== "admin") {
    return <p className="text-red-500">Forbidden</p>;
  }

  let users: Array<{ id: string; name: string | null; email: string; role: "admin" | "team_owner" | "scorer" | "public" }> = [];
  let matches: Awaited<ReturnType<typeof prisma.match.findMany>> = [];
  let teamsCount = 0;
  let scoreEventsCount = 0;

  try {
    [users, matches, teamsCount, scoreEventsCount] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, email: true, role: true },
    }),
    prisma.match.findMany({ orderBy: { createdAt: "desc" }, take: 25 }),
    prisma.team.count(),
    prisma.scoreEvent.count(),
  ]);
  } catch (e) {
    console.error("Admin page Prisma failed:", e);
    return (
      <section className="space-y-6">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <div className="rounded-xl border border-red-200 bg-red-50 p-5 dark:border-red-900 dark:bg-red-950/50">
          <p className="text-red-600 dark:text-red-400">Database error loading admin data.</p>
        </div>
      </section>
    );
  }

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
