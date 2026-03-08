"use server";

import type { UserNote } from "@/types";
import { readJsonFromStorage, writeJsonToStorage } from "@/lib/storage";

const FILE_PATH = "notes.json";

type NoteRecord = {
  id: string;
  userId: string;
  title: string | null;
  content: string;
  category: string | null;
  createdAt: string;
  updatedAt: string;
};

async function readNotes(): Promise<NoteRecord[]> {
  return readJsonFromStorage<NoteRecord[]>(FILE_PATH, []);
}

async function writeNotes(records: NoteRecord[]): Promise<void> {
  await writeJsonToStorage(FILE_PATH, records);
}

function toUserNote(r: NoteRecord): UserNote {
  return {
    ...r,
    createdAt: new Date(r.createdAt),
    updatedAt: new Date(r.updatedAt),
  };
}

export async function addNote(input: {
  userId: string;
  title?: string;
  content: string;
  category?: string;
}): Promise<{ success: boolean; note?: UserNote; error?: string }> {
  try {
    const records = await readNotes();
    const id = `unote-${Date.now()}`;
    const now = new Date().toISOString();

    const record: NoteRecord = {
      id,
      userId: input.userId,
      title: input.title || null,
      content: input.content,
      category: input.category || null,
      createdAt: now,
      updatedAt: now,
    };

    records.push(record);
    await writeNotes(records);
    return { success: true, note: toUserNote(record) };
  } catch (e) {
    console.error("[addNote]", e);
    return { success: false, error: "ノートの保存に失敗しました" };
  }
}

export async function getNotesByUserId(userId: string): Promise<UserNote[]> {
  const records = await readNotes();
  return records.filter((r) => r.userId === userId).map(toUserNote);
}

export async function deleteNote(
  noteId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const records = await readNotes();
    const filtered = records.filter((r) => r.id !== noteId);
    await writeNotes(filtered);
    return { success: true };
  } catch (e) {
    console.error("[deleteNote]", e);
    return { success: false, error: "ノートの削除に失敗しました" };
  }
}
