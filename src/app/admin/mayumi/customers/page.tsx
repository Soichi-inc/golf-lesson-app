import type { Metadata } from "next";
import { CustomerTable } from "@/components/admin/customers/CustomerTable";
import { mockUsers, mockReservations } from "@/lib/mock/data";

export const metadata: Metadata = {
  title: "顧客管理",
};

export default function AdminCustomersPage() {
  // 顧客ごとの予約件数（完了済み）を集計
  const reservationCounts = mockReservations
    .filter((r) => r.status === "COMPLETED")
    .reduce<Record<string, number>>((acc, r) => {
      acc[r.userId] = (acc[r.userId] ?? 0) + 1;
      return acc;
    }, {});

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-light tracking-wide text-stone-800">
          顧客管理
        </h1>
        <p className="text-sm text-stone-500 mt-1">
          登録されている顧客の一覧です
        </p>
      </div>

      <CustomerTable users={mockUsers} reservationCounts={reservationCounts} />
    </div>
  );
}
