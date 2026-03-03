import { ScoreEventType } from "@prisma/client";

export const scoreDeltas: Record<
  ScoreEventType,
  { runs: number; wickets: number; balls: number }
> = {
  dot_ball: { runs: 0, wickets: 0, balls: 1 },
  run_1: { runs: 1, wickets: 0, balls: 1 },
  run_2: { runs: 2, wickets: 0, balls: 1 },
  run_3: { runs: 3, wickets: 0, balls: 1 },
  run_4: { runs: 4, wickets: 0, balls: 1 },
  run_6: { runs: 6, wickets: 0, balls: 1 },
  wicket: { runs: 0, wickets: 1, balls: 1 },
  wide: { runs: 1, wickets: 0, balls: 0 },
  no_ball: { runs: 1, wickets: 0, balls: 0 },
  undo: { runs: 0, wickets: 0, balls: 0 },
};

export function getOverLabel(currentBalls: number, ballsPerOver: number) {
  const overs = Math.floor(currentBalls / ballsPerOver);
  const balls = currentBalls % ballsPerOver;
  return `${overs}.${balls}`;
}

export function computeRunRate(runs: number, balls: number, ballsPerOver: number) {
  if (balls === 0) {
    return "0.00";
  }
  const oversFloat = balls / ballsPerOver;
  return (runs / oversFloat).toFixed(2);
}
