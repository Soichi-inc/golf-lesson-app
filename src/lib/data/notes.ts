import "server-only";
import type { UserNote } from "@/types";
import { readJsonFromStorage, writeJsonToStorage } from "@/lib/storage";

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
  return readJsonFromStorage<NoteRecord[]>(FILE_PATH, []);
}

export async function writeNoteRecords(records: NoteRecord[]): Promise<void> {
  await writeJsonToStorage(FILE_PATH, records);
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
