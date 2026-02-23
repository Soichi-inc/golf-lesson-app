import type { Metadata } from "next";
import { AdminReservationManager } from "@/components/admin/reservations/AdminReservationManager";
import { getReservations } from "@/app/actions/reservations";

export const metadata: Metadata = { title: "予約管理" };

export const dynamic = "force-dynamic";

export default async function AdminReservationsPage() {
  const reservations = await getReservations();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-light tracking-wide text-stone-800">予約管理</h1>
        <p className="text-sm text-stone-500 mt-1">予約リクエストの承認・キャンセル対応</p>
      </div>
      <AdminReservationManager reservations={reservations} />
    </div>
  );
}
