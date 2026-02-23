import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { MyReservationList } from "@/components/customer/mypage/MyReservationList";

export const metadata: Metadata = { title: "予約履歴" };

export default function MyReservationsPage() {
  // 実装予定: Supabase から取得したログインユーザーの予約を渡す
  const reservations: import("@/types").Reservation[] = [];

  return (
    <main className="section-padding">
      <div className="content-container max-w-2xl">
        <div className="mb-6">
          <Link
            href="/mypage"
            className="inline-flex items-center gap-1 text-xs text-stone-400 hover:text-stone-600 transition-colors mb-4"
          >
            <ChevronLeft className="size-3.5" />
            マイページ
          </Link>
          <h1 className="text-xl font-light tracking-wide text-stone-800">予約履歴</h1>
        </div>
        <MyReservationList reservations={reservations} />
      </div>
    </main>
  );
}
