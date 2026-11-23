"use server";

import { differenceInCalendarDays } from "date-fns";
import type { Reservation, ReservationStatus, Schedule } from "@/types";
import { getSchedules } from "@/app/actions/schedules";
import { sendMail, notifyAdmin } from "@/lib/email/send";
import {
  reservationConfirmedEmail,
  reservationRejectedEmail,
  reservationCancelledByCustomerEmail,
  reservationCancelledByAdminEmail,
  adminReservationApprovedEmail,
  adminReservationRejectedEmail,
  adminReservationCancelledByCustomerEmail,
  type ReservationFlexInfo,
} from "@/lib/email/templates";
import { requireAdmin, requireUser, handleActionError } from "@/lib/auth/guard";
import {
  readReservationRecords,
  getAllReservations as _getAllReservations,
  updateReservationStatusRecord,
  buildScheduleForRecord,
  type ReservationRecord,
} from "@/lib/data/reservations";

// ---------------------------------------------------------------------------
// 公開サーバーアクション
// ※ 内部用ヘルパーは全て `@/lib/data/reservations` に移動しクライアントに公開しない
//
// ステータスを変える処理の順番は必ず
//   1. 必要なデータを先に読む（読めなければここで中断。何も変わらない）
//   2. ステータスを保存する（現在のステータスの確認も同じロックの中で行う）
//   3. メールを送る（失敗しても保存済みの結果は変えない）
// とする。保存後に読み込みで失敗して「保存されたのにエラー表示」にならないようにするため。
// ---------------------------------------------------------------------------

/** メールに載せる日時・場所の情報。枠が削除済みなら予約時のスナップショットから復元する */
function scheduleForEmail(
  record: ReservationRecord,
  schedules: Schedule[]
): Schedule | null {
  const live = schedules.find((s) => s.id === record.scheduleId) ?? null;
  if (!live && !record.scheduleSnapshot) return null;
  return buildScheduleForRecord(record, live);
}

function flexInfoOf(record: ReservationRecord): ReservationFlexInfo | undefined {
  return record.indoorLocationType
    ? {
        indoorLocationType: record.indoorLocationType,
        requestedLocation: record.requestedLocation ?? null,
        requestedDuration: record.requestedDuration ?? null,
        usesTicketPack: record.usesTicketPack ?? null,
        totalPrice: record.totalPrice ?? null,
      }
    : undefined;
}

/** 全予約を取得（admin専用） */
export async function getReservations(): Promise<Reservation[]> {
  await requireAdmin();
  return _getAllReservations();
}

/**
 * 予約ステータスを更新（ADMIN専用）
 * 管理画面の「予約をキャンセル」「予約確定に戻す」から呼ばれる。
 * キャンセルの場合は、画面の案内どおり顧客へメールで通知する。
 */
export async function updateReservationStatus(
  reservationId: string,
  newStatus: ReservationStatus,
  cancelReason?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();
    const schedules = newStatus === "CANCELLED" ? await getSchedules() : [];

    const result = await updateReservationStatusRecord(reservationId, newStatus, {
      cancelReason,
      // 「予約確定に戻す」は実施済みからのみ。リクエストの承認は approveReservation を使う
      from: newStatus === "CONFIRMED" ? ["COMPLETED"] : undefined,
    });
    if (!result.success) return result;

    if (newStatus === "CANCELLED") {
      const { record } = result;
      const schedule = scheduleForEmail(record, schedules);
      if (schedule && record.userEmail) {
        const { subject, html } = reservationCancelledByAdminEmail(
          schedule,
          cancelReason,
          flexInfoOf(record)
        );
        await sendMail({ to: record.userEmail, subject, html }).catch(console.error);
      }
    }
    return { success: true };
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
    const [records, schedules] = await Promise.all([
      readReservationRecords(),
      getSchedules(),
    ]);
    const record = records.find((r) => r.id === reservationId);
    if (!record) return { success: false, error: "予約が見つかりません" };

    // 所有者判定: userId 一致、またはログイン済みメールアドレスの一致
    // （アカウント再登録で userId が変わった予約も本人ならキャンセル可能にする。
    //   メールは Supabase 認証で本人確認済みのため所有者証明として扱える）
    const emailMatches =
      !!user.email &&
      record.userEmail.trim().toLowerCase() === user.email.trim().toLowerCase();
    if (record.userId !== user.id && !emailMatches) {
      return { success: false, error: "他のユーザーの予約はキャンセルできません" };
    }

    if (record.status === "CANCELLED") {
      return { success: false, error: "既にキャンセル済みです" };
    }
    if (record.status === "COMPLETED") {
      return { success: false, error: "完了済みの予約はキャンセルできません" };
    }

    // スケジュール本体が削除済みでも、予約時スナップショットから情報を復元して
    // 表示・判定・通知を続行する（孤児予約でもキャンセル可能にする）
    const liveSchedule = schedules.find((s) => s.id === record.scheduleId) ?? null;
    const schedule = buildScheduleForRecord(record, liveSchedule);
    const hasDateInfo = !!liveSchedule || !!record.scheduleSnapshot;

    if (hasDateInfo) {
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
    }
    // 日付情報が一切ない旧孤児レコード（スケジュール削除済み・スナップショット無し）は
    // レッスン枠自体が存在しないため、7日前ルールを適用せず無条件でキャンセルを許可する。

    const result = await updateReservationStatusRecord(reservationId, "CANCELLED", {
      cancelReason: "顧客によるキャンセル（7日前・無料）",
      from: ["PENDING", "CONFIRMED"],
    });
    if (!result.success) return result;

    // 顧客・管理者へキャンセル通知メール（送信失敗してもキャンセル自体は成功扱い）
    const userName = record.userName || record.userEmail || "お客様";
    const flexInfo = flexInfoOf(record);

    if (record.userEmail) {
      const { subject, html } = reservationCancelledByCustomerEmail(schedule, flexInfo);
      await sendMail({ to: record.userEmail, subject, html }).catch(console.error);
    }

    const adminTemplate = adminReservationCancelledByCustomerEmail(
      schedule,
      userName,
      record.userEmail,
      flexInfo
    );
    await notifyAdmin(adminTemplate).catch(console.error);

    return { success: true };
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
  // 本人閲覧時はメールアドレス一致でも照合する
  // （アカウント再登録で userId が変わっても、同じメールなら過去の予約を表示できる）
  const selfEmail = user.id === userId ? user.email : null;
  const normalizedEmail = selfEmail?.trim().toLowerCase() || null;
  const all = await _getAllReservations();
  return all.filter(
    (r) =>
      r.userId === userId ||
      (normalizedEmail !== null &&
        r.user.email.trim().toLowerCase() === normalizedEmail)
  );
}

