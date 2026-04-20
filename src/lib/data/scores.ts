import "server-only";
import type { RoundScore } from "@/types";
import { readJsonFromStorage, writeJsonToStorage } from "@/lib/storage";

const FILE_PATH = "scores.json";

export type ScoreRecord = {
  id: string;
  userId: string;
  playedAt: string;
  courseName: string;
  score: number;
  outScore: number | null;
  inScore: number | null;
  fairwayHit: number | null;
  putts: number | null;
  memo: string | null;
  createdAt: string;
  updatedAt: string;
};

export async function readScoreRecords(): Promise<ScoreRecord[]> {
  return readJsonFromStorage<ScoreRecord[]>(FILE_PATH, []);
}

export async function writeScoreRecords(records: ScoreRecord[]): Promise<void> {
  await writeJsonToStorage(FILE_PATH, records);
}

export function toRoundScore(r: ScoreRecord): RoundScore {
  return {
    ...r,
    playedAt: new Date(r.playedAt),
    createdAt: new Date(r.createdAt),
    updatedAt: new Date(r.updatedAt),
  };
}

export async function getScoresByUserId(userId: string): Promise<RoundScore[]> {
  const records = await readScoreRecords();
  return records.filter((r) => r.userId === userId).map(toRoundScore);
}
