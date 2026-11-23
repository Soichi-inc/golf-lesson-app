"use server";

import type { Drill, DrillStatus } from "@/types";
import { requireAdmin, requireUser, handleActionError } from "@/lib/auth/guard";
import {
  readDrillRecords,
  updateDrillRecords,
  toDrill,
  type DrillRecord,
} from "@/lib/data/drills";
import { newRecordId } from "@/lib/data/ids";

/** ドリルを追加（ADMIN専用） */
export async function addDrill(input: {
  userId: string;
  title: string;
  description?: string;
  videoUrl?: string;
  dueDate?: string;
}): Promise<{ success: boolean; drill?: Drill; error?: string }> {
  try {
    await requireAdmin();
    const record = await updateDrillRecords((records) => {
      const now = new Date();
      const created: DrillRecord = {
        id: newRecordId("drill", records, now.getTime()),
        userId: input.userId,
        lessonRecordId: null,
        title: input.title,
        description: input.description || null,
        videoUrl: input.videoUrl || null,
        status: "ASSIGNED",
        dueDate: input.dueDate || null,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      };
      return { data: [...records, created], result: created };
    });

    return { success: true, drill: toDrill(record) };
  } catch (e) {
    return handleActionError(e, "ドリルの保存に失敗しました");
  }
}

/** 特定ユーザーのドリル一覧を取得（所有者本人またはADMIN） */
export async function getDrillsByUserId(userId: string): Promise<Drill[]> {
  const user = await requireUser();
  if (user.role !== "ADMIN" && user.id !== userId) {
    throw new Error("他のユーザーのドリルは閲覧できません");
  }
  const records = await readDrillRecords();
  return records.filter((r) => r.userId === userId).map(toDrill);
}

/** 全ドリルを取得（ADMIN専用） */
export async function getDrills(): Promise<Drill[]> {
  await requireAdmin();
  const records = await readDrillRecords();
  return records.map(toDrill);
}

/** ドリルのステータスを更新（所有者本人またはADMIN） */
export async function updateDrillStatus(
  drillId: string,
  newStatus: DrillStatus
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await requireUser();
    return await updateDrillRecords<{ success: boolean; error?: string }>((records) => {
      const target = records.find((r) => r.id === drillId);
      if (!target) return { result: { success: false, error: "ドリルが見つかりません" } };

      if (user.role !== "ADMIN" && target.userId !== user.id) {
        return { result: { success: false, error: "このドリルは更新できません" } };
      }
      const updated: DrillRecord = {
        ...target,
        status: newStatus,
        updatedAt: new Date().toISOString(),
      };
      return {
        data: records.map((r) => (r.id === drillId ? updated : r)),
        result: { success: true },
      };
    });
  } catch (e) {
    return handleActionError(e, "ステータス更新に失敗しました");
  }
}

/** ドリルを削除（ADMIN専用） */
export async function deleteDrill(
  drillId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();
    await updateDrillRecords((records) => ({
      data: records.filter((r) => r.id !== drillId),
      result: null,
    }));
    return { success: true };
  } catch (e) {
    return handleActionError(e, "ドリルの削除に失敗しました");
  }
}
