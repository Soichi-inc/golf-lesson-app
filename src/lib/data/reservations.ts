/**
 * 予約データの内部アクセス層
 *
 * ⚠️ このファイルは server-only。"use server" ではないため、
 * サーバーコンポーネント / 他のサーバーアクションからのみ import 可能。
 * クライアントから直接呼び出し不可（= Next.js server action公開されない）。
 *
 * 利用方針:
 * - 認証・認可はここでは行わない（呼び出し側が責任を持つ）
 * - PII を返すため、クライアントに公開する関数ではない
 */
import "server-only";
import type {
  IndoorFlexDuration,
  IndoorLocationType,
  LessonCategory,
  Reservation,
  ReservationStatus,
  RoundBookingType,
  Schedule,
} from "@/types";
import { getSchedules } from "@/app/actions/schedules";
import { newRecordId } from "@/lib/data/ids";
import {
  applyReservationStatusChange,
  checkReservationCapacity,
} from "@/lib/data/reservation-rules";
import {
  readJsonFromStorage,
  updateJsonInStorage,
  type UpdateOutcome,
} from "@/lib/storage";

const FILE_PATH = "reservations.json";

/**
 * 予約時点のスケジュール情報スナップショット。
 * 予約は scheduleId で参照するが、参照先スケジュールが後から削除・再構築されると
 * 「（不明なプラン）・日付不明・キャンセル不可」の孤児予約になる事故が起きた。
 * 予約時に必要情報を非正規化保存し、スケジュールが消えても
 * 表示・キャンセル判定・メール通知が正しく動くことを保証する。
 */
export type ScheduleSnapshot = {
  planName: string;
  planCategory: LessonCategory;
  planPrice: number;
  planDuration: number;
  startAt: string; // ISO
  endAt: string; // ISO
  location: string | null;
  teeOffTime: string | null;
};

export function makeScheduleSnapshot(schedule: Schedule): ScheduleSnapshot {
  return {
    planName: schedule.lessonPlan.name,
    planCategory: schedule.lessonPlan.category,
    planPrice: schedule.lessonPlan.price,
    planDuration: schedule.lessonPlan.duration,
    startAt: new Date(schedule.startAt).toISOString(),
    endAt: new Date(schedule.endAt).toISOString(),
    location: schedule.location,
    teeOffTime: schedule.teeOffTime,
  };
}

export type ReservationRecord = {
  id: string;
  userId: string;
  userName: string | null;
  userEmail: string;
  scheduleId: string;
  status: ReservationStatus;
  concern: string | null;
  agreedCancelPolicy: boolean;
  agreedPhotoPost: boolean;
  optionSwingVideo: boolean;
  /** ラウンドレッスン用（他カテゴリではnull） */
  roundBookingType: RoundBookingType | null;
  roundParticipantCount: number | null;
  /** インドア・場所リクエスト枠用（互換のため optional） */
  indoorLocationType?: IndoorLocationType | null;
  requestedLocation?: string | null;
  requestedDuration?: IndoorFlexDuration | null;
  usesTicketPack?: boolean | null;
  existingPlanId?: string | null;
  /** ラウンド: お客様希望コース */
  requestedCourse?: string | null;
  /** 緊急連絡先電話番号 */
  emergencyPhone?: string | null;
  /** 予約時に確定した合計料金 */
  totalPrice: number | null;
  /** 予約時点のスケジュール情報（スケジュール削除後のフォールバック用・旧レコードは未設定） */
  scheduleSnapshot?: ScheduleSnapshot | null;
  cancelledAt: string | null;
  cancelReason: string | null;
  createdAt: string;
  updatedAt: string;
};

/**
 * 予約レコードから表示・判定用の Schedule を構築する。
 * 優先順: ライブのスケジュール > 予約時スナップショット > プレースホルダ。
 * スナップショットが無い旧孤児レコードのみ「（不明なプラン）」表示になる。
 */
