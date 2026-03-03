-- CreateEnum
CREATE TYPE "TeamSide" AS ENUM ('A', 'B');

-- AlterTable
ALTER TABLE "matches" ADD COLUMN     "battingSide" "TeamSide" NOT NULL DEFAULT 'A',
ADD COLUMN     "firstInningsBalls" INTEGER,
ADD COLUMN     "firstInningsBattingSide" "TeamSide",
ADD COLUMN     "firstInningsRuns" INTEGER,
ADD COLUMN     "firstInningsWickets" INTEGER,
ADD COLUMN     "winnerTeamName" TEXT;

-- AlterTable
ALTER TABLE "score_events" ADD COLUMN     "innings" INTEGER NOT NULL DEFAULT 1;
