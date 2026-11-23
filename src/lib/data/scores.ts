import "server-only";
import type { RoundScore } from "@/types";
import {
  readJsonFromStorage,
  updateJsonInStorage,
  type UpdateOutcome,
} from "@/lib/storage";

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
  return readJsonFromStorage<ScoreRecord[]>(FILE_PATH, [], { shape: "array" });
}

/**
 * スコアデータを書き換える。
 * 排他ロックの中で最新の内容を読み、mutate の結果を保存する（詳細は `@/lib/storage`）。
 */
export function updateScoreRecords<R>(
  mutate: (records: ScoreRecord[]) => UpdateOutcome<ScoreRecord[], R>
): Promise<R> {
  return updateJsonInStorage<ScoreRecord[], R>(FILE_PATH, [], mutate, { shape: "array" });
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
