import "server-only";
import type { Drill, DrillStatus } from "@/types";
import { readJsonFromStorage, writeJsonToStorage } from "@/lib/storage";

const FILE_PATH = "drills.json";

export type DrillRecord = {
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

export async function readDrillRecords(): Promise<DrillRecord[]> {
  return readJsonFromStorage<DrillRecord[]>(FILE_PATH, []);
}

export async function writeDrillRecords(records: DrillRecord[]): Promise<void> {
  await writeJsonToStorage(FILE_PATH, records);
}

export function toDrill(r: DrillRecord): Drill {
  return {
    ...r,
    dueDate: r.dueDate ? new Date(r.dueDate) : null,
    createdAt: new Date(r.createdAt),
    updatedAt: new Date(r.updatedAt),
  };
}

export async function getDrillsByUserId(userId: string): Promise<Drill[]> {
  const records = await readDrillRecords();
  return records.filter((r) => r.userId === userId).map(toDrill);
}
