"use server";

import { sendMail, notifyAdmin } from "@/lib/email/send";
import { reservationRequestEmail, adminNewReservationEmail } from "@/lib/email/templates";
import { getScheduleById } from "@/app/actions/schedules";
import { requireUser, handleActionError } from "@/lib/auth/guard";
import {
  insertReservationRecord,
  getAllReservations,
} from "@/lib/data/reservations";
import type { RoundBookingType } from "@/types";
import {
  calcRoundPrice,
  roundSeatsConsumed,
  MAX_PRIVATE_PARTICIPANTS,
} from "@/lib/round-pricing";

const OPTION_SWING_VIDEO_PRICE = 3000;

type ReserveInput = {
  scheduleId: string;
  concern?: string;
  agreedCancelPolicy: boolean;
  agreedPhotoPost: boolean;
  optionSwingVideo?: boolean;
  /** ラウンドレッスン専用 */
  roundBookingType?: RoundBookingType;
  roundParticipantCount?: number;
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

    const isRound = schedule.lessonPlan.category === "ROUND";

    // 3. ラウンドレッスンの場合は予約タイプ & 人数必須
    let roundBookingType: RoundBookingType | null = null;
    let roundParticipantCount: number | null = null;
    let seatsToConsume = 1;
    let lessonPrice = schedule.lessonPlan.price;

    if (isRound) {
      if (!input.roundBookingType) {
        return { success: false, error: "予約タイプを選択してください" };
      }
      roundBookingType = input.roundBookingType;

      if (roundBookingType === "private") {
        const count = input.roundParticipantCount ?? 0;
        if (count < 1 || count > MAX_PRIVATE_PARTICIPANTS) {
          return {
            success: false,
            error: `参加人数は1〜${MAX_PRIVATE_PARTICIPANTS}名で指定してください`,
          };
        }
        roundParticipantCount = count;
      } else {
        // shared
        roundParticipantCount = 1;
      }

      lessonPrice = calcRoundPrice(roundBookingType, roundParticipantCount);
      seatsToConsume = roundSeatsConsumed(roundBookingType, roundParticipantCount);
    }

    const totalPrice = lessonPrice + (input.optionSwingVideo ? OPTION_SWING_VIDEO_PRICE : 0);

    // 4. 定員チェック
    const allReservations = await getAllReservations();
    const activeReservationsForSchedule = allReservations.filter(
      (r) => r.scheduleId === input.scheduleId && r.status !== "CANCELLED"
    );
    const occupiedSeats = activeReservationsForSchedule.reduce((sum, r) => {
      // 既存予約の席消費を正確に計算
      if (r.roundBookingType === "private" && r.roundParticipantCount) {
        return sum + r.roundParticipantCount;
      }
      return sum + 1;
    }, 0);

    if (occupiedSeats + seatsToConsume > schedule.maxAttendees) {
      return {
        success: false,
        error: `このスケジュールは残り${Math.max(0, schedule.maxAttendees - occupiedSeats)}席のみです`,
      };
    }

    // 重複予約チェック
    const duplicate = activeReservationsForSchedule.find((r) => r.userId === user.id);
    if (duplicate) {
      return { success: false, error: "このスケジュールには既に予約済みです" };
    }

    // 5. 予約データを保存
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
      roundBookingType,
      roundParticipantCount,
      totalPrice,
    });

    if (!saveResult.success) {
      return { success: false, error: saveResult.error };
    }

    // 6. ユーザーにメール送信（非ブロッキング）
    const displayName = userName || userEmail || "お客様";

    if (userEmail) {
      const { subject, html } = reservationRequestEmail(schedule, input.concern);
      await sendMail({ to: userEmail, subject, html }).catch((err) => {
        console.error("[submitReservation] user mail error:", err);
      });
    }

    // 7. 管理者にメール通知（非ブロッキング）
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
