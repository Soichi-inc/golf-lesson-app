"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getReservations, getReservationsByUserId } from "@/app/actions/reservations";
import { getDrillsByUserId } from "@/app/actions/drills";
import type { User, CustomerDetail } from "@/types";

/** Supabase Authから全USER（非ADMIN）を取得 */
export async function getCustomers(): Promise<User[]> {
  const admin = createAdminClient();
  const { data: { users }, error } = await admin.auth.admin.listUsers();

  if (error) {
    console.error("[getCustomers] error:", error);
    return [];
  }

  return users
    .filter((u) => u.user_metadata?.role !== "ADMIN")
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

/** 顧客ごとの予約件数（全ステータス）を集計 */
export async function getReservationCounts(): Promise<Record<string, number>> {
  const reservations = await getReservations();
  return reservations.reduce<Record<string, number>>((acc, r) => {
    acc[r.userId] = (acc[r.userId] ?? 0) + 1;
    return acc;
  }, {});
}

/** 顧客カルテ用の詳細データを取得 */
export async function getCustomerDetail(userId: string): Promise<CustomerDetail | null> {
  const admin = createAdminClient();
  const { data: { user }, error } = await admin.auth.admin.getUserById(userId);

  if (error || !user) {
    console.error("[getCustomerDetail] error:", error);
    return null;
  }

  // ADMINユーザーはカルテ対象外
  if (user.user_metadata?.role === "ADMIN") return null;

  const [reservations, drills] = await Promise.all([
    getReservationsByUserId(userId),
    getDrillsByUserId(userId),
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
    instructorNotes: [],
    drills,
  };
}
