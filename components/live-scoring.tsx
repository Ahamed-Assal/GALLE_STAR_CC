"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { computeRunRate, getOverLabel } from "@/lib/score";

const actions = [
  { label: "0", eventType: "dot_ball" },
  { label: "+1", eventType: "run_1" },
  { label: "+2", eventType: "run_2" },
  { label: "+3", eventType: "run_3" },
  { label: "+4", eventType: "run_4" },
  { label: "+6", eventType: "run_6" },
  { label: "Wide", eventType: "wide" },
  { label: "No Ball", eventType: "no_ball" },
  { label: "Wicket", eventType: "wicket" },
  { label: "Out", eventType: "out" },
  { label: "Undo", eventType: "undo" },
] as const;

type MatchView = {
  id: string;
  mode: "practice" | "tournament";
  teamAName: string;
  teamBName: string;
  battingSide: "A" | "B";
  innings: number;
  firstInningsBattingSide: "A" | "B" | null;
  firstInningsRuns: number | null;
  firstInningsWickets: number | null;
  firstInningsBalls: number | null;
  currentRuns: number;
  currentWickets: number;
  currentBalls: number;
  overs: number;
  ballsPerOver: number;
  targetRuns: number | null;
  winnerTeamName: string | null;
  createdById: string;
  scorer1Id: string;
  scorer2Id: string;
  status: "live" | "completed";
};

type Event = {
  id: string;
  eventType: string;
  innings: number;
  note?: string | null;
  createdAt: string;
  user: { id?: string; name: string | null; email: string };
};

type PlayerPickerState = {
  title: string;
  options: string[];
  selected: string;
  resolve: (value: string | null) => void;
};