/**
 * スケジュールID毎の埋まり状況（認証不要・PII を含まない安全な集計）
 * 貸切予約が入っている枠は満枠扱い（席数 = maxAttendees+ を返して必ず満枠判定）
 * 通常／組み合わせは実際の席数を返す。
 */
export async function getBookedCountsByScheduleId(): Promise<Record<string, { count: number; privateLocked: boolean }>> {
  const records = await readReservationRecords();
  const active = records.filter((r) => r.status !== "CANCELLED");

  const result: Record<string, { count: number; privateLocked: boolean }> = {};
  for (const r of active) {
    if (!result[r.scheduleId]) {
      result[r.scheduleId] = { count: 0, privateLocked: false };
    }
    if (r.roundBookingType === "private") {
      // 貸切: 枠独占
      result[r.scheduleId].privateLocked = true;
      result[r.scheduleId].count += 1;
    } else {
      result[r.scheduleId].count += 1;
    }
  }
  return result;
}

/** 予約を承認（CONFIRMED）＋ 顧客・管理者にメール送信（ADMIN専用） */
export async function approveReservation(
  reservationId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();
    const schedules = await getSchedules();

    // 承認できるのは「リクエスト中」の予約だけ。お客様が先にキャンセルしていた場合は
    // ここで止まり、確定メールは送られない
    const result = await updateReservationStatusRecord(reservationId, "CONFIRMED", {
      from: ["PENDING"],
    });
    if (!result.success) return result;

    const { record } = result;
    const schedule = scheduleForEmail(record, schedules);
    if (!schedule) {
      console.warn("[approveReservation] schedule not found, email skipped");
      return { success: true };
    }

    const userName = record.userName || record.userEmail || "お客様";
    const flexInfo = flexInfoOf(record);

    if (record.userEmail) {
      const { subject, html } = reservationConfirmedEmail(schedule, flexInfo);
      await sendMail({ to: record.userEmail, subject, html }).catch(console.error);
    }

    const adminTemplate = adminReservationApprovedEmail(schedule, userName, record.userEmail, flexInfo);
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
    const schedules = await getSchedules();

    const result = await updateReservationStatusRecord(reservationId, "CANCELLED", {
      cancelReason,
      from: ["PENDING"],
    });
    if (!result.success) return result;

    const { record } = result;
    const schedule = scheduleForEmail(record, schedules);
    if (!schedule) return { success: true };

    const userName = record.userName || record.userEmail || "お客様";
    const flexInfo = flexInfoOf(record);

    if (record.userEmail) {
      const { subject, html } = reservationRejectedEmail(schedule, cancelReason, flexInfo);
      await sendMail({ to: record.userEmail, subject, html }).catch(console.error);
    }

    const adminTemplate = adminReservationRejectedEmail(schedule, userName, record.userEmail, flexInfo);
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
    const result = await updateReservationStatusRecord(reservationId, "COMPLETED", {
      from: ["CONFIRMED"],
    });
    return result.success ? { success: true } : result;
  } catch (e) {
    return handleActionError(e, "完了処理に失敗しました");
  }
}
