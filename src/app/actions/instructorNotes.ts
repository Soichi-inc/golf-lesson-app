"use server";

import { prisma } from "@/lib/prisma";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendMail } from "@/lib/email/send";
import { instructorNoteEmail } from "@/lib/email/templates";
import type { InstructorNote } from "@/types";

/** 管理者用: ユーザーの全指導メモを取得 */
export async function getInstructorNotesByUserId(
  userId: string
): Promise<InstructorNote[]> {
  const notes = await prisma.instructorNote.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  return notes.map((n: Record<string, unknown>) => ({
    id: n.id as string,
    userId: n.userId as string,
    lessonRecordId: (n.lessonRecordId as string) || null,
    content: n.content as string,
    isPrivate: n.isPrivate as boolean,
    createdAt: new Date(n.createdAt as string),
    updatedAt: new Date(n.updatedAt as string),
  }));
}

/** 顧客用: 公開メモのみ取得 */
export async function getPublicInstructorNotesByUserId(
  userId: string
): Promise<InstructorNote[]> {
  const notes = await prisma.instructorNote.findMany({
    where: { userId, isPrivate: false },
    orderBy: { createdAt: "desc" },
  });

  return notes.map((n: Record<string, unknown>) => ({
    id: n.id as string,
    userId: n.userId as string,
    lessonRecordId: (n.lessonRecordId as string) || null,
    content: n.content as string,
    isPrivate: n.isPrivate as boolean,
    createdAt: new Date(n.createdAt as string),
    updatedAt: new Date(n.updatedAt as string),
  }));
}

/** 指導メモを追加 */
export async function addInstructorNote(input: {
  userId: string;
  content: string;
  isPrivate: boolean;
}): Promise<{ success: boolean; note?: InstructorNote; error?: string }> {
  try {
    const created = await prisma.instructorNote.create({
      data: {
        userId: input.userId,
        content: input.content,
        isPrivate: input.isPrivate,
      },
    });

    const note: InstructorNote = {
      id: created.id,
      userId: created.userId,
      lessonRecordId: created.lessonRecordId || null,
      content: created.content,
      isPrivate: created.isPrivate,
      createdAt: new Date(created.createdAt),
      updatedAt: new Date(created.updatedAt),
    };

    // 公開メモの場合、顧客にメール通知
    if (!input.isPrivate) {
      sendNotificationEmail(input.userId, input.content).catch(console.error);
    }

    return { success: true, note };
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
    await prisma.instructorNote.delete({ where: { id: noteId } });
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