export function LiveScoring({
  match,
  initialEvents,
  currentUserId,
  teamAPlayers,
  teamBPlayers,
  initialBatterName,
  initialNonStrikerName,
  initialBowlerName,
}: {
  match: MatchView;
  initialEvents: Event[];
  currentUserId: string;
  teamAPlayers: string[];
  teamBPlayers: string[];
  initialBatterName?: string;
  initialNonStrikerName?: string;
  initialBowlerName?: string;
}) {
  const renderEventNote = (note: string) => {
    const parts = note.split("|").map((part) => part.trim()).filter(Boolean);
    return parts.map((part, idx) => {
      const [labelRaw, ...valueParts] = part.split(":");
      const label = (labelRaw ?? "").trim();
      const value = valueParts.join(":").trim();
      return (
        <span key={`${part}-${idx}`}>
          {idx > 0 && <span className="mx-1 text-slate-400 dark:text-slate-500">|</span>}
          {label && value ? (
            <>
              <span className="font-medium text-violet-700 dark:text-violet-300">{label}:</span>
              <span className="ml-1 font-medium text-emerald-700 dark:text-emerald-300">{value}</span>
            </>
          ) : (
            <span className="font-medium text-emerald-700 dark:text-emerald-300">{part}</span>
          )}
        </span>
      );
    });
  };

  const router = useRouter();
  const [events, setEvents] = useState(initialEvents);
  const [matchState, setMatchState] = useState(match);
  const [selectedStriker, setSelectedStriker] = useState(initialBatterName ?? "");
  const [selectedNonStriker, setSelectedNonStriker] = useState(initialNonStrikerName ?? "");
  const [selectedBowler, setSelectedBowler] = useState(initialBowlerName ?? "");
  const [lockedStriker, setLockedStriker] = useState(initialBatterName ?? "");
  const [lockedNonStriker, setLockedNonStriker] = useState(initialNonStrikerName ?? "");
  const [lockedBowler, setLockedBowler] = useState(initialBowlerName ?? "");
  const [canChangeBatter, setCanChangeBatter] = useState(
    !(initialBatterName && initialBatterName.trim()),
  );
  const [canChangeBowler, setCanChangeBowler] = useState(!(initialBowlerName && initialBowlerName.trim()));
  const [busy, setBusy] = useState(false);
  const [playerPicker, setPlayerPicker] = useState<PlayerPickerState | null>(null);

  const pickPlayerFromOptions = useCallback((title: string, options: string[]) => {
    return new Promise<string | null>((resolve) => {
      if (options.length === 0) {
        toast.error("No available players to choose");
        resolve(null);
        return;
      }
      setPlayerPicker({
        title,
        options,
        selected: options[0],
        resolve,
      });
    });
  }, []);

  const inningsLockEvent = useMemo(
    () => events.find((event) => event.innings === matchState.innings && event.eventType !== "undo"),
    [events, matchState.innings],
  );
  const inningsLockUserId = inningsLockEvent?.user?.id ?? "";
  const canScore = matchState.mode === "practice"
    ? Boolean(currentUserId)
    : Boolean(currentUserId) &&
      (inningsLockUserId ? inningsLockUserId === currentUserId : currentUserId === matchState.createdById);

  const battingOptions = useMemo(
    () => (matchState.battingSide === "A" ? teamAPlayers : teamBPlayers),
    [matchState.battingSide, teamAPlayers, teamBPlayers],
  );
  const strikerOptions = useMemo(
    () =>
      battingOptions.filter(
        (name) => name.trim().toLowerCase() !== selectedNonStriker.trim().toLowerCase(),
      ),
    [battingOptions, selectedNonStriker],
  );
  const nonStrikerOptions = useMemo(
    () =>
      battingOptions.filter((name) => name.trim().toLowerCase() !== selectedStriker.trim().toLowerCase()),
    [battingOptions, selectedStriker],
  );
  const bowlerOptions = useMemo(
    () => (matchState.battingSide === "A" ? teamBPlayers : teamAPlayers),
    [matchState.battingSide, teamAPlayers, teamBPlayers],
  );
  const battingTeamName = matchState.battingSide === "A" ? matchState.teamAName : matchState.teamBName;
  const bowlingTeamName = matchState.battingSide === "A" ? matchState.teamBName : matchState.teamAName;
  const firstInningsTeamName = matchState.firstInningsBattingSide
    ? matchState.firstInningsBattingSide === "A"
      ? matchState.teamAName
      : matchState.teamBName
    : null;
  const secondInningsTeamName = matchState.firstInningsBattingSide
    ? matchState.firstInningsBattingSide === "A"
      ? matchState.teamBName
      : matchState.teamAName
    : null;

  const overLabel = useMemo(
    () => getOverLabel(matchState.currentBalls, matchState.ballsPerOver),
    [matchState.currentBalls, matchState.ballsPerOver],
  );

  const runRate = useMemo(
    () => computeRunRate(matchState.currentRuns, matchState.currentBalls, matchState.ballsPerOver),
    [matchState.currentRuns, matchState.currentBalls, matchState.ballsPerOver],
  );

  const refreshData = useCallback(async () => {
    const [eventsRes, matchesRes] = await Promise.all([
      fetch(`/api/matches/${matchState.id}/events`, { cache: "no-store" }),
      fetch("/api/matches", { cache: "no-store" }),
    ]);

    if (eventsRes.ok) {
      const body = await eventsRes.json();
      setEvents(body.events);
    }

    if (matchesRes.ok) {
      const body = await matchesRes.json();
      const found = body.matches.find((m: MatchView) => m.id === matchState.id);
      if (found) {
        setMatchState(found);
      }
    }
  }, [matchState.id]);

  useEffect(() => {
    if (!supabase) {
      return;
    }
    const sb = supabase;

    const channel = sb
      .channel(`match-${matchState.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "score_events", filter: `match_id=eq.${matchState.id}` },
        () => {
          refreshData();
        },
      )
      .subscribe();

    return () => {
      sb.removeChannel(channel);
    };
  }, [matchState.id, refreshData]);

  useEffect(() => {
    if (matchState.status !== "live") {
      return;
    }
    // Fallback polling so viewers still get updates
    // even when realtime subscription is unavailable.
    const timer = window.setInterval(() => {
      refreshData();
    }, 3000);
    return () => window.clearInterval(timer);
  }, [matchState.status, refreshData]);

  const pushEvent = async (eventType: string) => {
    const normalizedEventType = eventType === "out" ? "wicket" : eventType;
    let dismissalType: "run_out" | "catch_out" | undefined;
    let dismissedBatterRole: "striker" | "non-striker" = "striker";

    if (eventType === "out") {
      const outType = window
        .prompt("Out type? Type 'run out' or 'catch out'", "run out")
        ?.trim()
        .toLowerCase();
      if (!outType) {
        return;
      }
      if (outType === "run out" || outType === "runout" || outType === "run_out") {
        dismissalType = "run_out";
        const whichBatsman = window
          .prompt("Run out: which batsman is out? Type 'striker' or 'non-striker'", "striker")
          ?.trim()
          .toLowerCase();
        if (!whichBatsman || (whichBatsman !== "striker" && whichBatsman !== "non-striker")) {
          toast.error("Please type 'striker' or 'non-striker'");
          return;
        }
        dismissedBatterRole = whichBatsman;
      } else if (outType === "catch out" || outType === "catchout" || outType === "catch_out") {
        dismissalType = "catch_out";
        dismissedBatterRole = "striker";
      } else {
        toast.error("Please type 'run out' or 'catch out'");
        return;
      }
    }

    if (normalizedEventType !== "undo") {
      if (!selectedStriker.trim()) {
        toast.error("Select striker before scoring");
        return;
      }
      if (!selectedNonStriker.trim()) {
        toast.error("Select non-striker before scoring");
        return;
      }
      if (!selectedBowler.trim()) {
        toast.error("Select a bowler before scoring");
        return;
      }
      if (selectedStriker.trim() === selectedNonStriker.trim()) {
        toast.error("Striker and non-striker must be different");
        return;
      }
      if (matchState.mode === "tournament") {
        if (!battingOptions.includes(selectedStriker.trim())) {
          toast.error("Striker must be selected from batting team members");
          return;
        }
        if (!battingOptions.includes(selectedNonStriker.trim())) {
          toast.error("Non-striker must be selected from batting team members");
          return;
        }
        if (!bowlerOptions.includes(selectedBowler.trim())) {
          toast.error("Bowler must be selected from bowling team members");
          return;
        }
      }
      if (
        !canChangeBatter &&
        (lockedStriker || lockedNonStriker) &&
        (selectedStriker.trim() !== lockedStriker || selectedNonStriker.trim() !== lockedNonStriker)
      ) {
        toast.error("Batter can only change after wicket or retired action");
        setSelectedStriker(lockedStriker);
        setSelectedNonStriker(lockedNonStriker);
        return;
      }
      if (!canChangeBowler && lockedBowler && selectedBowler.trim() !== lockedBowler) {
        toast.error("Bowler can only change after over completion");
        setSelectedBowler(lockedBowler);
        return;
      }
    }

    setBusy(true);
    const dismissedBatterNameForEvent =
      normalizedEventType === "wicket"
        ? dismissedBatterRole === "striker"
          ? selectedStriker.trim()
          : selectedNonStriker.trim()
        : undefined;

    const res = await fetch(`/api/matches/${matchState.id}/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventType: normalizedEventType,
        batterName: selectedStriker.trim() || undefined,
        nonStrikerName: selectedNonStriker.trim() || undefined,
        bowlerName: selectedBowler.trim() || undefined,
        dismissalType,
        dismissedBatterName: dismissedBatterNameForEvent || undefined,
      }),
    });
    const body = await res.json();

    if (!res.ok) {
      toast.error(body.error ?? "Could not update score");
      setBusy(false);
      return;
    }

    if (normalizedEventType === "undo") {
      // Undo can invalidate previously locked batter/bowler flow state.
      // Keep the last known player selections so fields don't become empty.
      const strikerFallback = selectedStriker.trim() || lockedStriker.trim();
      const nonStrikerFallback = selectedNonStriker.trim() || lockedNonStriker.trim();
      const bowlerFallback = selectedBowler.trim() || lockedBowler.trim();

      if (strikerFallback) {
        setSelectedStriker(strikerFallback);
      }
      if (nonStrikerFallback) {
        setSelectedNonStriker(nonStrikerFallback);
      }
      if (bowlerFallback) {
        setSelectedBowler(bowlerFallback);
      }

      setCanChangeBatter(!(strikerFallback && nonStrikerFallback));
      setCanChangeBowler(!bowlerFallback);
      setLockedStriker(strikerFallback);
      setLockedNonStriker(nonStrikerFallback);
      setLockedBowler(bowlerFallback);
      toast.message("Undo applied. Player selections restored.");
      await refreshData();
      router.refresh();
      setBusy(false);
      return;
    }

    const matchWillComplete = Boolean(body.matchCompleted) || body.match?.status === "completed";
    const inningsWillSwitch = Boolean(body.inningsSwitched);

    const previousBalls = matchState.currentBalls;
    const nextBalls = body.match?.currentBalls ?? previousBalls;
    let strikerForFlow = selectedStriker.trim();
    let nonStrikerForFlow = selectedNonStriker.trim();

    if (normalizedEventType !== "undo") {
      if (canChangeBatter && strikerForFlow && nonStrikerForFlow) {
        setLockedStriker(strikerForFlow);
        setLockedNonStriker(nonStrikerForFlow);
        setCanChangeBatter(false);
      }
      if (canChangeBowler && selectedBowler.trim()) {
        setLockedBowler(selectedBowler.trim());
        setCanChangeBowler(false);
      }
    }

    if (normalizedEventType === "wicket" && !matchWillComplete && !inningsWillSwitch) {
      setCanChangeBatter(true);
      const dismissedBatterName =
        dismissedBatterRole === "striker" ? strikerForFlow.trim() : nonStrikerForFlow.trim();
      const blockedName =
        dismissedBatterRole === "striker" ? nonStrikerForFlow.trim() : strikerForFlow.trim();
      const replacementOptions = battingOptions.filter((playerName) => {
        const normalized = playerName.trim().toLowerCase();
        if (!normalized) return false;
        if (normalized === dismissedBatterName.toLowerCase()) return false;
        if (normalized === blockedName.toLowerCase()) return false;
        return true;
      });
      const nextBatter =
        matchState.mode === "tournament"
          ? await pickPlayerFromOptions(
              dismissedBatterRole === "striker"
                ? "Out! Choose next striker"
                : "Out! Choose next non-striker",
              replacementOptions,
            )
          : window.prompt(
              dismissedBatterRole === "striker"
                ? "Out! Enter next striker name"
                : "Out! Enter next non-striker name",
              "",
            );
      if (nextBatter && nextBatter.trim()) {
        const rawName = nextBatter.trim();
        const tournamentSelectedName =
          matchState.mode === "tournament"
            ? replacementOptions.find(
                (option) => option.trim().toLowerCase() === rawName.toLowerCase(),
              )
            : null;
        const name = tournamentSelectedName ?? rawName;

        if (name.toLowerCase() === dismissedBatterName.toLowerCase()) {
          toast.error("Dismissed batsman cannot be selected again immediately");
        } else {
          if (dismissedBatterRole === "striker") {
            if (name.toLowerCase() === nonStrikerForFlow.trim().toLowerCase()) {
              toast.error("Striker and non-striker must be different");
              setCanChangeBatter(true);
            } else {
              strikerForFlow = name;
              setLockedStriker(name);
              setLockedNonStriker(nonStrikerForFlow);
              setCanChangeBatter(false);
            }
          } else if (name.toLowerCase() === strikerForFlow.trim().toLowerCase()) {
            toast.error("Striker and non-striker must be different");
            setCanChangeBatter(true);
          } else {
            nonStrikerForFlow = name;
            setLockedStriker(strikerForFlow);
            setLockedNonStriker(name);
            setCanChangeBatter(false);
          }
        }
      } else {
        toast.message("Set next batter before next ball");
      }
    }

    const oddRunScored = normalizedEventType === "run_1" || normalizedEventType === "run_3";
    if (oddRunScored) {
      const currentStriker = strikerForFlow;
      const currentNonStriker = nonStrikerForFlow;
      strikerForFlow = currentNonStriker;
      nonStrikerForFlow = currentStriker;
      if (!canChangeBatter) {
        setLockedStriker(strikerForFlow);
        setLockedNonStriker(nonStrikerForFlow);
      }
    }

    const overFinished =
      normalizedEventType !== "undo" &&
      nextBalls > previousBalls &&
      nextBalls % matchState.ballsPerOver === 0;

    if (overFinished && !matchWillComplete && !inningsWillSwitch) {
      const currentStriker = strikerForFlow;
      const currentNonStriker = nonStrikerForFlow;
      strikerForFlow = currentNonStriker;
      nonStrikerForFlow = currentStriker;
      if (!canChangeBatter) {
        setLockedStriker(strikerForFlow);
        setLockedNonStriker(nonStrikerForFlow);
      }
      setCanChangeBowler(true);
      if (matchState.mode === "tournament") {
        toast.message("Over finished. Select next bowler from Team B list.");
      } else {
        const nextBowler = window.prompt("Over finished. Enter next bowler name", "");
        if (nextBowler && nextBowler.trim()) {
          const name = nextBowler.trim();
          setSelectedBowler(name);
          setLockedBowler(name);
          setCanChangeBowler(false);
        } else {
          toast.message("Set next bowler before next ball");
        }
      }
    }

    setSelectedStriker(strikerForFlow);
    setSelectedNonStriker(nonStrikerForFlow);

    if (body.deleted) {
      toast.success("Practice match completed and removed");
      router.push("/practice");
      return;
    }

    if (body.inningsSwitched) {
      const switchedMatch = body.match as MatchView | undefined;
      const switchedBattingSide = switchedMatch?.battingSide ?? matchState.battingSide;
      const switchedBattingOptions = switchedBattingSide === "A" ? teamAPlayers : teamBPlayers;
      const switchedBowlingOptions = switchedBattingSide === "A" ? teamBPlayers : teamAPlayers;

      toast.success("Innings changed: batting and bowling sides switched");
      if (switchedMatch) {
        setMatchState(switchedMatch);
      }
      setCanChangeBatter(true);
      setCanChangeBowler(true);
      setLockedStriker("");
      setLockedNonStriker("");
      setLockedBowler("");

      const nextStriker = window.prompt("Innings changed. Enter new striker name", "");
      const nextNonStriker = window.prompt("Enter new non-striker name", "");
      const nextBowler = window.prompt("Enter new bowler name", "");

      if (
        nextStriker &&
        nextStriker.trim() &&
        nextNonStriker &&
        nextNonStriker.trim() &&
        nextBowler &&
        nextBowler.trim()
      ) {
        const strikerName = nextStriker.trim();
        const nonStrikerName = nextNonStriker.trim();
        const bowlerName = nextBowler.trim();

        if (strikerName === nonStrikerName) {
          toast.error("Striker and non-striker must be different");
        } else if (
          switchedMatch?.mode === "tournament" &&
          (!switchedBattingOptions.includes(strikerName) ||
            !switchedBattingOptions.includes(nonStrikerName) ||
            !switchedBowlingOptions.includes(bowlerName))
        ) {
          toast.error("Use valid team members for new innings players");
        } else {
          setSelectedStriker(strikerName);
          setSelectedNonStriker(nonStrikerName);
          setSelectedBowler(bowlerName);
          setLockedStriker(strikerName);
          setLockedNonStriker(nonStrikerName);
          setLockedBowler(bowlerName);
          setCanChangeBatter(false);
          setCanChangeBowler(false);
        }
      } else {
        toast.message("Set striker, non-striker and bowler before next ball");
      }
    }

    if (body.matchCompleted && body.winnerTeamName) {
      toast.success(`Match completed. Winner: ${body.winnerTeamName}`);
    }

    await refreshData();
    router.refresh();
    setBusy(false);
  };

  const endMatchManually = async () => {
    const rawWinner = window
      .prompt(
        `End match now. Choose winner:\n- ${matchState.teamAName}\n- ${matchState.teamBName}\n(You can also type A or B)`,
        matchState.currentRuns > 0 ? battingTeamName : matchState.teamAName,
      )
      ?.trim();

    if (!rawWinner) {
      return;
    }

    const winnerTeamName =
      rawWinner.toLowerCase() === "a"
        ? matchState.teamAName
        : rawWinner.toLowerCase() === "b"
          ? matchState.teamBName
          : rawWinner.toLowerCase() === matchState.teamAName.toLowerCase()
            ? matchState.teamAName
            : rawWinner.toLowerCase() === matchState.teamBName.toLowerCase()
              ? matchState.teamBName
              : null;

    if (!winnerTeamName) {
      toast.error(`Please choose "${matchState.teamAName}" or "${matchState.teamBName}"`);
      return;
    }

    setBusy(true);
    const res = await fetch(`/api/matches/${matchState.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ winnerTeamName }),
    });
    const body = await res.json().catch(() => ({}));

    if (!res.ok) {
      toast.error(body.error ?? "Could not end match");
      setBusy(false);
      return;
    }

    toast.success(`Match ended. Winner: ${winnerTeamName}`);
    await refreshData();
    router.refresh();
    setBusy(false);
  };

  return (
    <div className="space-y-5">
      {matchState.status === "completed" && matchState.winnerTeamName && (
        <section className="rounded-2xl border border-primary/40 bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 p-5 text-center shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Match Result</p>
          <h2 className="mt-2 text-2xl font-black text-primary sm:text-3xl">
            Winner: {matchState.winnerTeamName}
          </h2>
          <div className="mt-4 flex justify-center">
            <button
              type="button"
              onClick={() => router.push(matchState.mode === "practice" ? "/practice" : "/matches")}
              className="rounded-md border border-primary/40 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary hover:bg-primary/20"
            >
              Create New Match
            </button>
          </div>
        </section>
      )}

      <section className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl bg-primary/10 p-4">
          <p className="text-xs uppercase tracking-wider text-gray-500">Total</p>
          <p className="text-2xl font-black">{matchState.currentRuns}/{matchState.currentWickets}</p>
        </div>
        <div className="rounded-xl bg-primary/10 p-4">
          <p className="text-xs uppercase tracking-wider text-gray-500">Overs</p>
          <p className="text-2xl font-black">{overLabel}</p>
        </div>
        <div className="rounded-xl bg-primary/10 p-4">
          <p className="text-xs uppercase tracking-wider text-gray-500">Run Rate</p>
          <p className="text-2xl font-black">{runRate}</p>
        </div>
      </section>

      <section className="rounded-xl border bg-white p-4 dark:bg-slate-900">
        <p className="text-sm">Innings: <span className="font-semibold">{matchState.innings}</span></p>
        <p className="text-sm">Batting: <span className="font-semibold">{battingTeamName}</span></p>
        <p className="text-sm">Bowling: <span className="font-semibold">{bowlingTeamName}</span></p>
        {matchState.status === "completed" && matchState.winnerTeamName && (
          <p className="mt-2 text-sm">Winner: <span className="font-semibold text-primary">{matchState.winnerTeamName}</span></p>
        )}
      </section>

      <section className="rounded-xl border bg-white p-4 dark:bg-slate-900">
        <h3 className="mb-3 text-lg font-semibold">Innings Summary</h3>
        {firstInningsTeamName ? (
          <div className="space-y-2 text-sm">
            <p>
              <span className="font-semibold">{firstInningsTeamName}</span> (1st inns):{" "}
              <span className="font-semibold">
                {matchState.firstInningsRuns ?? 0}/{matchState.firstInningsWickets ?? 0}
              </span>{" "}
              in{" "}
              {getOverLabel(matchState.firstInningsBalls ?? 0, matchState.ballsPerOver)} overs
            </p>
            <p>
              <span className="font-semibold">{secondInningsTeamName}</span> (2nd inns):{" "}
              <span className="font-semibold">
                {matchState.currentRuns}/{matchState.currentWickets}
              </span>{" "}
              in {getOverLabel(matchState.currentBalls, matchState.ballsPerOver)} overs
            </p>
            {matchState.targetRuns && (
              <p>
                Target: <span className="font-semibold">{matchState.targetRuns}</span>
              </p>
            )}
          </div>
        ) : (
          <p className="text-sm text-slate-600 dark:text-slate-300">
            First innings in progress. Summary appears after innings switch.
          </p>
        )}
      </section>

      {matchState.targetRuns && (
        <section className="rounded-xl border p-4">
          <p className="text-sm">Target: <span className="font-semibold">{matchState.targetRuns}</span></p>
        </section>
      )}

      {canScore && (
        <section className="rounded-xl border bg-white p-4 dark:bg-slate-900">
          <h2 className="mb-3 text-lg font-semibold">Live Controls</h2>
          <div className="mb-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                const whichBatsman = window
                  .prompt("Retired: Which batsman to change? Type 'striker' or 'non-striker'", "striker")
                  ?.trim()
                  .toLowerCase();

                if (!whichBatsman || (whichBatsman !== "striker" && whichBatsman !== "non-striker")) {
                  toast.error("Please type 'striker' or 'non-striker'");
                  return;
                }

                const nextBatter = window.prompt("Enter new batsman name", "");
                if (!nextBatter || !nextBatter.trim()) {
                  toast.message("No batsman name entered");
                  return;
                }

                const name = nextBatter.trim();
                if (matchState.mode === "tournament" && !battingOptions.includes(name)) {
                  toast.error("New batsman must be from batting team members");
                  return;
                }

                if (whichBatsman === "striker") {
                  if (name === selectedNonStriker.trim()) {
                    toast.error("Striker and non-striker must be different");
                    return;
                  }
                  setSelectedStriker(name);
                  setLockedStriker(name);
                  setLockedNonStriker(selectedNonStriker.trim());
                } else {
                  if (name === selectedStriker.trim()) {
                    toast.error("Striker and non-striker must be different");
                    return;
                  }
                  setSelectedNonStriker(name);
                  setLockedStriker(selectedStriker.trim());
                  setLockedNonStriker(name);
                }

                setCanChangeBatter(false);
              }}
              disabled={busy || matchState.status === "completed"}
              className="rounded-md border border-primary/40 px-3 py-2 text-sm hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Retired / Change Batter
            </button>
            <button
              type="button"
              onClick={endMatchManually}
              disabled={busy || matchState.status === "completed"}
              className="rounded-md border border-red-400 px-3 py-2 text-sm text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:hover:bg-red-950/30"
            >
              End Match
            </button>
          </div>
          <div className="mb-3 grid gap-2 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-gray-500">Striker</label>
              {matchState.mode === "tournament" ? (
                <select
                  value={selectedStriker}
                  onChange={(e) => setSelectedStriker(e.target.value)}
                  disabled={!canChangeBatter || busy || matchState.status === "completed"}
                  className="w-full rounded-md border px-3 py-2 text-sm"
                >
                  <option value="">Select striker from batting team members</option>
                  {strikerOptions.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  list="batter-options"
                  value={selectedStriker}
                  onChange={(e) => setSelectedStriker(e.target.value)}
                  disabled={!canChangeBatter || busy || matchState.status === "completed"}
                  placeholder="Choose or type striker name"
                  className="w-full rounded-md border px-3 py-2 text-sm"
                />
              )}
              <p className="mt-1 text-xs text-slate-500">
                {canChangeBatter ? "You can set batter pair now." : `Locked striker: ${lockedStriker || "Not set"}`}
              </p>
              <datalist id="batter-options">
                {battingOptions.map((name) => (
                  <option key={name} value={name} />
                ))}
              </datalist>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-gray-500">Non-striker</label>
              {matchState.mode === "tournament" ? (
                <select
                  value={selectedNonStriker}
                  onChange={(e) => setSelectedNonStriker(e.target.value)}
                  disabled={!canChangeBatter || busy || matchState.status === "completed"}
                  className="w-full rounded-md border px-3 py-2 text-sm"
                >
                  <option value="">Select non-striker from batting team members</option>
                  {nonStrikerOptions.map((name) => (
                    <option key={`ns-${name}`} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  list="batter-options"
                  value={selectedNonStriker}
                  onChange={(e) => setSelectedNonStriker(e.target.value)}
                  disabled={!canChangeBatter || busy || matchState.status === "completed"}
                  placeholder="Choose or type non-striker name"
                  className="w-full rounded-md border px-3 py-2 text-sm"
                />
              )}
              <p className="mt-1 text-xs text-slate-500">
                {canChangeBatter ? "Set second batter now." : `Locked non-striker: ${lockedNonStriker || "Not set"}`}
              </p>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-gray-500">Bowler</label>
              {matchState.mode === "tournament" ? (
                <select
                  value={selectedBowler}
                  onChange={(e) => setSelectedBowler(e.target.value)}
                  disabled={!canChangeBowler || busy || matchState.status === "completed"}
                  className="w-full rounded-md border px-3 py-2 text-sm"
                >
                  <option value="">Select bowler from bowling team members</option>
                  {bowlerOptions.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  list="bowler-options"
                  value={selectedBowler}
                  onChange={(e) => setSelectedBowler(e.target.value)}
                  disabled={!canChangeBowler || busy || matchState.status === "completed"}
                  placeholder="Choose or type bowler name"
                  className="w-full rounded-md border px-3 py-2 text-sm"
                />
              )}
              <p className="mt-1 text-xs text-slate-500">
                {canChangeBowler ? "Over finished: choose next bowler." : `Locked bowler: ${lockedBowler || "Not set"}`}
              </p>
              <datalist id="bowler-options">
                {bowlerOptions.map((name) => (
                  <option key={name} value={name} />
                ))}
              </datalist>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            {actions.map((action) => (
              <button
                key={action.eventType}
                disabled={busy || matchState.status === "completed"}
                onClick={() => pushEvent(action.eventType)}
                className="rounded-md border px-3 py-2 text-sm hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {action.label}
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="rounded-xl border bg-white p-4 dark:bg-slate-900">
        <h3 className="mb-3 text-lg font-semibold">Ball-by-ball timeline</h3>
        <ul className="space-y-2">
          {events.map((event) => (
            <li key={event.id} className="rounded-md border px-3 py-2 text-sm">
              <span className="font-semibold uppercase">{event.eventType.replaceAll("_", " ")}</span>
              {event.note && <span className="ml-2 text-xs">{renderEventNote(event.note)}</span>}
            </li>
          ))}
        </ul>
      </section>

      {playerPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl border bg-white p-4 shadow-xl dark:bg-slate-900">
            <h3 className="text-lg font-semibold">{playerPicker.title}</h3>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              Select from team members
            </p>
            <select
              className="mt-3 w-full rounded-md border px-3 py-2 text-sm"
              value={playerPicker.selected}
              onChange={(e) =>
                setPlayerPicker((prev) =>
                  prev
                    ? {
                        ...prev,
                        selected: e.target.value,
                      }
                    : prev,
                )
              }
            >
              {playerPicker.options.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                className="rounded-md border px-3 py-2 text-sm"
                onClick={() => {
                  playerPicker.resolve(null);
                  setPlayerPicker(null);
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground"
                onClick={() => {
                  playerPicker.resolve(playerPicker.selected);
                  setPlayerPicker(null);
                }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
