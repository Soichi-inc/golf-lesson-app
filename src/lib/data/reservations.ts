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
  Reservation,
  ReservationStatus,
  RoundBookingType,
} from "@/types";
import { getSchedules } from "@/app/actions/schedules";
import { readJsonFromStorage, writeJsonToStorage } from "@/lib/storage";

const FILE_PATH = "reservations.json";

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
  /** 予約時に確定した合計料金 */
  totalPrice: number | null;
  cancelledAt: string | null;
  cancelReason: string | null;
  createdAt: string;
  updatedAt: string;
};

export async function readReservationRecords(): Promise<ReservationRecord[]> {
  return readJsonFromStorage<ReservationRecord[]>(FILE_PATH, []);
}

export async function writeReservationRecords(
  records: ReservationRecord[]
): Promise<void> {
  await writeJsonToStorage(FILE_PATH, records);
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
      schedule: schedule ?? {
        id: r.scheduleId,
        lessonPlanId: "",
        lessonPlan: {
          id: "",
          name: "（不明なプラン）",
          category: "REGULAR" as const,
          description: null,
          price: 0,
          duration: 0,
          maxAttendees: 1,
          isPublished: false,
          displayOrder: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        startAt: new Date(r.createdAt),
        endAt: new Date(r.createdAt),
        location: null,
        maxAttendees: 1,
        isAvailable: false,
        note: null,
        teeOffTime: null,
        allowAnyLocation: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
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
      totalPrice: r.totalPrice ?? (schedule?.lessonPlan.price ?? 0),
      cancelledAt: r.cancelledAt ? new Date(r.cancelledAt) : null,
      cancelReason: r.cancelReason,
      createdAt: new Date(r.createdAt),
      updatedAt: new Date(r.updatedAt),
    };
  });
}

/** 特定ユーザーの予約を取得 */
export async function getReservationsByUserId(
  userId: string
): Promise<Reservation[]> {
  const all = await getAllReservations();
  return all.filter((r) => r.userId === userId);
}

/** 予約ステータス更新（ストレージ書込のみ。認可チェックは呼び出し側） */
export async function updateReservationStatusRecord(
  reservationId: string,
  newStatus: ReservationStatus,
  cancelReason?: string
): Promise<{ success: boolean; error?: string }> {
  const records = await readReservationRecords();
  const idx = records.findIndex((r) => r.id === reservationId);
  if (idx === -1) return { success: false, error: "予約が見つかりません" };

  records[idx].status = newStatus;
  records[idx].updatedAt = new Date().toISOString();
  if (newStatus === "CANCELLED") {
    records[idx].cancelledAt = new Date().toISOString();
    records[idx].cancelReason = cancelReason || null;
  }

  await writeReservationRecords(records);
  return { success: true };
}

/** 予約を追加（ストレージ書込のみ。認可チェックは呼び出し側） */
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
  totalPrice: number;
}): Promise<{ success: boolean; reservationId?: string; error?: string }> {
  const records = await readReservationRecords();
  const id = `rsv-${Date.now()}`;
  const now = new Date().toISOString();

  records.push({
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
    totalPrice: input.totalPrice,
    cancelledAt: null,
    cancelReason: null,
    createdAt: now,
    updatedAt: now,
  });

  await writeReservationRecords(records);
  return { success: true, reservationId: id };
}
