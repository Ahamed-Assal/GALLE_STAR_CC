import { auth } from "@/auth";
import { TeamManager } from "@/components/team-manager";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function TeamsPage() {
  const session = await auth();
  const currentUser = session?.user?.email
    ? await prisma.user.findUnique({
        where: { email: session.user.email.toLowerCase() },
        select: { id: true, role: true },
      })
    : null;

  const teams = await prisma.team.findMany({
    include: {
      players: true,
      owner: {
        select: { id: true, name: true, email: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

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
