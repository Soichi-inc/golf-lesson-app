"use server";

import type { RoundScore } from "@/types";
import { requireUser, handleActionError } from "@/lib/auth/guard";
import {
  readScoreRecords,
  writeScoreRecords,
  toRoundScore,
  type ScoreRecord,
} from "@/lib/data/scores";

/** スコアを追加（所有者本人のみ） */
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

    // 日付バリデーション
    const playedAtDate = new Date(input.playedAt);
    if (isNaN(playedAtDate.getTime())) {
      return { success: false, error: "プレー日の形式が正しくありません" };
    }

    // スコアレンジバリデーション
    if (
      !Number.isFinite(input.score) ||
      input.score < 50 ||
      input.score > 300
    ) {
      return { success: false, error: "スコアは50〜300の範囲で入力してください" };
    }

    const records = await readScoreRecords();
    const id = `score-${Date.now()}`;
    const now = new Date().toISOString();

    const record: ScoreRecord = {
      id,
      userId: user.id,
      playedAt: playedAtDate.toISOString(),
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
    await writeScoreRecords(records);
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
  const records = await readScoreRecords();
  return records.filter((r) => r.userId === userId).map(toRoundScore);
}

/** スコア削除（所有者本人のみ） */
export async function deleteScore(
  scoreId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await requireUser();
    const records = await readScoreRecords();
    const target = records.find((r) => r.id === scoreId);
    if (!target) return { success: false, error: "スコアが見つかりません" };

    if (user.role !== "ADMIN" && target.userId !== user.id) {
      return { success: false, error: "このスコアは削除できません" };
    }

    const filtered = records.filter((r) => r.id !== scoreId);
    await writeScoreRecords(filtered);
    return { success: true };
  } catch (e) {
    return handleActionError(e, "スコアの削除に失敗しました");
  }
}
