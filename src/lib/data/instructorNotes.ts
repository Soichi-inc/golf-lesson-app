import "server-only";
import type { InstructorNote } from "@/types";
import { readJsonFromStorage, writeJsonToStorage } from "@/lib/storage";

const FILE_PATH = "instructor-notes.json";

export type InstructorNoteRecord = {
  id: string;
  userId: string;
  lessonRecordId: string | null;
  content: string;
  isPrivate: boolean;
  createdAt: string;
  updatedAt: string;
};

export async function readInstructorNoteRecords(): Promise<InstructorNoteRecord[]> {
  return readJsonFromStorage<InstructorNoteRecord[]>(FILE_PATH, []);
}

export async function writeInstructorNoteRecords(
  records: InstructorNoteRecord[]
): Promise<void> {
  await writeJsonToStorage(FILE_PATH, records);
}

export function toInstructorNote(r: InstructorNoteRecord): InstructorNote {
  return {
    ...r,
    createdAt: new Date(r.createdAt),
    updatedAt: new Date(r.updatedAt),
  };
}

export async function getInstructorNotesByUserId(
  userId: string
): Promise<InstructorNote[]> {
  const records = await readInstructorNoteRecords();
  return records.filter((r) => r.userId === userId).map(toInstructorNote);
}
