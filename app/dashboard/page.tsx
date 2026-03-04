import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function getAccessLabel(role?: string) {
  if (role === "admin" || role === "team_owner") return "Owner & Admin";
  if (role === "scorer") return "Team Member";
  return "User";
}

export default async function DashboardPage() {
  let session;
  try {
    session = await auth();
  } catch (e) {
    console.error("Dashboard auth failed:", e);
    throw e;
  }

  let teamsCount = 0;
  let matchesCount = 0;
  let ownerAdminCount = 0;
  let teamMemberCount = 0;
  let myTeamsCount = 0;

  try {
    [teamsCount, matchesCount, ownerAdminCount, teamMemberCount, myTeamsCount] = await Promise.all([
      prisma.team.count(),
      prisma.match.count(),
      prisma.user.count({ where: { role: { in: ["admin", "team_owner"] } } }),
      prisma.user.count({ where: { role: "scorer" } }),
      session?.user?.id ? prisma.team.count({ where: { ownerId: session.user.id } }) : Promise.resolve(0),
    ]);
  } catch (e) {
    console.error("Dashboard Prisma failed:", e);
    throw new Error(
      `Database error: ${e instanceof Error ? e.message : String(e)}. Ensure DATABASE_URL uses port 6543 with ?pgbouncer=true for Supabase pooler, and DIRECT_URL is set.`
    );
  }

  return (
    <section className="space-y-6">
      <div className="rounded-xl border bg-white p-5 shadow-sm dark:bg-slate-900">
        <h1 className="text-2xl font-bold">Welcome, {session?.user?.name ?? session?.user?.email}</h1>
        <p className="text-sm text-gray-500">Access: {getAccessLabel(session?.user?.role)}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border bg-white p-4 dark:bg-slate-900"><p className="text-xs">Teams</p><p className="text-2xl font-black">{teamsCount}</p></div>
        <div className="rounded-xl border bg-white p-4 dark:bg-slate-900"><p className="text-xs">Matches</p><p className="text-2xl font-black">{matchesCount}</p></div>
        <div className="rounded-xl border bg-white p-4 dark:bg-slate-900"><p className="text-xs">Owner &amp; Admin</p><p className="text-2xl font-black">{ownerAdminCount}</p></div>
        <div className="rounded-xl border bg-white p-4 dark:bg-slate-900"><p className="text-xs">Team Members</p><p className="text-2xl font-black">{teamMemberCount}</p></div>
      </div>

      <div className="rounded-xl border bg-white p-4 text-sm text-slate-600 dark:bg-slate-900 dark:text-slate-300">
        <p className="font-semibold text-slate-900 dark:text-slate-100">Role visibility</p>
        <p className="mt-1">Only friendly labels are shown: Admin, Owner, Team Member, User.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Link href="/teams" className="rounded-xl border bg-white p-4 hover:border-primary dark:bg-slate-900">
          {myTeamsCount > 0 ? "Manage Team" : "Register Team"}
        </Link>
        <Link href="/matches" className="rounded-xl border bg-white p-4 hover:border-primary dark:bg-slate-900">Tournament Matches</Link>
        <Link href="/practice" className="rounded-xl border bg-white p-4 hover:border-primary dark:bg-slate-900">Practice Mode</Link>
        {session?.user?.role === "admin" && <Link href="/admin" className="rounded-xl border bg-white p-4 hover:border-primary dark:bg-slate-900">Admin Panel</Link>}
      </div>
    </section>
  );
}
