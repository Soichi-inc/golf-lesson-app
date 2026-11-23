import "server-only";
import type { UserNote } from "@/types";
import {
  readJsonFromStorage,
  updateJsonInStorage,
  type UpdateOutcome,
} from "@/lib/storage";

const FILE_PATH = "notes.json";

export type NoteRecord = {
  id: string;
  userId: string;
  title: string | null;
  content: string;
  category: string | null;
  createdAt: string;
  updatedAt: string;
};

export async function readNoteRecords(): Promise<NoteRecord[]> {
  return readJsonFromStorage<NoteRecord[]>(FILE_PATH, [], { shape: "array" });
}

/**
 * ノートデータを書き換える。
 * 排他ロックの中で最新の内容を読み、mutate の結果を保存する（詳細は `@/lib/storage`）。
 */
export function updateNoteRecords<R>(
  mutate: (records: NoteRecord[]) => UpdateOutcome<NoteRecord[], R>
): Promise<R> {
  return updateJsonInStorage<NoteRecord[], R>(FILE_PATH, [], mutate, { shape: "array" });
}

export function toUserNote(r: NoteRecord): UserNote {
  return {
    ...r,
    createdAt: new Date(r.createdAt),
    updatedAt: new Date(r.updatedAt),
  };
}

export async function getNotesByUserId(userId: string): Promise<UserNote[]> {
  const records = await readNoteRecords();
  return records.filter((r) => r.userId === userId).map(toUserNote);
}
