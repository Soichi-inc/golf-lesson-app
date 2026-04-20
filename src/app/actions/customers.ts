"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getAllReservations, getReservationsByUserId } from "@/lib/data/reservations";
import { getDrillsByUserId } from "@/lib/data/drills";
import { getInstructorNotesByUserId } from "@/lib/data/instructorNotes";
import { getScoresByUserId } from "@/lib/data/scores";
import { getNotesByUserId } from "@/lib/data/notes";
import { requireAdmin } from "@/lib/auth/guard";
import type { User, CustomerDetail } from "@/types";

/**
 * Supabase Authから全USER（非ADMIN）を取得（ADMIN専用）
 * ※ listUsersは標準ページサイズが50件。ユーザー数が50を超える場合はpage引数で
 * ページング取得する必要がある。
 */
export async function getCustomers(): Promise<User[]> {
  await requireAdmin();
  const admin = createAdminClient();

  // 1ページ最大1000件、最大10ページまで（合計1万件）取得
  type ListUserItem = Awaited<
    ReturnType<typeof admin.auth.admin.listUsers>
  >["data"]["users"][number];
  const all: ListUserItem[] = [];

  for (let page = 1; page <= 10; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) {
      console.error("[getCustomers] error:", error);
      break;
    }
    if (!data.users.length) break;
    all.push(...data.users);
    if (data.users.length < 1000) break;
  }

  return all
    .filter((u) => u.user_metadata?.role !== "ADMIN" && u.app_metadata?.role !== "ADMIN")
    .map((u) => ({
      id: u.id,
      email: u.email || "",
      name: u.user_metadata?.full_name || null,
      phone: u.phone || null,
      role: "USER" as const,
      avatarUrl: u.user_metadata?.avatar_url || null,
      createdAt: new Date(u.created_at),
      updatedAt: new Date(u.updated_at || u.created_at),
    }));
}

/** 顧客ごとの予約件数（全ステータス）を集計（ADMIN専用） */
export async function getReservationCounts(): Promise<Record<string, number>> {
  await requireAdmin();
  const reservations = await getAllReservations();
  return reservations.reduce<Record<string, number>>((acc, r) => {
    acc[r.userId] = (acc[r.userId] ?? 0) + 1;
    return acc;
  }, {});
}

/** 顧客カルテ用の詳細データを取得（ADMIN専用） */
export async function getCustomerDetail(userId: string): Promise<CustomerDetail | null> {
  await requireAdmin();
  const admin = createAdminClient();
  const { data: { user }, error } = await admin.auth.admin.getUserById(userId);

  if (error || !user) {
    console.error("[getCustomerDetail] error:", error);
    return null;
  }

  // ADMINユーザーはカルテ対象外
  if (user.user_metadata?.role === "ADMIN" || user.app_metadata?.role === "ADMIN") return null;

  const [reservations, drills, instructorNotes, roundScores, userNotes] = await Promise.all([
    getReservationsByUserId(userId),
    getDrillsByUserId(userId),
    getInstructorNotesByUserId(userId),
    getScoresByUserId(userId),
    getNotesByUserId(userId),
  ]);

  return {
    id: user.id,
    email: user.email || "",
    name: user.user_metadata?.full_name || null,
    phone: user.phone || null,
    role: "USER" as const,
    avatarUrl: user.user_metadata?.avatar_url || null,
    createdAt: new Date(user.created_at),
    updatedAt: new Date(user.updated_at || user.created_at),
    reservations: reservations.map((r) => ({
      ...r,
      schedule: {
        ...r.schedule,
        lessonPlan: r.schedule.lessonPlan,
      },
    })),
    instructorNotes,
    drills,
    roundScores,
    userNotes,
  };
}
