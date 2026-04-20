"use server";

import type { RoundScore } from "@/types";
import { readJsonFromStorage, writeJsonToStorage } from "@/lib/storage";
import { requireUser, handleActionError } from "@/lib/auth/guard";

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

/** スコアを追加（所有者本人のみ。userIdは常にログインユーザーにforce） */
export async function addScore(input: {
  playedAt: string;
  courseName: string;
  score: number;
  outScore?: number | null;
  inScore?: number | null;
  putts?: number | null;
  memo?: string | null;
}): Promise<{ success: boolean; score?: RoundScore; error?: string }> {
  try {
    const user = await requireUser();
    const records = await readScores();
    const id = `score-${Date.now()}`;
    const now = new Date().toISOString();

    const record: ScoreRecord = {
      id,
      userId: user.id,
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
    return handleActionError(e, "スコアの保存に失敗しました");
  }
}

/** ユーザーのスコア取得（所有者本人またはADMIN） */
export async function getScoresByUserId(userId: string): Promise<RoundScore[]> {
  const user = await requireUser();
  if (user.role !== "ADMIN" && user.id !== userId) {
    throw new Error("他のユーザーのスコアは閲覧できません");
  }
  const records = await readScores();
  return records.filter((r) => r.userId === userId).map(toRoundScore);
}

/** 内部用: authなし */
export async function _getScoresByUserIdInternal(userId: string): Promise<RoundScore[]> {
  const records = await readScores();
  return records.filter((r) => r.userId === userId).map(toRoundScore);
}

/** スコア削除（所有者本人のみ） */
export async function deleteScore(
  scoreId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await requireUser();
    const records = await readScores();
    const target = records.find((r) => r.id === scoreId);
    if (!target) return { success: false, error: "スコアが見つかりません" };

    if (user.role !== "ADMIN" && target.userId !== user.id) {
      return { success: false, error: "このスコアは削除できません" };
    }

    const filtered = records.filter((r) => r.id !== scoreId);
    await writeScores(filtered);
    return { success: true };
  } catch (e) {
    return handleActionError(e, "スコアの削除に失敗しました");
  }
}
