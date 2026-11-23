"use server";

import type { RoundScore } from "@/types";
import { requireUser, handleActionError } from "@/lib/auth/guard";
import {
  readScoreRecords,
  updateScoreRecords,
  toRoundScore,
  type ScoreRecord,
} from "@/lib/data/scores";
import { newRecordId } from "@/lib/data/ids";

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

    const record = await updateScoreRecords((records) => {
      const now = new Date();
      const created: ScoreRecord = {
        id: newRecordId("score", records, now.getTime()),
        userId: user.id,
        playedAt: playedAtDate.toISOString(),
        courseName: input.courseName,
        score: input.score,
        outScore: input.outScore ?? null,
        inScore: input.inScore ?? null,
        fairwayHit: null,
        putts: input.putts ?? null,
        memo: input.memo ?? null,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      };
      return { data: [...records, created], result: created };
    });
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
    return await updateScoreRecords<{ success: boolean; error?: string }>((records) => {
      const target = records.find((r) => r.id === scoreId);
      if (!target) return { result: { success: false, error: "スコアが見つかりません" } };

      if (user.role !== "ADMIN" && target.userId !== user.id) {
        return { result: { success: false, error: "このスコアは削除できません" } };
      }
      return {
        data: records.filter((r) => r.id !== scoreId),
        result: { success: true },
      };
    });
  } catch (e) {
    return handleActionError(e, "スコアの削除に失敗しました");
  }
}
