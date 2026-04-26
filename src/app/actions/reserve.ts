"use server";

import { sendMail, notifyAdmin } from "@/lib/email/send";
import { reservationRequestEmail, adminNewReservationEmail } from "@/lib/email/templates";
import { getScheduleById, getLessonPlans } from "@/app/actions/schedules";
import { requireUser, handleActionError } from "@/lib/auth/guard";
import {
  insertReservationRecord,
  getAllReservations,
} from "@/lib/data/reservations";
import type {
  IndoorFlexDuration,
  IndoorLocationType,
  RoundBookingType,
} from "@/types";
import {
  calcRoundPrice,
  MAX_PRIVATE_PARTICIPANTS,
} from "@/lib/round-pricing";
import {
  INDOOR_FLEX_DURATIONS,
  calcIndoorFlexPrice,
} from "@/lib/indoor-flex-pricing";

const OPTION_SWING_VIDEO_PRICE = 3000;

type ReserveInput = {
  scheduleId: string;
  concern?: string;
  agreedCancelPolicy: boolean;
  agreedPhotoPost: boolean;
  optionSwingVideo?: boolean;
  /** 緊急連絡先電話番号（必須） */
  emergencyPhone: string;
  /** ラウンドレッスン専用 */
  roundBookingType?: RoundBookingType;
  roundParticipantCount?: number;
  /** ラウンド: お客様希望コース */
  requestedCourse?: string;
  /** インドア・場所リクエスト枠専用 */
  indoorLocationType?: IndoorLocationType;
  /** indoorLocationType === "existing" の場合：選択した既存プランID */
  existingPlanId?: string;
  /** indoorLocationType === "custom" の場合：自由記述の場所 */
  requestedLocation?: string;
  requestedDuration?: IndoorFlexDuration;
  usesTicketPack?: boolean;
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
    const isIndoorFlex = !isRound && schedule.allowAnyLocation;

    // 緊急連絡先（必須）
    const emergencyPhoneTrimmed = (input.emergencyPhone ?? "").trim();
    if (!emergencyPhoneTrimmed) {
      return { success: false, error: "緊急連絡先（電話番号）を入力してください" };
    }
    if (!/^[0-9+\-() 　]{8,20}$/.test(emergencyPhoneTrimmed)) {
      return { success: false, error: "電話番号の形式が正しくありません" };
    }

    // 3. ラウンドレッスンの場合は予約タイプ & 人数必須
    let roundBookingType: RoundBookingType | null = null;
    let roundParticipantCount: number | null = null;
    let requestedCourse: string | null = null;
    let lessonPrice = schedule.lessonPlan.price;

    // インドア・場所リクエスト枠
    let indoorLocationType: IndoorLocationType | null = null;
    let requestedLocation: string | null = null;
    let requestedDuration: IndoorFlexDuration | null = null;
    let usesTicketPack: boolean | null = null;
    let existingPlanId: string | null = null;

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

      const trimmedCourse = (input.requestedCourse ?? "").trim();
      requestedCourse = trimmedCourse ? trimmedCourse.slice(0, 200) : null;
    } else if (isIndoorFlex) {
      if (!input.indoorLocationType) {
        return { success: false, error: "場所の選択方法を選んでください" };
      }
      indoorLocationType = input.indoorLocationType;

      if (indoorLocationType === "custom") {
        const trimmedLocation = (input.requestedLocation ?? "").trim();
        if (!trimmedLocation) {
          return { success: false, error: "ご希望の場所を入力してください" };
        }
        requestedLocation = trimmedLocation;

        const dur = input.requestedDuration;
        if (!dur || !INDOOR_FLEX_DURATIONS.includes(dur)) {
          return { success: false, error: "レッスン時間（50分／70分）を選択してください" };
        }
        requestedDuration = dur;
        usesTicketPack = !!input.usesTicketPack;
        lessonPrice = calcIndoorFlexPrice(dur, usesTicketPack);
      } else {
        // existing: 選んだ既存プランの情報で確定
        if (!input.existingPlanId) {
          return { success: false, error: "店舗（既存プラン）を選択してください" };
        }
        const allPlans = await getLessonPlans();
        const picked = allPlans.find(
          (p) => p.id === input.existingPlanId && p.category === "REGULAR"
        );
        if (!picked) {
          return { success: false, error: "選択された店舗プランが見つかりません" };
        }
        existingPlanId = picked.id;
        requestedLocation = picked.name;
        // プランの所要時間に応じて 50/70分 に丸める。それ以外（25分など）はnull扱いで枠通り
        if (picked.duration === 50 || picked.duration === 70) {
          requestedDuration = picked.duration;
        }
        lessonPrice = picked.price;
      }
    }

    const totalPrice = lessonPrice + (input.optionSwingVideo ? OPTION_SWING_VIDEO_PRICE : 0);

    // 4. 排他制御：既存の有効予約をチェック
    const allReservations = await getAllReservations();
    const activeReservationsForSchedule = allReservations.filter(
      (r) => r.scheduleId === input.scheduleId && r.status !== "CANCELLED"
    );

    // 重複予約チェック
    const duplicate = activeReservationsForSchedule.find((r) => r.userId === user.id);
    if (duplicate) {
      return { success: false, error: "このスケジュールには既に予約済みです" };
    }

    // 既存予約の内訳を確認
    const existingPrivate = activeReservationsForSchedule.find(
      (r) => r.roundBookingType === "private"
    );
    const existingShared = activeReservationsForSchedule.filter(
      (r) => r.roundBookingType === "shared"
    );
    const existingRegular = activeReservationsForSchedule.filter(
      (r) => !r.roundBookingType
    );

    if (roundBookingType === "private") {
      // 貸切予約は「枠全体を独占」するため、他の予約が1件でもあれば不可
      if (activeReservationsForSchedule.length > 0) {
        return {
          success: false,
          error:
            "この枠には既に他のご予約が入っているため、貸切予約はできません。組み合わせ予約または別の日時をお選びください。",
        };
      }
    } else if (roundBookingType === "shared") {
      // 組み合わせ予約: 貸切との同居は不可
      if (existingPrivate) {
        return {
          success: false,
          error: "この枠は既に貸切予約が入っているため、予約できません。",
        };
      }
      // 組み合わせ同士の定員チェック（1人1席）
      if (existingShared.length + 1 > schedule.maxAttendees) {
        return { success: false, error: "このスケジュールは満員です" };
      }
    } else {
      // ラウンド以外（通常レッスン）: 既存が1件でもあれば満員
      if (existingRegular.length + 1 > schedule.maxAttendees) {
        return { success: false, error: "このスケジュールは満員です" };
      }
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
      indoorLocationType,
      requestedLocation,
      requestedDuration,
      usesTicketPack,
      existingPlanId,
      requestedCourse,
      emergencyPhone: emergencyPhoneTrimmed,
      totalPrice,
    });

    if (!saveResult.success) {
      return { success: false, error: saveResult.error };
    }

    // 6. ユーザーにメール送信（非ブロッキング）
    const displayName = userName || userEmail || "お客様";

    const flexInfo = {
      indoorLocationType,
      requestedLocation,
      requestedDuration,
      usesTicketPack,
      totalPrice,
      requestedCourse,
      emergencyPhone: emergencyPhoneTrimmed,
    };

    if (userEmail) {
      const { subject, html } = reservationRequestEmail(
        schedule,
        input.concern,
        flexInfo
      );
      await sendMail({ to: userEmail, subject, html }).catch((err) => {
        console.error("[submitReservation] user mail error:", err);
      });
    }

    // 7. 管理者にメール通知（非ブロッキング）
    const adminTemplate = adminNewReservationEmail(
      schedule,
      displayName,
      userEmail || "不明",
      input.concern,
      flexInfo
    );
    await notifyAdmin(adminTemplate).catch(console.error);

    return { success: true, reservationId: saveResult.reservationId };
  } catch (e) {
    return handleActionError(e, "予約処理に失敗しました");
  }
}
