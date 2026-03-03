"use client";

import { toast } from "sonner";

type UserRow = {
  id: string;
  name: string | null;
  email: string;
  role: "admin" | "team_owner" | "scorer" | "public";
};

type MatchRow = {
  id: string;
  teamAName: string;
  teamBName: string;
  mode: string;
  status: string;
};

const roles: UserRow["role"][] = ["admin", "team_owner", "scorer", "public"];

function getRoleLabel(role: UserRow["role"]) {
  if (role === "admin") return "Admin";
  if (role === "team_owner") return "Owner";
  if (role === "scorer") return "Team Member";
  return "User";
}

export function AdminPanel({ users, matches }: { users: UserRow[]; matches: MatchRow[] }) {
  const changeRole = async (userId: string, role: UserRow["role"]) => {
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });

    if (!res.ok) {
      toast.error("Role update failed");
      return;
    }

    toast.success("Role updated");
    window.location.reload();
  };

  const deleteMatch = async (matchId: string) => {
    const res = await fetch(`/api/admin/matches/${matchId}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Match delete failed");
      return;
    }

    toast.success("Match deleted");
    window.location.reload();
  };

  return (
    <>
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Users</h2>
        {users.map((user) => (
          <div key={user.id} className="rounded-xl border bg-white p-4 dark:bg-slate-900">
            <p className="font-medium">{user.name ?? user.email}</p>
            <p className="text-sm text-gray-500">{user.email} - {getRoleLabel(user.role)}</p>
            <div className="mt-2 flex gap-2">
              {roles.map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => changeRole(user.id, role)}
                  className="rounded-md border px-2 py-1 text-xs hover:bg-primary/10"
                >
                  {getRoleLabel(role)}
                </button>
              ))}
            </div>
          </div>
        ))}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Matches</h2>
        {matches.map((match) => (
          <div key={match.id} className="rounded-xl border bg-white p-4 dark:bg-slate-900">
            <p className="font-medium">{match.teamAName} vs {match.teamBName}</p>
            <p className="text-sm text-gray-500">{match.mode} - {match.status}</p>
            <button
              type="button"
              onClick={() => deleteMatch(match.id)}
              className="mt-2 rounded-md border border-red-400 px-3 py-1 text-xs text-red-500"
            >
              Delete match
            </button>
          </div>
        ))}
      </section>
    </>
  );
}
