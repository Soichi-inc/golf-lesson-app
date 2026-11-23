"use server";

import type { InstructorNote } from "@/types";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendMail } from "@/lib/email/send";
import { instructorNoteEmail } from "@/lib/email/templates";
import { requireAdmin, requireUser, handleActionError } from "@/lib/auth/guard";
import {
  readInstructorNoteRecords,
  updateInstructorNoteRecords,
  toInstructorNote,
  applyInstructorNoteUpdate,
  type InstructorNoteRecord,
} from "@/lib/data/instructorNotes";
import { newRecordId } from "@/lib/data/ids";

/** 管理者用: ユーザーの全指導メモを取得（ADMIN専用） */
export async function getInstructorNotesByUserId(
  userId: string
): Promise<InstructorNote[]> {
  await requireAdmin();
  const records = await readInstructorNoteRecords();
  return records
    .filter((r) => r.userId === userId)
    .map(toInstructorNote)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

/** 顧客用: 公開メモのみ取得（所有者本人またはADMIN） */
export async function getPublicInstructorNotesByUserId(
  userId: string
): Promise<InstructorNote[]> {
  const user = await requireUser();
  if (user.role !== "ADMIN" && user.id !== userId) {
    throw new Error("他のユーザーのメモは閲覧できません");
  }
  const records = await readInstructorNoteRecords();
  return records
    .filter((r) => r.userId === userId && !r.isPrivate)
    .map(toInstructorNote)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

/** 指導メモを追加（ADMIN専用） */
export async function addInstructorNote(input: {
  userId: string;
  content: string;
  isPrivate: boolean;
}): Promise<{ success: boolean; note?: InstructorNote; error?: string }> {
  try {
    await requireAdmin();
    if (!input.content.trim()) {
      return { success: false, error: "内容を入力してください" };
    }

    const record = await updateInstructorNoteRecords((records) => {
      const now = new Date();
      const created: InstructorNoteRecord = {
        id: newRecordId("inote", records, now.getTime()),
        userId: input.userId,
        lessonRecordId: null,
        content: input.content,
        isPrivate: input.isPrivate,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      };
      return { data: [...records, created], result: created };
    });

    // 公開メモの場合、顧客にメール通知
    if (!input.isPrivate) {
      await sendNotificationEmail(input.userId, input.content).catch(console.error);
    }

    return { success: true, note: toInstructorNote(record) };
  } catch (e) {
    return handleActionError(e, "指導メモの保存に失敗しました");
  }
}

/**
 * 指導メモを更新（ADMIN専用）
 *
 * 顧客への通知メールは「非公開→公開」に切り替えたときだけ送る
 * （その時点で初めて顧客に見えるようになるため、新規の公開メモと同じ扱い）。
 * 公開済みメモの書き直しでは再通知しない。
 */
export async function updateInstructorNote(
  noteId: string,
  input: { content: string; isPrivate: boolean }
): Promise<{ success: boolean; note?: InstructorNote; error?: string }> {
  try {
    await requireAdmin();
    if (!input.content.trim()) {
      return { success: false, error: "内容を入力してください" };
    }

    const result = await updateInstructorNoteRecords((records) => {
      const applied = applyInstructorNoteUpdate(
        records,
        noteId,
        { content: input.content, isPrivate: input.isPrivate },
        new Date().toISOString()
      );
      return applied ? { data: applied.records, result: applied } : { result: null };
    });
    if (!result) {
      // 編集中に、別の画面でこのメモが削除された場合。書いた文章を失わないよう先にコピーを案内する
      return {
        success: false,
        error:
          "このメモは見つかりませんでした（別の画面で削除された可能性があります）。本文をコピーしてから、画面を再読み込みしてご確認ください。",
      };
    }

    if (result.becamePublic) {
      await sendNotificationEmail(result.updated.userId, result.updated.content).catch(
        console.error
      );
    }

    return { success: true, note: toInstructorNote(result.updated) };
  } catch (e) {
    return handleActionError(
      e,
      "指導メモの更新に失敗しました。少し待ってからもう一度お試しください。"
    );
  }
}

/** 指導メモを削除（ADMIN専用） */
export async function deleteInstructorNote(
  noteId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();
    await updateInstructorNoteRecords((records) => ({
      data: records.filter((r) => r.id !== noteId),
      result: null,
    }));
    return { success: true };
  } catch (e) {
    return handleActionError(e, "指導メモの削除に失敗しました");
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
