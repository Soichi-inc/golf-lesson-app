"use server";

import { createClient } from "@/lib/supabase/server";
import { sendMail, notifyAdmin } from "@/lib/email/send";
import { reservationRequestEmail, adminNewReservationEmail } from "@/lib/email/templates";
import { mockSchedules } from "@/lib/mock/data";

type ReserveInput = {
  scheduleId: string;
  concern?: string;
  agreedCancelPolicy: boolean;
  agreedPhotoPost: boolean;
};

export async function submitReservation(input: ReserveInput) {
  // 1. ログインユーザーを取得
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "ログインが必要です" };
  }

  // 2. スケジュールを取得（現在はモックデータから）
  const schedule = mockSchedules.find((s) => s.id === input.scheduleId && s.isAvailable);
  if (!schedule) {
    return { success: false, error: "指定のスケジュールが見つかりません" };
  }

  // 3. 予約データを保存（将来はDBに保存）
  // TODO: Prisma で reservation テーブルに INSERT
  const reservationId = `rsv-${Date.now()}`;
  console.log("[submitReservation]", {
    id: reservationId,
    userId: user.id,
    scheduleId: input.scheduleId,
    concern: input.concern,
    agreedCancelPolicy: input.agreedCancelPolicy,
    agreedPhotoPost: input.agreedPhotoPost,
    status: "PENDING",
  });

  // 4. ユーザーにメール送信
  const userName = user.user_metadata?.full_name || user.email || "お客様";
  const userEmail = user.email;

  if (userEmail) {
    const { subject, html } = reservationRequestEmail(schedule, input.concern);
    const result = await sendMail({ to: userEmail, subject, html });
    if (!result.success) {
      console.error("[submitReservation] ユーザーメール送信失敗:", result.error);
    }
  }

  // 5. 管理者にメール通知
  const adminTemplate = adminNewReservationEmail(
    schedule,
    userName,
    userEmail || "不明",
    input.concern
  );
  await notifyAdmin(adminTemplate);

  return { success: true, reservationId };
}
