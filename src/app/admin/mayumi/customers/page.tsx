import type { Metadata } from "next";
import { CustomerTable } from "@/components/admin/customers/CustomerTable";
import { getCustomers, getReservationCounts } from "@/app/actions/customers";

export const metadata: Metadata = {
  title: "顧客管理",
};

export const dynamic = "force-dynamic";

export default async function AdminCustomersPage() {
  const [users, reservationCounts] = await Promise.all([
    getCustomers(),
    getReservationCounts(),
  ]);

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

      <CustomerTable users={users} reservationCounts={reservationCounts} />
    </div>
  );
}
