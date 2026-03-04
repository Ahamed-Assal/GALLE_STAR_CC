import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { TeamManager } from "@/components/team-manager";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function TeamsPage() {
  let session;
  try {
    session = await auth();
  } catch (e) {
    console.error("Teams auth failed:", e);
    redirect("/login");
  }
  if (!session?.user) {
    redirect("/login");
  }

  let currentUser: { id: string; role: string } | null = null;
  let teams;

  try {
    currentUser = session?.user?.email
      ? await prisma.user.findUnique({
          where: { email: session.user.email.toLowerCase() },
          select: { id: true, role: true },
        })
      : null;
    teams = await prisma.team.findMany({
      include: {
        players: true,
        owner: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  } catch (e) {
    console.error("Teams Prisma failed:", e);
    return (
      <section className="space-y-4">
        <h1 className="text-2xl font-bold">Teams</h1>
        <div className="rounded-xl border border-red-200 bg-red-50 p-5 dark:border-red-900 dark:bg-red-950/50">
          <p className="text-red-600 dark:text-red-400">
            Could not load teams. {(e instanceof Error ? e.message : String(e))}
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold">Teams</h1>
      <TeamManager
        teams={teams}
        currentUserId={currentUser?.id ?? session?.user?.id ?? ""}
        role={currentUser?.role ?? session?.user?.role ?? "public"}
      />
    </section>
  );
}
