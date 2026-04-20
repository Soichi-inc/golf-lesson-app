"use server";

import type { Drill, DrillStatus } from "@/types";
import { requireAdmin, requireUser, handleActionError } from "@/lib/auth/guard";
import {
  readDrillRecords,
  writeDrillRecords,
  toDrill,
  type DrillRecord,
} from "@/lib/data/drills";

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
    const records = await readDrillRecords();
    const id = `drill-${Date.now()}`;
    const now = new Date().toISOString();

    const record: DrillRecord = {
      id,
      userId: input.userId,
      lessonRecordId: null,
      title: input.title,
      description: input.description || null,
      videoUrl: input.videoUrl || null,
      status: "ASSIGNED",
      dueDate: input.dueDate || null,
      createdAt: now,
      updatedAt: now,
    };

    records.push(record);
    await writeDrillRecords(records);

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
    const records = await readDrillRecords();
    const idx = records.findIndex((r) => r.id === drillId);
    if (idx === -1) return { success: false, error: "ドリルが見つかりません" };

    if (user.role !== "ADMIN" && records[idx].userId !== user.id) {
      return { success: false, error: "このドリルは更新できません" };
    }

    records[idx].status = newStatus;
    records[idx].updatedAt = new Date().toISOString();
    await writeDrillRecords(records);

    return { success: true };
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
    const records = await readDrillRecords();
    const filtered = records.filter((r) => r.id !== drillId);
    await writeDrillRecords(filtered);
    return { success: true };
  } catch (e) {
    return handleActionError(e, "ドリルの削除に失敗しました");
  }
}