export function buildScheduleForRecord(
  r: ReservationRecord,
  live: Schedule | null | undefined
): Schedule {
  if (live) return live;
  const snap = r.scheduleSnapshot;
  return {
    id: r.scheduleId,
    lessonPlanId: "",
    lessonPlan: {
      id: "",
      name: snap?.planName ?? "（不明なプラン）",
      category: snap?.planCategory ?? ("REGULAR" as const),
      description: null,
      price: snap?.planPrice ?? 0,
      duration: snap?.planDuration ?? 0,
      maxAttendees: 1,
      isPublished: false,
      displayOrder: 0,
      createdAt: new Date(r.createdAt),
      updatedAt: new Date(r.createdAt),
    },
    startAt: snap ? new Date(snap.startAt) : new Date(r.createdAt),
    endAt: snap ? new Date(snap.endAt) : new Date(r.createdAt),
    location: snap?.location ?? null,
    maxAttendees: 1,
    isAvailable: false,
    note: null,
    teeOffTime: snap?.teeOffTime ?? null,
    allowAnyLocation: false,
    createdAt: new Date(r.createdAt),
    updatedAt: new Date(r.createdAt),
  };
}

export async function readReservationRecords(): Promise<ReservationRecord[]> {
  return readJsonFromStorage<ReservationRecord[]>(FILE_PATH, [], { shape: "array" });
}

/**
 * 予約データを書き換える。
 * 排他ロックの中で最新の内容を読み、mutate の結果を保存する（詳細は `@/lib/storage`）。
 */
function updateReservationRecords<R>(
  mutate: (records: ReservationRecord[]) => UpdateOutcome<ReservationRecord[], R>
): Promise<R> {
  return updateJsonInStorage<ReservationRecord[], R>(FILE_PATH, [], mutate, {
    shape: "array",
  });
}

/** 全予約を取得（scheduleとuser情報を含む完全なReservation型） */
export async function getAllReservations(): Promise<Reservation[]> {
  const [records, allSchedules] = await Promise.all([
    readReservationRecords(),
    getSchedules(),
  ]);

  return records.map((r) => {
    const schedule = allSchedules.find((s) => s.id === r.scheduleId);
    return {
      id: r.id,
      userId: r.userId,
      user: {
        id: r.userId,
        email: r.userEmail,
        name: r.userName,
        phone: null,
        role: "USER" as const,
        avatarUrl: null,
        createdAt: new Date(r.createdAt),
        updatedAt: new Date(r.updatedAt),
      },
      scheduleId: r.scheduleId,
      schedule: buildScheduleForRecord(r, schedule),
      status: r.status,
      concern: r.concern,
      agreedCancelPolicy: r.agreedCancelPolicy,
      agreedPhotoPost: r.agreedPhotoPost,
      optionSwingVideo: r.optionSwingVideo ?? false,
      roundBookingType: r.roundBookingType ?? null,
      roundParticipantCount: r.roundParticipantCount ?? null,
      indoorLocationType: r.indoorLocationType ?? null,
      requestedLocation: r.requestedLocation ?? null,
      requestedDuration: r.requestedDuration ?? null,
      usesTicketPack: r.usesTicketPack ?? null,
      existingPlanId: r.existingPlanId ?? null,
      requestedCourse: r.requestedCourse ?? null,
      emergencyPhone: r.emergencyPhone ?? null,
      totalPrice:
        r.totalPrice ??
        schedule?.lessonPlan.price ??
        r.scheduleSnapshot?.planPrice ??
        0,
      scheduleDataLost: !schedule && !r.scheduleSnapshot,
      cancelledAt: r.cancelledAt ? new Date(r.cancelledAt) : null,
      cancelReason: r.cancelReason,
      createdAt: new Date(r.createdAt),
      updatedAt: new Date(r.updatedAt),
    };
  });
}

/**
 * 特定ユーザーの予約を取得
 *
 * email を渡すと userId 一致に加えてメールアドレス一致（大文字小文字無視）でも照合する。
 * パスワードリセット不能期間にアカウントを再登録したユーザーは userId が変わり、
 * 旧アカウントで取った予約が履歴から消える事故が起きたため、
 * 本人確認済みメール（Supabaseログイン）での照合をフォールバックとして持つ。
 */
