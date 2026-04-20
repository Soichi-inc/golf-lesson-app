"use server";

import { sendMail, notifyAdmin } from "@/lib/email/send";
import { reservationRequestEmail, adminNewReservationEmail } from "@/lib/email/templates";
import { getScheduleById } from "@/app/actions/schedules";
import { requireUser, handleActionError } from "@/lib/auth/guard";
import {
  insertReservationRecord,
  getAllReservations,
} from "@/lib/data/reservations";

type ReserveInput = {
  scheduleId: string;
  concern?: string;
  agreedCancelPolicy: boolean;
  agreedPhotoPost: boolean;
  optionSwingVideo?: boolean;
};

export async function submitReservation(input: ReserveInput) {
  try {
    // 1. ログインユーザーを取得
    const user = await requireUser();

    // 2. スケジュールを取得
    const schedule = await getScheduleById(input.scheduleId);
    if (!schedule || !schedule.isAvailable) {
      return { success: false, error: "指定のスケジュールが見つかりません" };
    }

    // 3. 定員チェック
    const allReservations = await getAllReservations();
    const activeReservationsForSchedule = allReservations.filter(
      (r) => r.scheduleId === input.scheduleId && r.status !== "CANCELLED"
    );
    if (activeReservationsForSchedule.length >= schedule.maxAttendees) {
      return { success: false, error: "このスケジュールは満員です" };
    }

    // 重複予約チェック（同じユーザーが同じスケジュールに既に予約していないか）
    const duplicate = activeReservationsForSchedule.find((r) => r.userId === user.id);
    if (duplicate) {
      return { success: false, error: "このスケジュールには既に予約済みです" };
    }

    // 4. 予約データを保存（userId/email はサーバー側で確定したユーザー情報を使用、クライアントから受け取らない）
    const userName = user.fullName;
    const userEmail = user.email;

    const saveResult = await insertReservationRecord({
      userId: user.id,
      userName,
      userEmail,
      scheduleId: input.scheduleId,
      concern: input.concern,
      agreedCancelPolicy: input.agreedCancelPolicy,
      agreedPhotoPost: input.agreedPhotoPost,
      optionSwingVideo: input.optionSwingVideo,
    });

    if (!saveResult.success) {
      return { success: false, error: saveResult.error };
    }

    // 5. ユーザーにメール送信（非ブロッキング）
    const displayName = userName || userEmail || "お客様";

    if (userEmail) {
      const { subject, html } = reservationRequestEmail(schedule, input.concern);
      await sendMail({ to: userEmail, subject, html }).catch((err) => {
        console.error("[submitReservation] user mail error:", err);
      });
    }

    // 6. 管理者にメール通知（非ブロッキング）
    const adminTemplate = adminNewReservationEmail(
      schedule,
      displayName,
      userEmail || "不明",
      input.concern
    );
    await notifyAdmin(adminTemplate).catch(console.error);

    return { success: true, reservationId: saveResult.reservationId };
  } catch (e) {
    return handleActionError(e, "予約処理に失敗しました");
  }
}
