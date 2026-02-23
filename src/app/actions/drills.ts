"use server";

import type { Drill, DrillStatus } from "@/types";
import { readJsonFromStorage, writeJsonToStorage } from "@/lib/storage";

// ---------------------------------------------------------------------------
// Supabase Storage based drill storage
// ---------------------------------------------------------------------------

const FILE_PATH = "drills.json";

/** JSON内の保存形式（Dateはstring） */
type DrillRecord = {
  id: string;
  userId: string;
  lessonRecordId: string | null;
  title: string;
  description: string | null;
  videoUrl: string | null;
  status: DrillStatus;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
};

/** レコードを読み込み */
async function readDrills(): Promise<DrillRecord[]> {
  return readJsonFromStorage<DrillRecord[]>(FILE_PATH, []);
}

/** レコードを保存 */
async function writeDrills(records: DrillRecord[]): Promise<void> {
  await writeJsonToStorage(FILE_PATH, records);
}

/** Record → Drill変換 */
function toDrill(r: DrillRecord): Drill {
  return {
    ...r,
    dueDate: r.dueDate ? new Date(r.dueDate) : null,
    createdAt: new Date(r.createdAt),
    updatedAt: new Date(r.updatedAt),
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** ドリルを追加 */
export async function addDrill(input: {
  userId: string;
  title: string;
  description?: string;
  videoUrl?: string;
  dueDate?: string; // ISO日付文字列
}): Promise<{ success: boolean; drill?: Drill; error?: string }> {
  try {
    const records = await readDrills();
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
    await writeDrills(records);

    return { success: true, drill: toDrill(record) };
  } catch (e) {
    console.error("[addDrill]", e);
    return { success: false, error: "ドリルの保存に失敗しました" };
  }
}

/** 特定ユーザーのドリル一覧を取得 */
export async function getDrillsByUserId(userId: string): Promise<Drill[]> {
  const records = await readDrills();
  return records.filter((r) => r.userId === userId).map(toDrill);
}

/** 全ドリルを取得 */
export async function getDrills(): Promise<Drill[]> {
  const records = await readDrills();
  return records.map(toDrill);
}

/** ドリルのステータスを更新 */
export async function updateDrillStatus(
  drillId: string,
  newStatus: DrillStatus
): Promise<{ success: boolean; error?: string }> {
  try {
    const records = await readDrills();
    const idx = records.findIndex((r) => r.id === drillId);
    if (idx === -1) return { success: false, error: "ドリルが見つかりません" };

    records[idx].status = newStatus;
    records[idx].updatedAt = new Date().toISOString();
    await writeDrills(records);

    return { success: true };
  } catch (e) {
    console.error("[updateDrillStatus]", e);
    return { success: false, error: "ステータス更新に失敗しました" };
  }
}

/** ドリルを削除 */
export async function deleteDrill(
  drillId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const records = await readDrills();
    const filtered = records.filter((r) => r.id !== drillId);
    await writeDrills(filtered);
    return { success: true };
  } catch (e) {
    console.error("[deleteDrill]", e);
    return { success: false, error: "ドリルの削除に失敗しました" };
  }
}