export async function getReservationsByUserId(
  userId: string,
  email?: string | null
): Promise<Reservation[]> {
  const all = await getAllReservations();
  const normalizedEmail = email?.trim().toLowerCase() || null;
  return all.filter(
    (r) =>
      r.userId === userId ||
      (normalizedEmail !== null &&
        r.user.email.trim().toLowerCase() === normalizedEmail)
  );
}

// ---------------------------------------------------------------------------
// ステータス変更
// ---------------------------------------------------------------------------

export type StatusChangeResult =
  | { success: true; record: ReservationRecord }
  | { success: false; error: string };

/**
 * 予約ステータス更新（ストレージ書込のみ。認可チェックは呼び出し側）
 * 現在のステータスから移れるかどうかの確認も、保存と同じロックの中で行う。
 */
export async function updateReservationStatusRecord(
  reservationId: string,
  newStatus: ReservationStatus,
  options: { cancelReason?: string; from?: ReservationStatus[] } = {}
): Promise<StatusChangeResult> {
  return updateReservationRecords<StatusChangeResult>((records) => {
    const change = applyReservationStatusChange(records, reservationId, newStatus, {
      ...options,
      nowIso: new Date().toISOString(),
    });
    if (!change.ok) return { result: { success: false, error: change.error } };
    return {
      data: change.records,
      result: { success: true, record: change.record },
    };
  });
}

// ---------------------------------------------------------------------------
// 予約の追加
// ---------------------------------------------------------------------------

export type InsertReservationResult = {
  success: boolean;
  reservationId?: string;
  error?: string;
};

/**
 * 予約を追加（ストレージ書込のみ。認可チェックは呼び出し側）
 * 空き状況の確認（重複・満員・貸切）も保存と同じロックの中で行う。
 */
export async function insertReservationRecord(input: {
  userId: string;
  userName: string | null;
  userEmail: string;
  scheduleId: string;
  concern?: string;
  agreedCancelPolicy: boolean;
  agreedPhotoPost: boolean;
  optionSwingVideo?: boolean;
  roundBookingType?: RoundBookingType | null;
  roundParticipantCount?: number | null;
  indoorLocationType?: IndoorLocationType | null;
  requestedLocation?: string | null;
  requestedDuration?: IndoorFlexDuration | null;
  usesTicketPack?: boolean | null;
  existingPlanId?: string | null;
  requestedCourse?: string | null;
  emergencyPhone?: string | null;
  totalPrice: number;
  /** 予約対象のスケジュール本体。予約時点の情報をスナップショット保存し、定員の判定にも使う */
  schedule: Schedule;
}): Promise<InsertReservationResult> {
  return updateReservationRecords<InsertReservationResult>((records) => {
    const refusal = checkReservationCapacity(records, {
      userId: input.userId,
      scheduleId: input.scheduleId,
      roundBookingType: input.roundBookingType ?? null,
      maxAttendees: input.schedule.maxAttendees,
    });
    if (refusal) return { result: { success: false, error: refusal } };

    const now = new Date();
    const id = newRecordId("rsv", records, now.getTime());
    const nowIso = now.toISOString();

    const record: ReservationRecord = {
      id,
      userId: input.userId,
      userName: input.userName,
      userEmail: input.userEmail,
      scheduleId: input.scheduleId,
      status: "PENDING",
      concern: input.concern || null,
      agreedCancelPolicy: input.agreedCancelPolicy,
      agreedPhotoPost: input.agreedPhotoPost,
      optionSwingVideo: input.optionSwingVideo ?? false,
      roundBookingType: input.roundBookingType ?? null,
      roundParticipantCount: input.roundParticipantCount ?? null,
      indoorLocationType: input.indoorLocationType ?? null,
      requestedLocation: input.requestedLocation ?? null,
      requestedDuration: input.requestedDuration ?? null,
      usesTicketPack: input.usesTicketPack ?? null,
      existingPlanId: input.existingPlanId ?? null,
      requestedCourse: input.requestedCourse ?? null,
      emergencyPhone: input.emergencyPhone ?? null,
      totalPrice: input.totalPrice,
      scheduleSnapshot: makeScheduleSnapshot(input.schedule),
      cancelledAt: null,
      cancelReason: null,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    return {
      data: [...records, record],
      result: { success: true, reservationId: id },
    };
  });
}
