"use server";

import { differenceInCalendarDays } from "date-fns";
import type { Reservation, ReservationStatus } from "@/types";
import { getScheduleById } from "@/app/actions/schedules";
import { sendMail, notifyAdmin } from "@/lib/email/send";
import {
  reservationConfirmedEmail,
  reservationRejectedEmail,
  adminReservationApprovedEmail,
  adminReservationRejectedEmail,
} from "@/lib/email/templates";
import { requireAdmin, requireUser, handleActionError } from "@/lib/auth/guard";
import {
  readReservationRecords,
  getAllReservations as _getAllReservations,
  updateReservationStatusRecord,
} from "@/lib/data/reservations";

// ---------------------------------------------------------------------------
// 公開サーバーアクション
// ※ 内部用ヘルパーは全て `@/lib/data/reservations` に移動しクライアントに公開しない
// ---------------------------------------------------------------------------

/** 全予約を取得（admin専用） */
export async function getReservations(): Promise<Reservation[]> {
  await requireAdmin();
  return _getAllReservations();
}

/** 予約ステータスを更新（ADMIN専用） */
export async function updateReservationStatus(
  reservationId: string,
  newStatus: ReservationStatus,
  cancelReason?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();
    return updateReservationStatusRecord(reservationId, newStatus, cancelReason);
  } catch (e) {
    return handleActionError(e, "ステータス更新に失敗しました");
  }
}

/**
 * 顧客による予約キャンセル（所有者のみ）
 * ポリシー: レッスン日の7日前までのみ自己キャンセル可能（無料）。
 * それ以降はLINE公式からコーチに連絡してもらい、管理画面で手動キャンセル。
 */
export async function cancelReservationByCustomer(
  reservationId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await requireUser();
    const records = await readReservationRecords();
    const record = records.find((r) => r.id === reservationId);
    if (!record) return { success: false, error: "予約が見つかりません" };

    if (record.userId !== user.id) {
      return { success: false, error: "他のユーザーの予約はキャンセルできません" };
    }

    if (record.status === "CANCELLED") {
      return { success: false, error: "既にキャンセル済みです" };
    }
    if (record.status === "COMPLETED") {
      return { success: false, error: "完了済みの予約はキャンセルできません" };
    }

    const schedule = await getScheduleById(record.scheduleId);
    if (!schedule) return { success: false, error: "スケジュールが見つかりません" };

    const daysBefore = differenceInCalendarDays(
      new Date(schedule.startAt),
      new Date()
    );

    if (daysBefore < 7) {
      return {
        success: false,
        error:
          "レッスン7日前を過ぎたキャンセルは、LINE公式アカウントから直接コーチにご連絡ください。",
      };
    }

    return updateReservationStatusRecord(
      reservationId,
      "CANCELLED",
      "顧客によるキャンセル（7日前・無料）"
    );
  } catch (e) {
    return handleActionError(e, "キャンセルに失敗しました");
  }
}

/** 特定ユーザーの予約を取得（所有者本人またはADMIN） */
export async function getReservationsByUserId(userId: string): Promise<Reservation[]> {
  const user = await requireUser();
  if (user.role !== "ADMIN" && user.id !== userId) {
    throw new Error("他のユーザーの予約は閲覧できません");
  }
  const all = await _getAllReservations();
  return all.filter((r) => r.userId === userId);
}

/**
 * スケジュールID毎の有効な予約数を取得（認証不要・PII を含まない安全な集計）
 * CANCELLED以外を「埋まっている」扱い。スケジュール画面での満枠判定に使用。
 */
export async function getBookedCountsByScheduleId(): Promise<Record<string, number>> {
  const records = await readReservationRecords();
  return records.reduce<Record<string, number>>((acc, r) => {
    if (r.status !== "CANCELLED") {
      acc[r.scheduleId] = (acc[r.scheduleId] ?? 0) + 1;
    }
    return acc;
  }, {});
}

/** 予約を承認（CONFIRMED）＋ 顧客・管理者にメール送信（ADMIN専用） */
export async function approveReservation(
  reservationId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();
    const records = await readReservationRecords();
    const record = records.find((r) => r.id === reservationId);
    if (!record) return { success: false, error: "予約が見つかりません" };

    const result = await updateReservationStatusRecord(reservationId, "CONFIRMED");
    if (!result.success) return result;

    const schedule = await getScheduleById(record.scheduleId);
    if (!schedule) {
      console.warn("[approveReservation] schedule not found, email skipped");
      return { success: true };
    }

    const userName = record.userName || record.userEmail || "お客様";

    if (record.userEmail) {
      const { subject, html } = reservationConfirmedEmail(schedule);
      await sendMail({ to: record.userEmail, subject, html }).catch(console.error);
    }

    const adminTemplate = adminReservationApprovedEmail(schedule, userName, record.userEmail);
    await notifyAdmin(adminTemplate).catch(console.error);

    return { success: true };
  } catch (e) {
    return handleActionError(e, "承認処理に失敗しました");
  }
}

/** 予約を却下（CANCELLED）＋ 顧客・管理者にメール送信（ADMIN専用） */
export async function rejectReservation(
  reservationId: string,
  cancelReason?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();
    const records = await readReservationRecords();
    const record = records.find((r) => r.id === reservationId);
    if (!record) return { success: false, error: "予約が見つかりません" };

    const result = await updateReservationStatusRecord(reservationId, "CANCELLED", cancelReason);
    if (!result.success) return result;

    const schedule = await getScheduleById(record.scheduleId);
    if (!schedule) return { success: true };

    const userName = record.userName || record.userEmail || "お客様";

    if (record.userEmail) {
      const { subject, html } = reservationRejectedEmail(schedule, cancelReason);
      await sendMail({ to: record.userEmail, subject, html }).catch(console.error);
    }

    const adminTemplate = adminReservationRejectedEmail(schedule, userName, record.userEmail);
    await notifyAdmin(adminTemplate).catch(console.error);

    return { success: true };
  } catch (e) {
    return handleActionError(e, "却下処理に失敗しました");
  }
}

/** 予約を完了（COMPLETED）にマーク（ADMIN専用） */
export async function completeReservation(
  reservationId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();
    return updateReservationStatusRecord(reservationId, "COMPLETED");
  } catch (e) {
    return handleActionError(e, "完了処理に失敗しました");
  }
}
