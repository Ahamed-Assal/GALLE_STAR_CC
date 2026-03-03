"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type TeamOption = { id: string; name: string; players: Array<{ name: string }> };

export function MatchCreator({ teams }: { teams: TeamOption[] }) {
  const router = useRouter();
  const [form, setForm] = useState({
    teamAId: "",
    teamBId: "",
    battingSide: "A",
    batterName: "",
    nonStrikerName: "",
    bowlerName: "",
    overs: 20,
    ballsPerOver: 6,
    numberOfPlayers: 11,
  });
  const teamAPlayers = teams.find((team) => team.id === form.teamAId)?.players ?? [];
  const teamBPlayers = teams.find((team) => team.id === form.teamBId)?.players ?? [];
  const teamAName = teams.find((team) => team.id === form.teamAId)?.name ?? "Team A";
  const teamBName = teams.find((team) => team.id === form.teamBId)?.name ?? "Team B";
  const battingPlayers = form.battingSide === "A" ? teamAPlayers : teamBPlayers;
  const bowlingPlayers = form.battingSide === "A" ? teamBPlayers : teamAPlayers;
  const availableNonStrikerPlayers = useMemo(
    () =>
      battingPlayers.filter(
        (player) => player.name.trim().toLowerCase() !== form.batterName.trim().toLowerCase(),
      ),
    [battingPlayers, form.batterName],
  );
  const createTournamentMatch = async () => {
    const selectedTeamA = teams.find((team) => team.id === form.teamAId);
    const selectedTeamB = teams.find((team) => team.id === form.teamBId);
    const battingTeam = form.battingSide === "A" ? selectedTeamA : selectedTeamB;
    const bowlingTeam = form.battingSide === "A" ? selectedTeamB : selectedTeamA;

    if (
      battingTeam &&
      form.batterName &&
      !battingTeam.players.some((player) => player.name === form.batterName)
    ) {
      toast.error("Opening batter must be from batting team members");
      return;
    }
    if (
      battingTeam &&
      form.nonStrikerName &&
      !battingTeam.players.some((player) => player.name === form.nonStrikerName)
    ) {
      toast.error("Non-striker must be from batting team members");
      return;
    }
    if (form.batterName && form.nonStrikerName && form.batterName === form.nonStrikerName) {
      toast.error("Striker and non-striker must be different");
      return;
    }
    if (
      bowlingTeam &&
      form.bowlerName &&
      !bowlingTeam.players.some((player) => player.name === form.bowlerName)
    ) {
      toast.error("Opening bowler must be from bowling team members");
      return;
    }
    const res = await fetch("/api/matches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "tournament", ...form }),
    });

    const body = await res.json();
    if (!res.ok) {
      toast.error(body.error ?? "Could not create match");
      return;
    }

    toast.success("Tournament match created");
    const query = new URLSearchParams({
      batter: form.batterName,
      nonStriker: form.nonStrikerName,
      bowler: form.bowlerName,
    });
    router.push(`/matches/${body.match.id}?${query.toString()}`);
    router.refresh();
  };

  return (
    <div className="rounded-xl border bg-white p-5 shadow-sm dark:bg-slate-900">
      <h2 className="mb-4 text-lg font-semibold">Create Tournament Match</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <select className="rounded-md border px-3 py-2" value={form.teamAId} onChange={(e) => setForm((p) => ({ ...p, teamAId: e.target.value }))}>
          <option value="">Select Team A</option>
          {teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}
        </select>
        <select className="rounded-md border px-3 py-2" value={form.teamBId} onChange={(e) => setForm((p) => ({ ...p, teamBId: e.target.value }))}>
          <option value="">Select Team B</option>
          {teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}
        </select>
        <select className="rounded-md border px-3 py-2" value={form.battingSide} onChange={(e) => setForm((p) => ({ ...p, battingSide: e.target.value }))}>
          <option value="A">{teamAName} bats first</option>
          <option value="B">{teamBName} bats first</option>
        </select>
        <div className="rounded-md border px-3 py-2 text-sm text-slate-600 dark:text-slate-300">
          Bowling first: {form.battingSide === "A" ? teamBName : teamAName}
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-600 dark:text-slate-300">Total Overs (example: 20)</label>
          <input type="number" className="w-full rounded-md border px-3 py-2" value={form.overs} onChange={(e) => setForm((p) => ({ ...p, overs: Number(e.target.value) }))} placeholder="How many overs for this match?" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-600 dark:text-slate-300">Balls Per Over (example: 6)</label>
          <input type="number" className="w-full rounded-md border px-3 py-2" value={form.ballsPerOver} onChange={(e) => setForm((p) => ({ ...p, ballsPerOver: Number(e.target.value) }))} placeholder="How many balls in one over?" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-600 dark:text-slate-300">Players Per Team (example: 11)</label>
          <input type="number" className="w-full rounded-md border px-3 py-2" value={form.numberOfPlayers} onChange={(e) => setForm((p) => ({ ...p, numberOfPlayers: Number(e.target.value) }))} placeholder="How many players per team?" />
        </div>
        <select
          className="rounded-md border px-3 py-2"
          value={form.batterName}
          onChange={(e) => setForm((p) => ({ ...p, batterName: e.target.value }))}
        >
          <option value="">Select opening batter (batting team)</option>
          {battingPlayers.map((player) => (
            <option key={`bat-${player.name}`} value={player.name}>
              {player.name}
            </option>
          ))}
        </select>
        <select
          className="rounded-md border px-3 py-2"
          value={form.nonStrikerName}
          onChange={(e) => setForm((p) => ({ ...p, nonStrikerName: e.target.value }))}
        >
          <option value="">Select non-striker (batting team)</option>
          {availableNonStrikerPlayers.map((player) => (
            <option key={`non-${player.name}`} value={player.name}>
              {player.name}
            </option>
          ))}
        </select>
        <select
          className="rounded-md border px-3 py-2"
          value={form.bowlerName}
          onChange={(e) => setForm((p) => ({ ...p, bowlerName: e.target.value }))}
        >
          <option value="">Select opening bowler (bowling team)</option>
          {bowlingPlayers.map((player) => (
            <option key={`bowl-${player.name}`} value={player.name}>
              {player.name}
            </option>
          ))}
        </select>
      </div>
      <button onClick={createTournamentMatch} className="mt-4 rounded-md bg-primary px-4 py-2 font-semibold text-primary-foreground">
        Create Match
      </button>
    </div>
  );
}
