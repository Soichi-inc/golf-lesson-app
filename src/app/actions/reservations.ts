"use server";

import fs from "fs/promises";
import path from "path";
import type { Reservation, ReservationStatus } from "@/types";
import { mockSchedules } from "@/lib/mock/data";

// ---------------------------------------------------------------------------
// JSON file based reservation storage (MVP)
// ---------------------------------------------------------------------------

const DATA_DIR = path.join(process.cwd(), "data");
const RESERVATIONS_PATH = path.join(DATA_DIR, "reservations.json");

/** JSON内の保存形式（Dateはstring） */
type ReservationRecord = {
  id: string;
  userId: string;
  userName: string | null;
  userEmail: string;
  scheduleId: string;
  status: ReservationStatus;
  concern: string | null;
  agreedCancelPolicy: boolean;
  agreedPhotoPost: boolean;
  cancelledAt: string | null;
  cancelReason: string | null;
  createdAt: string;
  updatedAt: string;
};

/** 予約一覧を読み込み */
async function readReservations(): Promise<ReservationRecord[]> {
  try {
    const raw = await fs.readFile(RESERVATIONS_PATH, "utf-8");
    return JSON.parse(raw) as ReservationRecord[];
  } catch {
    return [];
  }
}

/** 予約一覧を保存 */
async function writeReservations(records: ReservationRecord[]): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(RESERVATIONS_PATH, JSON.stringify(records, null, 2), "utf-8");
}

/** 予約を追加 */
export async function addReservation(input: {
  userId: string;
  userName: string | null;
  userEmail: string;
  scheduleId: string;
  concern?: string;
  agreedCancelPolicy: boolean;
  agreedPhotoPost: boolean;
}): Promise<{ success: boolean; reservationId?: string; error?: string }> {
  try {
    const records = await readReservations();
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
      cancelledAt: null,
      cancelReason: null,
      createdAt: now,
      updatedAt: now,
    });

    await writeReservations(records);
    return { success: true, reservationId: id };
  } catch (e) {
    console.error("[addReservation]", e);
    return { success: false, error: "予約の保存に失敗しました" };
  }
}

/** 全予約を取得（admin用 — scheduleとuser情報を含む） */
export async function getReservations(): Promise<Reservation[]> {
  const records = await readReservations();

  return records.map((r) => {
    const schedule = mockSchedules.find((s) => s.id === r.scheduleId);
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
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      status: r.status,
      concern: r.concern,
      agreedCancelPolicy: r.agreedCancelPolicy,
      agreedPhotoPost: r.agreedPhotoPost,
      cancelledAt: r.cancelledAt ? new Date(r.cancelledAt) : null,
      cancelReason: r.cancelReason,
      createdAt: new Date(r.createdAt),
      updatedAt: new Date(r.updatedAt),
    };
  });
}

/** 予約ステータスを更新 */
export async function updateReservationStatus(
  reservationId: string,
  newStatus: ReservationStatus,
  cancelReason?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const records = await readReservations();
    const idx = records.findIndex((r) => r.id === reservationId);
    if (idx === -1) return { success: false, error: "予約が見つかりません" };

    records[idx].status = newStatus;
    records[idx].updatedAt = new Date().toISOString();
    if (newStatus === "CANCELLED") {
      records[idx].cancelledAt = new Date().toISOString();
      records[idx].cancelReason = cancelReason || null;
    }

    await writeReservations(records);
    return { success: true };
  } catch (e) {
    console.error("[updateReservationStatus]", e);
    return { success: false, error: "ステータス更新に失敗しました" };
  }
}

/** 特定ユーザーの予約を取得 */
export async function getReservationsByUserId(userId: string): Promise<Reservation[]> {
  const all = await getReservations();
  return all.filter((r) => r.userId === userId);
}
