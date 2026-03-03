"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function PracticeMatchCreator() {
  const router = useRouter();
  const [form, setForm] = useState({
    teamAName: "",
    teamBName: "",
    battingSide: "A",
    batterName: "",
    nonStrikerName: "",
    bowlerName: "",
    overs: 10,
    ballsPerOver: 6,
    numberOfPlayers: 11,
  });
  const teamALabel = form.teamAName.trim() || "Team A";
  const teamBLabel = form.teamBName.trim() || "Team B";

  const create = async () => {
    const res = await fetch("/api/matches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "practice", ...form }),
    });
    const body = await res.json();
    if (!res.ok) {
      toast.error(body.error ?? "Could not create practice match");
      return;
    }
    toast.success("Practice match started");
    const query = new URLSearchParams({
      practice: "1",
      batter: body.defaults?.batterName || form.batterName,
      nonStriker: body.defaults?.nonStrikerName || form.nonStrikerName,
      bowler: body.defaults?.bowlerName || form.bowlerName,
    });
    router.push(`/matches/${body.match.id}?${query.toString()}`);
  };

  return (
    <div className="rounded-xl border bg-white p-5 shadow-sm dark:bg-slate-900">
      <h2 className="mb-4 text-lg font-semibold">Create Practice Match</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <input className="rounded-md border px-3 py-2" placeholder="Team A" value={form.teamAName} onChange={(e) => setForm((p) => ({ ...p, teamAName: e.target.value }))} />
        <input className="rounded-md border px-3 py-2" placeholder="Team B" value={form.teamBName} onChange={(e) => setForm((p) => ({ ...p, teamBName: e.target.value }))} />
        <select className="rounded-md border px-3 py-2" value={form.battingSide} onChange={(e) => setForm((p) => ({ ...p, battingSide: e.target.value }))}>
          <option value="A">{teamALabel} bats first</option>
          <option value="B">{teamBLabel} bats first</option>
        </select>
        <div className="rounded-md border px-3 py-2 text-sm text-slate-600 dark:text-slate-300">
          Bowling first: {form.battingSide === "A" ? teamBLabel : teamALabel}
        </div>
        <input className="rounded-md border px-3 py-2" placeholder="Opening Batter Name" value={form.batterName} onChange={(e) => setForm((p) => ({ ...p, batterName: e.target.value }))} />
        <input className="rounded-md border px-3 py-2" placeholder="Non-striker Batter Name" value={form.nonStrikerName} onChange={(e) => setForm((p) => ({ ...p, nonStrikerName: e.target.value }))} />
        <input className="rounded-md border px-3 py-2" placeholder="Opening Bowler Name" value={form.bowlerName} onChange={(e) => setForm((p) => ({ ...p, bowlerName: e.target.value }))} />
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-600 dark:text-slate-300">Total Overs</label>
          <input type="number" className="w-full rounded-md border px-3 py-2" value={form.overs} onChange={(e) => setForm((p) => ({ ...p, overs: Number(e.target.value) }))} placeholder="How many overs for this match?" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-600 dark:text-slate-300">Balls Per Over</label>
          <input type="number" className="w-full rounded-md border px-3 py-2" value={form.ballsPerOver} onChange={(e) => setForm((p) => ({ ...p, ballsPerOver: Number(e.target.value) }))} placeholder="How many balls in one over?" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-600 dark:text-slate-300">Players Per Team</label>
          <input type="number" className="w-full rounded-md border px-3 py-2" value={form.numberOfPlayers} onChange={(e) => setForm((p) => ({ ...p, numberOfPlayers: Number(e.target.value) }))} placeholder="How many players per team?" />
        </div>
      </div>
      <button onClick={create} className="mt-4 rounded-md bg-primary px-4 py-2 font-semibold text-primary-foreground">
        Start Practice
      </button>
    </div>
  );
}
