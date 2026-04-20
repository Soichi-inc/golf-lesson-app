"use server";

import type { UserNote } from "@/types";
import { requireUser, handleActionError } from "@/lib/auth/guard";
import {
  readNoteRecords,
  writeNoteRecords,
  toUserNote,
  type NoteRecord,
} from "@/lib/data/notes";

/** ノートを追加（所有者本人のみ） */
export async function addNote(input: {
  title?: string;
  content: string;
  category?: string;
}): Promise<{ success: boolean; note?: UserNote; error?: string }> {
  try {
    const user = await requireUser();
    const records = await readNoteRecords();
    const id = `unote-${Date.now()}`;
    const now = new Date().toISOString();

    const record: NoteRecord = {
      id,
      userId: user.id,
      title: input.title || null,
      content: input.content,
      category: input.category || null,
      createdAt: now,
      updatedAt: now,
    };

    records.push(record);
    await writeNoteRecords(records);
    return { success: true, note: toUserNote(record) };
  } catch (e) {
    return handleActionError(e, "ノートの保存に失敗しました");
  }
}

/** ユーザーのノート取得（所有者本人またはADMIN） */
export async function getNotesByUserId(userId: string): Promise<UserNote[]> {
  const user = await requireUser();
  if (user.role !== "ADMIN" && user.id !== userId) {
    throw new Error("他のユーザーのノートは閲覧できません");
  }
  const records = await readNoteRecords();
  return records.filter((r) => r.userId === userId).map(toUserNote);
}

/** ノート削除（所有者本人のみ） */
export async function deleteNote(
  noteId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await requireUser();
    const records = await readNoteRecords();
    const target = records.find((r) => r.id === noteId);
    if (!target) return { success: false, error: "ノートが見つかりません" };

    if (user.role !== "ADMIN" && target.userId !== user.id) {
      return { success: false, error: "このノートは削除できません" };
    }

    const filtered = records.filter((r) => r.id !== noteId);
    await writeNoteRecords(filtered);
    return { success: true };
  } catch (e) {
    return handleActionError(e, "ノートの削除に失敗しました");
  }
}
