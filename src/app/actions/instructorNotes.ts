"use server";

import type { InstructorNote } from "@/types";
import { readJsonFromStorage, writeJsonToStorage } from "@/lib/storage";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendMail } from "@/lib/email/send";
import { instructorNoteEmail } from "@/lib/email/templates";

const FILE_PATH = "instructor-notes.json";

type NoteRecord = {
  id: string;
  userId: string;
  lessonRecordId: string | null;
  content: string;
  isPrivate: boolean;
  createdAt: string;
  updatedAt: string;
};

async function readNotes(): Promise<NoteRecord[]> {
  return readJsonFromStorage<NoteRecord[]>(FILE_PATH, []);
}

async function writeNotes(records: NoteRecord[]): Promise<void> {
  await writeJsonToStorage(FILE_PATH, records);
}

function toInstructorNote(r: NoteRecord): InstructorNote {
  return {
    ...r,
    createdAt: new Date(r.createdAt),
    updatedAt: new Date(r.updatedAt),
  };
}

/** 管理者用: ユーザーの全指導メモを取得 */
export async function getInstructorNotesByUserId(
  userId: string
): Promise<InstructorNote[]> {
  const records = await readNotes();
  return records.filter((r) => r.userId === userId).map(toInstructorNote);
}

/** 顧客用: 公開メモのみ取得 */
export async function getPublicInstructorNotesByUserId(
  userId: string
): Promise<InstructorNote[]> {
  const records = await readNotes();
  return records
    .filter((r) => r.userId === userId && !r.isPrivate)
    .map(toInstructorNote);
}

/** 指導メモを追加 */
export async function addInstructorNote(input: {
  userId: string;
  content: string;
  isPrivate: boolean;
}): Promise<{ success: boolean; note?: InstructorNote; error?: string }> {
  try {
    const records = await readNotes();
    const id = `inote-${Date.now()}`;
    const now = new Date().toISOString();

    const record: NoteRecord = {
      id,
      userId: input.userId,
      lessonRecordId: null,
      content: input.content,
      isPrivate: input.isPrivate,
      createdAt: now,
      updatedAt: now,
    };

    records.push(record);
    await writeNotes(records);

    // 公開メモの場合、顧客にメール通知
    if (!input.isPrivate) {
      sendNotificationEmail(input.userId, input.content).catch(console.error);
    }

    return { success: true, note: toInstructorNote(record) };
  } catch (e) {
    console.error("[addInstructorNote]", e);
    return { success: false, error: "指導メモの保存に失敗しました" };
  }
}

/** 指導メモを削除 */
export async function deleteInstructorNote(
  noteId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const records = await readNotes();
    const filtered = records.filter((r) => r.id !== noteId);
    await writeNotes(filtered);
    return { success: true };
  } catch (e) {
    console.error("[deleteInstructorNote]", e);
    return { success: false, error: "指導メモの削除に失敗しました" };
  }
}

/** 顧客にメール通知（内部ヘルパー） */
async function sendNotificationEmail(userId: string, content: string) {
  const admin = createAdminClient();
  const {
    data: { user },
  } = await admin.auth.admin.getUserById(userId);

  if (!user?.email) return;

  const customerName = user.user_metadata?.full_name || user.email;
  const { subject, html } = instructorNoteEmail(customerName, content);
  await sendMail({ to: user.email, subject, html });
}
