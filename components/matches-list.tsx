"use client";

import Link from "next/link";
import { toast } from "sonner";

type MatchItem = {
  id: string;
  teamAName: string;
  teamBName: string;
  createdById: string;
  status: string;
  currentRuns: number;
  currentWickets: number;
  currentBalls: number;
  ballsPerOver: number;
};

export function MatchesList({
  matches,
  canDelete,
}: {
  matches: MatchItem[];
  canDelete: boolean;
}) {
  const deleteMatch = async (id: string) => {
    const res = await fetch(`/api/matches/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const body = await res.json();
      toast.error(body.error ?? "Cannot delete match");
      return;
    }
    toast.success("Match deleted");
    window.location.reload();
  };

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold">Recent Matches</h2>
      {matches.map((match) => (
        <div key={match.id} className="rounded-xl border bg-white p-4 dark:bg-slate-900">
          <div className="flex items-center justify-between gap-2">
            <Link href={`/matches/${match.id}`} className="font-semibold hover:text-primary">
              {match.teamAName} vs {match.teamBName}
            </Link>
            <span className="text-xs uppercase text-gray-500">{match.status}</span>
          </div>
          <p className="text-sm text-gray-500">
            {match.currentRuns}/{match.currentWickets} in {Math.floor(match.currentBalls / match.ballsPerOver)}.
            {match.currentBalls % match.ballsPerOver} overs
          </p>
          {canDelete && (
            <button
              type="button"
              onClick={() => deleteMatch(match.id)}
              className="mt-2 rounded-md border border-red-400 px-3 py-1 text-xs text-red-500"
            >
              Delete match
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
