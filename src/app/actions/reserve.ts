"use server";

import { createClient } from "@/lib/supabase/server";
import { sendMail, notifyAdmin } from "@/lib/email/send";
import { reservationRequestEmail, adminNewReservationEmail } from "@/lib/email/templates";
import { getScheduleById } from "@/app/actions/schedules";
import { addReservation } from "@/app/actions/reservations";

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

  // 2. スケジュールを取得（Supabase Storageから）
  const schedule = await getScheduleById(input.scheduleId);
  if (!schedule || !schedule.isAvailable) {
    return { success: false, error: "指定のスケジュールが見つかりません" };
  }

  // 3. 予約データをJSONファイルに保存
  const userName = user.user_metadata?.full_name || null;
  const userEmail = user.email || "";

  const saveResult = await addReservation({
    userId: user.id,
    userName,
    userEmail,
    scheduleId: input.scheduleId,
    concern: input.concern,
    agreedCancelPolicy: input.agreedCancelPolicy,
    agreedPhotoPost: input.agreedPhotoPost,
  });

  if (!saveResult.success) {
    return { success: false, error: saveResult.error };
  }

  // 4. ユーザーにメール送信
  const displayName = userName || userEmail || "お客様";

  if (userEmail) {
    const { subject, html } = reservationRequestEmail(schedule, input.concern);
    const mailResult = await sendMail({ to: userEmail, subject, html });
    if (!mailResult.success) {
      console.error("[submitReservation] ユーザーメール送信失敗:", mailResult.error);
    }
  }

  // 5. 管理者にメール通知
  const adminTemplate = adminNewReservationEmail(
    schedule,
    displayName,
    userEmail || "不明",
    input.concern
  );
  await notifyAdmin(adminTemplate);

  return { success: true, reservationId: saveResult.reservationId };
}
