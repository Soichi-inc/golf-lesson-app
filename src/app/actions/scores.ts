"use server";

import type { RoundScore } from "@/types";
import { readJsonFromStorage, writeJsonToStorage } from "@/lib/storage";

const FILE_PATH = "scores.json";

type ScoreRecord = {
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

async function readScores(): Promise<ScoreRecord[]> {
  return readJsonFromStorage<ScoreRecord[]>(FILE_PATH, []);
}

async function writeScores(records: ScoreRecord[]): Promise<void> {
  await writeJsonToStorage(FILE_PATH, records);
}

function toRoundScore(r: ScoreRecord): RoundScore {
  return {
    ...r,
    playedAt: new Date(r.playedAt),
    createdAt: new Date(r.createdAt),
    updatedAt: new Date(r.updatedAt),
  };
}

export async function addScore(input: {
  userId: string;
  playedAt: string;
  courseName: string;
  score: number;
  outScore?: number | null;
  inScore?: number | null;
  putts?: number | null;
  memo?: string | null;
}): Promise<{ success: boolean; score?: RoundScore; error?: string }> {
  try {
    const records = await readScores();
    const id = `score-${Date.now()}`;
    const now = new Date().toISOString();

    const record: ScoreRecord = {
      id,
      userId: input.userId,
      playedAt: new Date(input.playedAt).toISOString(),
      courseName: input.courseName,
      score: input.score,
      outScore: input.outScore ?? null,
      inScore: input.inScore ?? null,
      fairwayHit: null,
      putts: input.putts ?? null,
      memo: input.memo ?? null,
      createdAt: now,
      updatedAt: now,
    };

    records.push(record);
    await writeScores(records);
    return { success: true, score: toRoundScore(record) };
  } catch (e) {
    console.error("[addScore]", e);
    return { success: false, error: "スコアの保存に失敗しました" };
  }
}

export async function getScoresByUserId(userId: string): Promise<RoundScore[]> {
  const records = await readScores();
  return records.filter((r) => r.userId === userId).map(toRoundScore);
}

export async function deleteScore(
  scoreId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const records = await readScores();
    const filtered = records.filter((r) => r.id !== scoreId);
    await writeScores(filtered);
    return { success: true };
  } catch (e) {
    console.error("[deleteScore]", e);
    return { success: false, error: "スコアの削除に失敗しました" };
  }
}
