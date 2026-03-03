"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type FinishedPracticeMatch = {
  id: string;
  teamAName: string;
  teamBName: string;
  currentRuns: number;
  currentWickets: number;
  currentBalls: number;
  ballsPerOver: number;
  winnerTeamName: string | null;
  completedAt: string | null;
  createdAt: string;
};

export function FinishedPracticeMatches({
  matches,
  isAdmin,
}: {
  matches: FinishedPracticeMatch[];
  isAdmin: boolean;
}) {
  const router = useRouter();

  const deleteMatch = async (id: string) => {
    const res = await fetch(`/api/matches/${id}`, { method: "DELETE" });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast.error(body.error ?? "Could not delete match");
      return;
    }
    toast.success("Finished match deleted");
    router.refresh();
  };

  if (matches.length === 0) {
    return (
      <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">
        No finished practice matches yet.
      </p>
    );
  }

  return (
    <div className="mt-4 space-y-3">
      {matches.map((match) => (
        <div key={match.id} className="rounded-lg border p-3">
          <Link href={`/matches/${match.id}?practice=1`} className="block transition hover:text-primary">
            <p className="font-semibold">
              {match.teamAName} vs {match.teamBName}
            </p>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              Final: {match.currentRuns}/{match.currentWickets} in{" "}
              {Math.floor(match.currentBalls / match.ballsPerOver)}.{match.currentBalls % match.ballsPerOver} overs
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Winner: <span className="font-medium">{match.winnerTeamName ?? "Not set"}</span>
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Finished: {new Date(match.completedAt ?? match.createdAt).toLocaleString()}
            </p>
          </Link>
          {isAdmin && (
            <button
              type="button"
              onClick={() => deleteMatch(match.id)}
              className="mt-3 rounded-md border border-red-400 px-3 py-1 text-xs text-red-600"
            >
              Delete match
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
